export function calculateSMA(prices: number[]): number {
    if (prices.length !== 20) {
        throw new Error("SMA calculation requires exactly 20 prices");
    }
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / 20;
}
