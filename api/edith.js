// api/edith.js — proxy serverless pour le chatbot Edith (Vercel)
// Garde la clé Anthropic côté serveur (jamais exposée au navigateur).
// À configurer sur Vercel : Settings → Environment Variables → ANTHROPIC_API_KEY
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY manquante (à définir dans Vercel)." });
    return;
  }
  try {
    const { system, messages } = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: system || "",
        messages: Array.isArray(messages) ? messages.slice(-20) : [],
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: "Proxy Edith indisponible." });
  }
}
