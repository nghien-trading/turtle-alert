import type { Candle } from "../risk/sl";

export type SignalType = "LONG" | "SHORT" | null;

/**
 * Detects a Donchian Channel breakout signal.
 *
 * LONG breakout:
 *   Previous candle close <= upperBand  AND  current candle close > upperBand
 *
 * SHORT breakout:
 *   Previous candle close >= lowerBand  AND  current candle close < lowerBand
 *
 * Triggers only on confirmed candle close.
 */
export function detectSignal(
    prevCandle: Pick<Candle, "close">,
    currCandle: Pick<Candle, "close">,
    lowerBand: number,
    upperBand: number
): SignalType {
    // LONG breakout: previous close was inside (or on) the upper band,
    // and current close has broken above it.
    if (prevCandle.close <= upperBand && currCandle.close > upperBand) {
        return "LONG";
    }

    // SHORT breakout: previous close was inside (or on) the lower band,
    // and current close has broken below it.
    if (prevCandle.close >= lowerBand && currCandle.close < lowerBand) {
        return "SHORT";
    }

    return null;
}
