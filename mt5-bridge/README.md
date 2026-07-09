# MT5 Bridge Microservice

Python **FastAPI** bridge between the SMC Signal mobile app and **MetaTrader 5**.

MT5’s official Python API only works on **Windows** with the terminal installed and logged in. Run this service on a Windows VPS (or PC) 24/7.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Bridge + MT5 connection status |
| GET | `/price?symbol=EURUSD` | Current bid/ask |
| GET | `/candles?symbol=&timeframe=&count=` | OHLC candles |
| POST | `/signal` | Run SMC+RSI+MA+PA strategy server-side |
| POST | `/place_order` | Body: `{symbol, type, lot, sl, tp}` |
| GET | `/positions` | Open positions (filtered by magic number) |
| POST | `/close_order` | Body: `{ticket}` |

Auth: `X-API-Key` header on every request.

Auto-reconnect: if `mt5.initialize()` fails or the terminal disconnects, retries every **30 seconds**. Failure state is exposed via `/health`.

## Setup (Windows)

1. Install MetaTrader 5, log into your broker, keep the terminal open.
2. Python 3.10+.

```powershell
cd mt5-bridge
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install MetaTrader5
copy .env.example .env
# Edit .env — set a strong MT5_BRIDGE_API_KEY
python main.py
```

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `MT5_BRIDGE_API_KEY` | `change-me` | Shared secret with the mobile app |
| `MT5_MAGIC` | `20250709` | Magic number for app-placed orders |
| `PORT` | `8000` | HTTP port |
| `MT5_DEMO_FALLBACK` | `false` | Mark `/health` ok without MT5 (dev only) |

## Tests (no MT5 required)

```bash
pip install -r requirements.txt
pytest -q
```

## Security

- Prefer HTTPS (nginx/Caddy + TLS) in front of the bridge.
- Firewall: restrict to your phone IP when possible.
- Never share the API key.
