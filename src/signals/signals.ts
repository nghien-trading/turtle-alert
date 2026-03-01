import type { Candle } from "../risk/sl";

export type SignalType = "LONG" | "SHORT" | null;

export function detectSignal(prevCandle: Pick<Candle, "close">, currCandle: Pick<Candle, "close">, lowerBand: number, upperBand: number): SignalType {
    // LONG condition:
    // - Previous candle close < LowerBand
    // - Current candle close returns inside band
    if (prevCandle.close < lowerBand && currCandle.close >= lowerBand) {
        return "LONG";
    }

    // SHORT condition:
    // - Previous candle close > UpperBand
    // - Current candle close returns inside band
    if (prevCandle.close > upperBand && currCandle.close <= upperBand) {
        return "SHORT";
    }

    return null;
}
