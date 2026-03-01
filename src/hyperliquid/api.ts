export interface CoinMeta {
    name: string;
    maxLeverage: number;
}

export async function fetchMeta(): Promise<CoinMeta[]> {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meta" })
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch Hyperliquid meta: ${res.statusText}`);
    }

    const data = await res.json() as any;
    return data.universe.map((item: any) => ({
        name: item.name,
        maxLeverage: item.maxLeverage
    }));
}
