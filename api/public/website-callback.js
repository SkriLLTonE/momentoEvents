/**
 * Same-origin forwarder for the public site.
 * The CRM rejects browser Origins other than http://localhost:3000
 * (response: {"error":"Источник не разрешён"}) and its OPTIONS preflight
 * has no Access-Control-Allow-Origin. A server fetch with no Origin is
 * accepted. Host must stay in sync with js/config.js.
 */
const CRM_CALLBACK = "https://crm-new-year.vercel.app/api/public/website-callback";
const MAX_BODY = 16 * 1024;

module.exports = async function websiteCallback(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const raw = rawBody(req.body);
  if (raw == null) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }
  if (Buffer.byteLength(raw) > MAX_BODY) {
    res.status(400).json({ error: "Слишком длинная заявка" });
    return;
  }

  try {
    const upstream = await fetch(CRM_CALLBACK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: raw,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.send(text);
  } catch {
    res.status(502).json({ error: "Не удалось отправить заявку. Попробуйте ещё раз." });
  }
};

function rawBody(body) {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body.toString("utf8");
  if (typeof body === "object") return JSON.stringify(body);
  return null;
}
