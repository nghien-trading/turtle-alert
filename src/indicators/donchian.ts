export interface DonchianResult {
    upper: number;   // max(high[i]) over last N candles
    lower: number;   // min(low[i])  over last N candles
    middle: number;  // (upper + lower) / 2
}

/**
 * Calculates the Donchian Channel for exactly 20 candles.
 *
 * Definitions:
 *   UpperBand  = max(high[i]) over last 20 candles
 *   LowerBand  = min(low[i])  over last 20 candles
 *   MiddleBand = (UpperBand + LowerBand) / 2
 *
 * Deterministic math only: max/min over the window, no averaging.
 */
export function calculateDonchianChannel(
    candles: { high: number; low: number }[]
): DonchianResult {
    if (candles.length !== 20) {
        throw new Error(
            `Donchian Channel requires exactly 20 candles, received ${candles.length}`
        );
    }

    let upper = -Infinity;
    let lower = Infinity;

    for (const candle of candles) {
        if (candle.high > upper) upper = candle.high;
        if (candle.low < lower) lower = candle.low;
    }

    return {
        upper,
        lower,
        middle: (upper + lower) / 2,
    };
}
