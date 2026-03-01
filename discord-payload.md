**🚨 SIGNAL DETECTED 🚨**
Symbol: BTC
Direction: LONG

**Trade Setup:**
Entry Price: 27500.50
Stop Loss: 26800.00
Price Distance: 700.50
Distance Percent: 2.55%

**Leverage:**
Max Allowed Leverage: 50x
Tested Leverage: 1x to 50x
**Selected Leverage: 39x**

**Indicators at Signal:**
SMA: 27150.2500
Upper BB: 28000.0000
Lower BB: 26300.5000

**Formulas Used:**
*Bollinger Bands:*
SMA = (sum of last 20 closes) / 20
StdDev = sqrt(sum((close[i] - SMA)^2) / 20)
UpperBand = SMA + 2 * StdDev
LowerBand = SMA - 2 * StdDev

*Leverage Limit:*
PriceDistance = abs(EntryPrice - StopLoss)
DistancePercent = PriceDistance / EntryPrice
for L = 1 to maxLeverage:
    if DistancePercent < 1 / L:
        valid candidate
