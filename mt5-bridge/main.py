"""
MetaTrader 5 Bridge Microservice
================================
Runs on a Windows VPS / PC with MT5 terminal installed and logged in.

Endpoints:
  GET  /health
  GET  /price?symbol=EURUSD
  GET  /candles?symbol=EURUSD&timeframe=M15&count=300
  POST /signal
  POST /place_order
  POST /close_order
  GET  /positions

Auth: X-API-Key header
"""

from __future__ import annotations

import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from typing import Any, Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from strategy_engine import generate_signal, candles_from_rates

logger = logging.getLogger("mt5_bridge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

API_KEY = os.getenv("MT5_BRIDGE_API_KEY", "change-me")
MAGIC = int(os.getenv("MT5_MAGIC", "20250709"))
DEMO_FALLBACK = os.getenv("MT5_DEMO_FALLBACK", "false").lower() == "true"

# Optional MetaTrader5 import — only available on Windows with MT5 installed
try:
    import MetaTrader5 as mt5  # type: ignore

    MT5_AVAILABLE = True
except ImportError:
    mt5 = None  # type: ignore
    MT5_AVAILABLE = False
    logger.warning("MetaTrader5 package not available — bridge will report disconnected (use demo fallback or Windows VPS)")

_state = {
    "connected": False,
    "last_error": "not initialized",
    "last_ok": 0.0,
}
_reconnect_stop = threading.Event()


TIMEFRAME_MAP = {}
if MT5_AVAILABLE:
    TIMEFRAME_MAP = {
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
    }


def try_connect() -> bool:
    if not MT5_AVAILABLE:
        _state["connected"] = False
        _state["last_error"] = "MetaTrader5 module not installed (Windows + MT5 terminal required)"
        return False
    if mt5.initialize():
        _state["connected"] = True
        _state["last_error"] = ""
        _state["last_ok"] = time.time()
        logger.info("MT5 connected: %s", mt5.terminal_info())
        return True
    err = mt5.last_error()
    _state["connected"] = False
    _state["last_error"] = str(err)
    logger.warning("MT5 initialize failed: %s", err)
    return False


def reconnect_loop() -> None:
    while not _reconnect_stop.is_set():
        if not _state["connected"]:
            try_connect()
        else:
            # Soft health probe
            if MT5_AVAILABLE:
                info = mt5.terminal_info()
                if info is None:
                    _state["connected"] = False
                    _state["last_error"] = "terminal_info returned None — reconnecting"
                    mt5.shutdown()
        _reconnect_stop.wait(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try_connect()
    t = threading.Thread(target=reconnect_loop, daemon=True)
    t.start()
    yield
    _reconnect_stop.set()
    if MT5_AVAILABLE and _state["connected"]:
        mt5.shutdown()


app = FastAPI(title="MT5 Bridge", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_api_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")) -> None:
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")


class PlaceOrderBody(BaseModel):
    symbol: str
    type: Literal["BUY", "SELL"]
    lot: float = Field(default=0.01, ge=0.01)
    sl: float
    tp: float


class CloseOrderBody(BaseModel):
    ticket: int


class SignalBody(BaseModel):
    symbol: str = "EURUSD"
    timeframe: str = "M15"
    rsi_period: int = 14
    ema_fast: int = 50
    ema_slow: int = 200
    count: int = 300


@app.get("/health")
def health(_: None = Depends(require_api_key)) -> dict[str, Any]:
    return {
        "ok": _state["connected"] or DEMO_FALLBACK,
        "mt5_connected": _state["connected"],
        "mt5_available": MT5_AVAILABLE,
        "demo_fallback": DEMO_FALLBACK,
        "message": "connected" if _state["connected"] else _state["last_error"],
        "last_ok": _state["last_ok"],
    }


@app.get("/price")
def price(symbol: str = Query("EURUSD"), _: None = Depends(require_api_key)) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        if not mt5.symbol_select(symbol, True):
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
        tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise HTTPException(status_code=502, detail="No tick data")
    return {"symbol": symbol, "bid": float(tick.bid), "ask": float(tick.ask), "time": int(tick.time)}


@app.get("/candles")
def candles(
    symbol: str = Query("EURUSD"),
    timeframe: str = Query("M15"),
    count: int = Query(300, ge=50, le=5000),
    _: None = Depends(require_api_key),
) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    tf = TIMEFRAME_MAP.get(timeframe.upper())
    if tf is None:
        raise HTTPException(status_code=400, detail=f"Unsupported timeframe {timeframe}")
    mt5.symbol_select(symbol, True)
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
    if rates is None:
        raise HTTPException(status_code=502, detail=f"No rates: {mt5.last_error()}")
    out = []
    for r in rates:
        out.append(
            {
                "time": int(r["time"]),
                "open": float(r["open"]),
                "high": float(r["high"]),
                "low": float(r["low"]),
                "close": float(r["close"]),
                "volume": int(r["tick_volume"]),
            }
        )
    return {"symbol": symbol, "timeframe": timeframe, "candles": out}


@app.post("/signal")
def signal(body: SignalBody, _: None = Depends(require_api_key)) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    tf = TIMEFRAME_MAP.get(body.timeframe.upper())
    if tf is None:
        raise HTTPException(status_code=400, detail="Unsupported timeframe")
    mt5.symbol_select(body.symbol, True)
    rates = mt5.copy_rates_from_pos(body.symbol, tf, 0, body.count)
    if rates is None:
        raise HTTPException(status_code=502, detail=f"No rates: {mt5.last_error()}")
    candles = candles_from_rates(rates)
    return generate_signal(
        candles,
        symbol=body.symbol,
        timeframe=body.timeframe,
        rsi_period=body.rsi_period,
        ema_fast=body.ema_fast,
        ema_slow=body.ema_slow,
    )


@app.post("/place_order")
def place_order(body: PlaceOrderBody, _: None = Depends(require_api_key)) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    if not mt5.symbol_select(body.symbol, True):
        raise HTTPException(status_code=404, detail=f"Symbol {body.symbol} not found")

    # One position per symbol
    positions = mt5.positions_get(symbol=body.symbol)
    if positions:
        ours = [p for p in positions if p.magic == MAGIC]
        if ours:
            raise HTTPException(status_code=409, detail="Open position already exists for symbol")

    tick = mt5.symbol_info_tick(body.symbol)
    if tick is None:
        raise HTTPException(status_code=502, detail="No tick")
    order_type = mt5.ORDER_TYPE_BUY if body.type == "BUY" else mt5.ORDER_TYPE_SELL
    price = tick.ask if body.type == "BUY" else tick.bid
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": body.symbol,
        "volume": float(body.lot),
        "type": order_type,
        "price": float(price),
        "sl": float(body.sl),
        "tp": float(body.tp),
        "deviation": 20,
        "magic": MAGIC,
        "comment": "SMC Signal App",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result is None:
        raise HTTPException(status_code=502, detail=f"order_send failed: {mt5.last_error()}")
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        raise HTTPException(
            status_code=502,
            detail=f"Order rejected retcode={result.retcode} comment={result.comment}",
        )
    return {"ticket": int(result.order), "message": result.comment or "ok", "price": float(result.price)}


@app.get("/positions")
def positions(_: None = Depends(require_api_key)) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    pos = mt5.positions_get()
    out = []
    if pos:
        for p in pos:
            if p.magic != MAGIC:
                continue
            out.append(
                {
                    "ticket": int(p.ticket),
                    "symbol": p.symbol,
                    "type": "BUY" if p.type == mt5.POSITION_TYPE_BUY else "SELL",
                    "volume": float(p.volume),
                    "openPrice": float(p.price_open),
                    "currentPrice": float(p.price_current),
                    "sl": float(p.sl),
                    "tp": float(p.tp),
                    "profit": float(p.profit),
                    "openTime": int(p.time) * 1000,
                    "magic": int(p.magic),
                }
            )
    return {"positions": out}


@app.post("/close_order")
def close_order(body: CloseOrderBody, _: None = Depends(require_api_key)) -> dict[str, Any]:
    if not _state["connected"]:
        raise HTTPException(status_code=503, detail="MT5 not connected")
    pos_list = mt5.positions_get(ticket=body.ticket)
    if not pos_list:
        raise HTTPException(status_code=404, detail="Position not found")
    p = pos_list[0]
    tick = mt5.symbol_info_tick(p.symbol)
    if tick is None:
        raise HTTPException(status_code=502, detail="No tick")
    close_type = mt5.ORDER_TYPE_SELL if p.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = tick.bid if p.type == mt5.POSITION_TYPE_BUY else tick.ask
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": p.symbol,
        "volume": float(p.volume),
        "type": close_type,
        "position": int(p.ticket),
        "price": float(price),
        "deviation": 20,
        "magic": MAGIC,
        "comment": "SMC close",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        detail = mt5.last_error() if result is None else f"{result.retcode} {result.comment}"
        raise HTTPException(status_code=502, detail=f"Close failed: {detail}")
    return {"ok": True, "message": "closed", "ticket": body.ticket}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
