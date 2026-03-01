export async function sendDiscordAlert(webhookUrl: string, content: string | object): Promise<void> {
    const payload = typeof content === "string" ? { content } : content;
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("Failed to send Discord alert:", res.status, await res.text());
    }
}
