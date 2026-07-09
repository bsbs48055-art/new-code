"""
Python port of the SMC + RSI + MA + Price Action strategy engine.
Mirrors mobile/src/strategy for server-side /signal computation.
"""

from __future__ import annotations

import time
from typing import Any


Candle = dict[str, float | int]


def ema(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    k = 2 / (period + 1)
    out = [values[0]]
    prev = values[0]
    for v in values[1:]:
        prev = v * k + prev * (1 - k)
        out.append(prev)
    return out


def rsi(closes: list[float], period: int = 14) -> list[float]:
    out = [float("nan")] * len(closes)
    if len(closes) <= period:
        return out
    avg_gain = 0.0
    avg_loss = 0.0
    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        if diff >= 0:
            avg_gain += diff
        else:
            avg_loss -= diff
    avg_gain /= period
    avg_loss /= period
    out[period] = 100.0 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    for i in range(period + 1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gain = diff if diff > 0 else 0.0
        loss = -diff if diff < 0 else 0.0
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        out[i] = 100.0 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    return out


def pip_size(symbol: str) -> float:
    s = symbol.upper()
    if "JPY" in s:
        return 0.01
    if "XAU" in s or "GOLD" in s:
        return 0.1
    return 0.0001


def pips_between(a: float, b: float, symbol: str) -> float:
    return abs(a - b) / pip_size(symbol)


def detect_swing_points(candles: list[Candle], lookback: int = 5) -> list[dict]:
    swings = []
    for i in range(lookback, len(candles) - lookback):
        c = candles[i]
        is_high = True
        is_low = True
        for j in range(1, lookback + 1):
            if candles[i - j]["high"] >= c["high"] or candles[i + j]["high"] >= c["high"]:
                is_high = False
            if candles[i - j]["low"] <= c["low"] or candles[i + j]["low"] <= c["low"]:
                is_low = False
        if is_high:
            swings.append({"index": i, "price": c["high"], "type": "high"})
        elif is_low:
            swings.append({"index": i, "price": c["low"], "type": "low"})
    return swings


def detect_structure(candles: list[Candle], bias: str, event_window: int = 40) -> str:
    swings = detect_swing_points(candles)
    highs = [s for s in swings if s["type"] == "high"]
    lows = [s for s in swings if s["type"] == "low"]
    if not highs and not lows:
        return "NONE"
    last_high = highs[-1] if highs else None
    last_low = lows[-1] if lows else None
    end = len(candles) - 1
    start = max(0, end - event_window)
    prior_high = next((s for s in reversed(highs) if s["index"] < start), None)
    if prior_high is None:
        prior_high = highs[-2] if len(highs) > 1 else last_high
    prior_low = next((s for s in reversed(lows) if s["index"] < start), None)
    if prior_low is None:
        prior_low = lows[-2] if len(lows) > 1 else last_low
    broke_high = False
    broke_low = False
    for i in range(start, end + 1):
        c = candles[i]
        if prior_high is not None and float(c["close"]) > float(prior_high["price"]):
            broke_high = True
        if prior_low is not None and float(c["close"]) < float(prior_low["price"]):
            broke_low = True
    price = float(candles[end]["close"])
    if last_high is not None and price > float(last_high["price"]):
        broke_high = True
    if last_low is not None and price < float(last_low["price"]):
        broke_low = True
    if bias == "BULLISH":
        if broke_high:
            return "BOS"
        if broke_low:
            return "CHoCH"
    elif bias == "BEARISH":
        if broke_low:
            return "BOS"
        if broke_high:
            return "CHoCH"
    else:
        if broke_high or broke_low:
            return "CHoCH"
    return "NONE"


def body_size(c: Candle) -> float:
    return abs(float(c["close"]) - float(c["open"]))


def detect_order_blocks(candles: list[Candle], lookback: int = 40) -> list[dict]:
    blocks = []
    start = max(2, len(candles) - lookback)
    for i in range(start, len(candles) - 1):
        impulse = candles[i]
        prev = candles[i - 1]
        avg = sum(body_size(c) for c in candles[max(0, i - 10) : i]) / max(1, min(10, i))
        if body_size(impulse) < avg * 1.5:
            continue
        bull_imp = float(impulse["close"]) >= float(impulse["open"])
        bear_prev = float(prev["close"]) < float(prev["open"])
        bear_imp = float(impulse["close"]) < float(impulse["open"])
        bull_prev = float(prev["close"]) >= float(prev["open"])
        if bull_imp and bear_prev:
            blocks.append(
                {
                    "type": "bullish",
                    "high": max(float(prev["open"]), float(prev["close"])),
                    "low": min(float(prev["open"]), float(prev["close"]), float(prev["low"])),
                    "index": i - 1,
                }
            )
        if bear_imp and bull_prev:
            blocks.append(
                {
                    "type": "bearish",
                    "high": max(float(prev["open"]), float(prev["close"]), float(prev["high"])),
                    "low": min(float(prev["open"]), float(prev["close"])),
                    "index": i - 1,
                }
            )
    return blocks


def detect_fvg(candles: list[Candle], lookback: int = 40) -> list[dict]:
    gaps = []
    start = max(2, len(candles) - lookback)
    for i in range(start, len(candles)):
        c1, c3 = candles[i - 2], candles[i]
        if float(c1["high"]) < float(c3["low"]):
            gaps.append(
                {
                    "type": "bullish",
                    "high": float(c3["low"]),
                    "low": float(c1["high"]),
                    "index": i - 1,
                }
            )
        if float(c1["low"]) > float(c3["high"]):
            gaps.append(
                {
                    "type": "bearish",
                    "high": float(c1["low"]),
                    "low": float(c3["high"]),
                    "index": i - 1,
                }
            )
    return gaps


def in_zone(price: float, high: float, low: float, buffer: float = 0) -> bool:
    top = max(high, low) + buffer
    bottom = min(high, low) - buffer
    return bottom <= price <= top


def find_active_zone(candles: list[Candle], bias: str, pip: float) -> dict | None:
    if bias == "NEUTRAL":
        return None
    wanted = "bullish" if bias == "BULLISH" else "bearish"
    price = float(candles[-1]["close"])
    candidates = []
    for o in detect_order_blocks(candles):
        if o["type"] == wanted:
            candidates.append({"kind": "order_block", **o})
    for f in detect_fvg(candles):
        if f["type"] == wanted:
            candidates.append({"kind": "fvg", **f})
    candidates.sort(key=lambda z: z["index"], reverse=True)
    for z in candidates:
        if in_zone(price, z["high"], z["low"], pip * 3):
            return z
    for z in candidates[:5]:
        for c in candles[-3:]:
            if in_zone(float(c["low"]), z["high"], z["low"], pip * 2) or in_zone(
                float(c["high"]), z["high"], z["low"], pip * 2
            ):
                return z
    return None


def detect_price_action(candles: list[Candle]) -> str:
    if len(candles) < 2:
        return "NONE"
    curr, prev = candles[-1], candles[-2]
    prev_bear = float(prev["close"]) < float(prev["open"])
    curr_bull = float(curr["close"]) >= float(curr["open"])
    prev_bull = float(prev["close"]) >= float(prev["open"])
    curr_bear = float(curr["close"]) < float(curr["open"])
    body_c = abs(float(curr["close"]) - float(curr["open"]))
    body_p = abs(float(prev["close"]) - float(prev["open"]))
    if (
        prev_bear
        and curr_bull
        and float(curr["close"]) >= float(prev["open"])
        and float(curr["open"]) <= float(prev["close"])
        and body_c > body_p * 0.9
    ):
        return "BULLISH_ENGULFING"
    if (
        prev_bull
        and curr_bear
        and float(curr["close"]) <= float(prev["open"])
        and float(curr["open"]) >= float(prev["close"])
        and body_c > body_p * 0.9
    ):
        return "BEARISH_ENGULFING"
    r = float(curr["high"]) - float(curr["low"])
    if r > 0:
        upper = float(curr["high"]) - max(float(curr["open"]), float(curr["close"]))
        lower = min(float(curr["open"]), float(curr["close"])) - float(curr["low"])
        if lower >= r * 0.6 and body_c <= r * 0.3 and upper <= r * 0.25:
            return "BULLISH_PIN"
        if upper >= r * 0.6 and body_c <= r * 0.3 and lower <= r * 0.25:
            return "BEARISH_PIN"
    return "NONE"


def trend_bias(price: float, ema50: float, ema200: float) -> str:
    if price > ema50 and ema50 > ema200:
        return "BULLISH"
    if price < ema50 and ema50 < ema200:
        return "BEARISH"
    return "NEUTRAL"


def generate_signal(
    candles: list[Candle],
    symbol: str,
    timeframe: str,
    rsi_period: int = 14,
    ema_fast: int = 50,
    ema_slow: int = 200,
    rsi_buy_max: float = 45,
    rsi_sell_min: float = 55,
    pip_buffer: int = 5,
    min_rr: float = 2.0,
) -> dict[str, Any]:
    reasons: list[str] = []
    empty = {
        "action": "NONE",
        "symbol": symbol,
        "timeframe": timeframe,
        "bias": "NEUTRAL",
        "structure": "NONE",
        "rsi": float("nan"),
        "ema50": float("nan"),
        "ema200": float("nan"),
        "price": float(candles[-1]["close"]) if candles else 0,
        "zone": None,
        "priceAction": "NONE",
        "stopLoss": None,
        "takeProfit": None,
        "riskPips": None,
        "rewardPips": None,
        "reasons": ["Insufficient candle data"],
        "timestamp": int(time.time() * 1000),
    }
    if len(candles) < max(ema_slow, rsi_period) + 10:
        return empty

    closes = [float(c["close"]) for c in candles]
    e50 = ema(closes, ema_fast)
    e200 = ema(closes, ema_slow)
    r = rsi(closes, rsi_period)
    i = len(candles) - 1
    price = closes[i]
    ema50 = e50[i]
    ema200 = e200[i]
    rsi_val = r[i]
    bias = trend_bias(price, ema50, ema200)
    pip = pip_size(symbol)
    buffer = pip * pip_buffer

    reasons.append(f"Trend bias: {bias}")
    structure = detect_structure(candles, bias)
    reasons.append(f"Market structure: {structure}")
    zone = find_active_zone(candles, bias, pip)
    if zone:
        reasons.append(f"Zone: {zone['kind']} {zone['type']}")
    else:
        reasons.append("No active order block / FVG near price")
    reasons.append(f"RSI({rsi_period}): {rsi_val:.2f}")
    pa = detect_price_action(candles)
    reasons.append(f"Price action: {pa}")

    action = "NONE"
    stop_loss = take_profit = risk_pips = reward_pips = None
    structure_ok = structure in ("BOS", "CHoCH")
    rsi_buy_ok = rsi_val < 30 or rsi_val <= rsi_buy_max
    rsi_sell_ok = rsi_val > 70 or rsi_val >= rsi_sell_min
    buy_pa = pa in ("BULLISH_ENGULFING", "BULLISH_PIN")
    sell_pa = pa in ("BEARISH_ENGULFING", "BEARISH_PIN")

    if bias == "BULLISH" and structure_ok and zone and zone["type"] == "bullish" and rsi_buy_ok and buy_pa:
        action = "BUY"
        zone_low = min(zone["high"], zone["low"])
        stop_loss = zone_low - buffer
        risk_pips = pips_between(price, stop_loss, symbol)
        reward_pips = risk_pips * min_rr
        take_profit = price + reward_pips * pip
        reasons.append("ALL conditions aligned → BUY")
    elif bias == "BEARISH" and structure_ok and zone and zone["type"] == "bearish" and rsi_sell_ok and sell_pa:
        action = "SELL"
        zone_high = max(zone["high"], zone["low"])
        stop_loss = zone_high + buffer
        risk_pips = pips_between(price, stop_loss, symbol)
        reward_pips = risk_pips * min_rr
        take_profit = price - reward_pips * pip
        reasons.append("ALL conditions aligned → SELL")
    else:
        reasons.append("No signal — conditions not fully aligned")

    return {
        "action": action,
        "symbol": symbol,
        "timeframe": timeframe,
        "bias": bias,
        "structure": structure,
        "rsi": rsi_val,
        "ema50": ema50,
        "ema200": ema200,
        "price": price,
        "zone": zone,
        "priceAction": pa,
        "stopLoss": stop_loss,
        "takeProfit": take_profit,
        "riskPips": risk_pips,
        "rewardPips": reward_pips,
        "reasons": reasons,
        "timestamp": int(time.time() * 1000),
    }


def candles_from_rates(rates) -> list[Candle]:
    out: list[Candle] = []
    for r in rates:
        out.append(
            {
                "time": int(r["time"]) * 1000,
                "open": float(r["open"]),
                "high": float(r["high"]),
                "low": float(r["low"]),
                "close": float(r["close"]),
            }
        )
    return out
