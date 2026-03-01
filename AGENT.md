You are a senior TypeScript systems engineer building production-grade infrastructure.

We are building a crypto signal alerting service.

This is NOT an auto-trading bot.
This is a continuously running VPS service that listens to candle closes and sends alerts to a Discord webhook.

The service must be deterministic, minimal, Bun-native, and production-ready.

==================================================
STACK (STRICT REQUIREMENTS)
==================================================

Runtime: Bun (latest stable version)
Language: TypeScript (strict mode)
Project must be initialized using:

    bun init

Use Bun-native features wherever possible:

- bun run
- bun test
- Bun WebSocket
- native fetch (Bun)
- Bun.env
- ESM modules only

Do NOT use:
- Node
- npm
- axios
- ws
- node-fetch
- ts-node
- nodemon
- pm2
- unnecessary libraries

Only add dependencies if absolutely required.

==================================================
TDD PROCESS (MANDATORY)
==================================================

1. Initialize project using bun init.
2. Write test suite FIRST using bun test.
3. Only after tests exist, implement minimal code to pass tests.

Tests required:

- SMA correctness
- Standard deviation correctness
- Bollinger Band calculation correctness
- Stop loss logic correctness
- Signal detection logic correctness
- Leverage iteration algorithm correctness
- ENV validation logic correctness

No implementation before tests.

==================================================
ENV CONFIG (ONLY THESE VARIABLES)
==================================================

DISCORD_WEBHOOK_URL=
SYMBOLS=BTC,ETH
TIMEFRAME=15m
RISK_PERCENT=2

No additional ENV variables allowed.

Max leverage must be fetched dynamically from Hyperliquid API.
Do NOT hardcode leverage caps.

==================================================
STARTUP BEHAVIOR
==================================================

On service start:

1. Validate ENV variables.
2. Parse SYMBOLS from comma-separated string.
3. Research Hyperliquid public API and fetch max leverage per symbol.
4. Open WebSocket subscription for candle stream.
5. Send Discord message:

"Service is UP"
Symbols:
Timeframe:
Risk:
Max leverage per symbol:

==================================================
HYPERLIQUID API REQUIREMENT
==================================================

Research official Hyperliquid public API documentation.

Use:
- Proper documented WebSocket endpoint
- Proper documented leverage or market metadata endpoint

Do NOT invent endpoints.
Do NOT assume undocumented behavior.
Use minimal endpoints necessary.

==================================================
CANDLE PROCESSING
==================================================

Trigger logic ONLY on candle close.

No intrabar signals.
No partial candle processing.

==================================================
INDICATOR LOGIC
==================================================

Bollinger Bands:

Length = 20
StdDev multiplier = 2

Formulas:

SMA = (sum of last 20 closes) / 20

StdDev = sqrt(
    sum((close[i] - SMA)^2) / 20
)

UpperBand = SMA + 2 * StdDev
LowerBand = SMA - 2 * StdDev

These formulas must be included inside Discord alert payload to prevent hallucinated math.

==================================================
SIGNAL LOGIC
==================================================

LONG condition:

- Previous candle close < LowerBand
- Current candle close returns inside band

SHORT condition:

- Previous candle close > UpperBand
- Current candle close returns inside band

Signal triggers ONLY on confirmed candle close.

==================================================
STOP LOSS LOGIC
==================================================

LONG:
SL = low of signal candle

SHORT:
SL = high of signal candle

==================================================
LEVERAGE CALCULATION (CRITICAL)
==================================================

EntryPrice = close of confirmation candle
StopLoss = SL

PriceDistance = abs(EntryPrice - StopLoss)
DistancePercent = PriceDistance / EntryPrice

Liquidation approximation:

LiquidationPercent ≈ 1 / Leverage

Constraint:

DistancePercent < 1 / Leverage

Algorithm:

for L = 1 to maxLeverage:
    if DistancePercent < 1 / L:
        valid candidate

Select the HIGHEST valid L.

If no valid L:
    skip signal

This ensures liquidation happens AFTER stop loss.

Include in Discord alert:

- EntryPrice
- StopLoss
- PriceDistance
- DistancePercent
- MaxLeverage
- Tested leverage values
- Final selected leverage
- Full formulas used

==================================================
ARCHITECTURE
==================================================

/src
  /config
  /hyperliquid
  /indicators
  /risk
  /signals
  /discord
  /app

No frameworks.
No DI containers.
No overengineering.
Strict typing.
No any types.
No magic numbers.

==================================================
RELIABILITY REQUIREMENTS
==================================================

- Auto-reconnect WebSocket
- Graceful shutdown (SIGINT, SIGTERM)
- No memory leaks
- No global mutable state
- Deterministic math
- Strong typing everywhere

==================================================
DOCKER REQUIREMENTS
==================================================

Generate:

1. Optimized multi-stage Dockerfile
2. Proper .dockerignore
3. Optional docker-compose.yml

Dockerfile must:

- Use latest official Bun image
- Multi-stage build
- Copy lockfile first for caching
- Run bun test during build
- Use slim production image
- Non-root user
- Proper WORKDIR
- No unnecessary files copied
- No dev dependencies in final stage
- Correct runtime:

CMD ["bun", "run", "src/app/index.ts"]

Do NOT use node, npm, pm2, ts-node, nodemon.

==================================================
OUTPUT FORMAT
==================================================

Step 1: bun init command
Step 2: Project structure
Step 3: Tests (bun test)
Step 4: Implementation
Step 5: Hyperliquid API explanation
Step 6: Run instructions
Step 7: Dockerfile
Step 8: .dockerignore
Step 9: docker-compose.yml
Step 10: Example Discord alert payload

==================================================
FINAL RULES
==================================================

- Research Hyperliquid API properly.
- Use minimal ENV configuration.
- Do NOT hallucinate API endpoints.
- Do NOT auto-trade.
- Alerting only.
- Deterministic math.
- Production mindset.