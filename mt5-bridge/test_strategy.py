"""Unit tests for the Python strategy engine (no MT5 required)."""

from strategy_engine import (
    ema,
    rsi,
    pip_size,
    detect_price_action,
    detect_fvg,
    generate_signal,
)


def candle(o, h, l, c, i=0):
    return {"time": 1_700_000_000_000 + i * 900_000, "open": o, "high": h, "low": l, "close": c}


def rising(n, start=1.1, step=0.001):
    out = []
    p = start
    for i in range(n):
        o, cl = p, p + step
        out.append(candle(o, cl + step * 0.3, o - step * 0.2, cl, i))
        p = cl
    return out


def test_ema_rises():
    e = ema(list(range(1, 11)), 3)
    assert e[-1] > e[0]


def test_rsi_uptrend_high():
    closes = [100 + i for i in range(30)]
    r = rsi(closes, 14)
    assert r[-1] > 70


def test_pip_size():
    assert pip_size("EURUSD") == 0.0001
    assert pip_size("USDJPY") == 0.01


def test_bullish_engulfing():
    candles = rising(5) + [
        candle(1.105, 1.1055, 1.1, 1.1005, 5),
        candle(1.1002, 1.108, 1.1, 1.107, 6),
    ]
    assert detect_price_action(candles) == "BULLISH_ENGULFING"


def test_fvg():
    padded = rising(10, 1.09, 0.0005) + [
        candle(1.1, 1.101, 1.099, 1.1005, 10),
        candle(1.1005, 1.102, 1.1, 1.1015, 11),
        candle(1.105, 1.108, 1.1045, 1.107, 12),
    ]
    gaps = detect_fvg(padded)
    assert any(g["type"] == "bullish" for g in gaps)


def test_generate_signal_insufficient():
    sig = generate_signal(rising(20), "EURUSD", "M15")
    assert sig["action"] == "NONE"


def test_generate_signal_long_series():
    candles = rising(250, 1.05, 0.0008)
    sig = generate_signal(candles, "EURUSD", "M15")
    assert "bias" in sig
    assert len(sig["reasons"]) > 0
