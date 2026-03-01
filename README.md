# Turtle Trading Signal Alerting Service

A minimal, deterministic, Bun-native trading signal generation service based on Bollinger Bands.

## Project Structure
- `src/app/index.ts` - Main application entry point
- `src/config/env.ts` - Strict environment validation
- `src/discord/webhook.ts` - Discord alerting client
- `src/hyperliquid/api.ts` - Hyperliquid API meta client
- `src/indicators/` - Mathematical modules (SMA, StdDev, BB)
- `src/risk/` - Stop loss & leverage iteration calculation
- `src/signals/` - Signal conditions logic

## ENV Configuration
Create a `.env` file in the root based on these fields minimal required logic:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SYMBOLS=BTC,ETH
TIMEFRAME=15m
RISK_PERCENT=2
```

## Running the Application

### Option 1: Using Bun Natively (Development)
1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Install dependencies: `bun install`
3. Run test suite: `bun test`
4. Run application: `bun run src/app/index.ts`

### Option 2: Using Docker (Production)
1. Ensure Docker is installed.
2. Build and run via Docker Compose:
```bash
docker-compose up --build -d
```
Docker handles tests automatically during the multi-stage build process.
