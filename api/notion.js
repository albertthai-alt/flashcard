// api/notion.js
export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });

    const hasToken = !!process.env.NOTION_TOKEN;
    // trả về nhanh để verify function chạy và env đã load
    return res.status(200).json({ ok: true, hasToken });
  } catch (err) {
    console.error("Sanity-check error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}
