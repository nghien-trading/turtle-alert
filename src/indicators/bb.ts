import { calculateSMA } from "./sma";
import { calculateStdDev } from "./stddev";

export function calculateBollingerBands(prices: number[]): { sma: number, upper: number, lower: number } {
    const sma = calculateSMA(prices);
    const stdDev = calculateStdDev(prices, sma);

    return {
        sma,
        upper: sma + 2 * stdDev,
        lower: sma - 2 * stdDev
    };
}
