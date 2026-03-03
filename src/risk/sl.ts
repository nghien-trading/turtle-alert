export interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
}

export type Direction = "LONG" | "SHORT";

/**
 * Calculates the Stop Loss price using the Donchian Channel bands.
 *
 * Rules:
 *   LONG  breakout → SL = LowerBand  (opposite band from breakout direction)
 *   SHORT breakout → SL = UpperBand  (opposite band from breakout direction)
 *
 * The candle's high/low are NOT used.
 */
export function calculateStopLoss(
    direction: Direction,
    upperBand: number,
    lowerBand: number
): number {
    if (direction === "LONG") {
        return lowerBand;
    } else {
        return upperBand;
    }
}
