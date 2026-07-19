import express from "express";
import rateLimit from "express-rate-limit";

const PORT = process.env.PORT || 8787;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET;

if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Refusing to start.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

// Per-IP cap so one abusive client can't run up the whole bill.
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/v1/chat", async (req, res) => {
  // Note: a shared secret baked into an APK can be extracted just like an API
  // key can. This isn't real authentication — it only filters out drive-by
  // scanners that don't bother inspecting the app. Rate limiting above is the
  // actual abuse guard.
  if (PROXY_SHARED_SECRET && req.get("x-proxy-secret") !== PROXY_SHARED_SECRET) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  const { model, system, messages } = req.body ?? {};
  if (typeof model !== "string" || !Array.isArray(messages)) {
    return res.status(400).json({ error: { message: "model and messages are required" } });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: typeof system === "string" ? system : undefined,
        messages,
      }),
    });

    const body = await upstream.text();
    res.status(upstream.status).type("application/json").send(body);
  } catch (err) {
    res.status(502).json({ error: { message: "Upstream request failed" } });
  }
});

app.listen(PORT, () => {
  console.log(`Jarvis proxy listening on :${PORT}`);
});
