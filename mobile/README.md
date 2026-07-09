# SMC Signal — Forex Trading Assistant (Mobile)

Cross-platform **React Native (Expo)** app for a semi-automated forex trading assistant using **Smart Money Concepts (SMC) + RSI + Moving Average + Price Action**. Designed for a **$100 micro-account** with a fixed **0.01** lot size.

Trades are **never placed automatically** — every order requires an explicit confirmation tap. Live execution goes through a **MetaTrader 5 bridge** running on a Windows VPS.

> **Disclaimer:** This is a decision-support tool, not financial advice. Trading involves risk of loss.

---

## Repository layout

```
mobile/          Expo React Native app (TypeScript)
mt5-bridge/      Python FastAPI microservice (MT5 bridge + strategy)
```

The bridge lives at `../mt5-bridge` relative to this folder.

---

## Strategy (exact rules)

Signal fires only when **all** align:

| Layer | Rule |
|-------|------|
| Trend | EMA50 & EMA200 — bullish if price > EMA50 > EMA200; bearish if reverse |
| Structure | Swing highs/lows (5-candle lookback) → BOS / CHoCH |
| Zone | Order block (last opposite candle before impulse) **or** FVG (3-candle imbalance) |
| RSI(14) | Buys: &lt;30 (allow up to 45); Sells: &gt;70 (allow down to 55); trend-aligned only |
| Price action | Bullish/Bearish engulfing or pin bar at the zone |

**Risk**

- Lot: `0.01` (editable in Settings)
- Capital: `$100` default
- Risk/trade: `1.5%` default, hard-capped at `3%`
- SL: zone boundary + 5 pip buffer
- TP: minimum **1:2** R:R
- One open position per symbol
- Daily loss limit: stop signaling after **−5%** of capital

---

## Setup

### Requirements

- Node.js 18+
- Expo Go (device) or Android/iOS simulator

```bash
cd mobile
npm install
npm start
```

Demo mode is **on by default** — the app works with simulated candles/signals without a broker.

### Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm test` | Strategy unit tests |
| `npm run android` / `ios` / `web` | Platform targets |

### Screens

1. **Dashboard** — price, signal, bias, RSI, mini chart
2. **Signal Detail** — structure, OB/FVG, PA, SL/TP, checklist
3. **Trade Execution** — confirm order (risk $/%)
4. **Open Positions** — live P/L, close
5. **Trade History** — win rate, total P/L, R:R
6. **Settings** — capital, risk %, symbol, TF, RSI/EMA, notifications, demo/live, bridge URL + API key, theme

### Live mode

1. Deploy `mt5-bridge` on a Windows VPS with MT5 logged in
2. In **Settings**: turn **Demo mode OFF**, set **Bridge URL** (e.g. `http://YOUR_VPS_IP:8000`) and **API Key**
3. App polls `/health` and shows a **Bridge Offline** banner if unreachable

Android emulator → host machine: use `http://10.0.2.2:8000` as bridge URL.

---

## MT5 Bridge (Windows VPS)

See `../mt5-bridge/README.md` for full setup. Summary:

```powershell
cd mt5-bridge
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install MetaTrader5
copy .env.example .env
python main.py
```

All requests require header: `X-API-Key: <your key>`

**Never share your API key** — anyone with it can place orders on your account.
