export interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
}

export function calculateStopLoss(direction: "LONG" | "SHORT", signalCandle: Candle): number {
    if (direction === "LONG") {
        return signalCandle.low;
    } else {
        return signalCandle.high;
    }
}
