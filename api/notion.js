// api/notion.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok:false, msg:"Method not allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    if (!NOTION_TOKEN) {
      console.error("Missing NOTION_TOKEN");
      return res.status(500).json({ ok:false, error: "Server missing NOTION_TOKEN" });
    }

    // body may be parsed by Vercel already
    let body = req.body;
    if (!body) {
      // try to fallback to raw reading (rare)
      let raw = "";
      try {
        raw = await new Promise((resolve, reject) => {
          let data = "";
          req.on && req.on("data", c => data += c);
          req.on && req.on("end", () => resolve(data || "{}"));
          setTimeout(() => resolve("{}"), 50);
        });
        body = JSON.parse(raw || "{}");
      } catch (e) {
        body = {};
      }
    }

    const payload = {
      filter: { property: "object", value: "database" },
      page_size: 100,
      ...body
    };

    const r = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    // If Notion returns non-JSON (rare), forward it
    try {
      const data = text ? JSON.parse(text) : {};
      return res.status(r.status).json(data);
    } catch (parseErr) {
      console.error("Notion returned non-JSON:", text);
      return res.status(r.status).type("text").send(text);
    }
  } catch (err) {
    console.error("Function exception:", err && (err.stack || err.message || err));
    return res.status(500).json({ ok:false, error: String(err && (err.message || err)) });
  }
}
