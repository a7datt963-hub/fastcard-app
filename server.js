// services.js
import express from "express";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors()); // تمكين CORS (يمكن تقييده لاحقاً حسب الحاجة)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_BASE = process.env.API_BASE || "https://fastcard1.store/client/api";
const API_TOKEN = process.env.API_TOKEN || ""; // ضع التوكن في Environment على Render

if (!API_TOKEN) {
  console.warn("⚠️ API_TOKEN غير موجود. ضع المتغير في Environment على Render أو ملف .env محلي للاختبار.");
}

// helper: fetch with timeout
async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// --- جلب المنتجات ---
app.get("/api/products", async (req, res) => {
  try {
    const url = `${API_BASE.replace(/\/$/, "")}/products`;
    const response = await fetchWithTimeout(url, {
      headers: { "api-token": API_TOKEN },
      method: "GET"
    }, 12000);

    if (!response.ok) {
      const txt = await response.text().catch(()=>null);
      console.error("Products upstream error:", response.status, txt);
      return res.status(502).json({ error: "Upstream returned error", status: response.status, body: txt });
    }

    const data = await response.json().catch(()=>null);
    return res.json(data ?? { data: [] });
  } catch (err) {
    console.error("products error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// --- إنشاء طلب جديد ---
app.post("/api/newOrder/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty, playerId } = req.body;
    if (!qty) return res.status(400).json({ error: "qty is required" });

    const uuid = uuidv4();
    // بعض واجهات الـ API تتوقع params في الـ URL كما في الكود الأصلي
    // نستخدم نفس الصيغة لكن نتعامل مع الأخطاء ونرجع uuid كـ client_order_uuid
    const params = new URLSearchParams({ qty: String(qty), order_uuid: uuid });
    if (playerId) params.append("playerId", playerId);

    const endpoint = `${API_BASE.replace(/\/$/, "")}/newOrder/${encodeURIComponent(productId)}/params?${params.toString()}`;
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "api-token": API_TOKEN }
    }, 15000);

    const text = await response.text().catch(()=>null);
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch(e){ data = { raw: text }; }

    // Attach uuid for client-side tracking
    if (data && typeof data === 'object') {
      if (!data.data) data.data = {};
      data.data.client_order_uuid = uuid;
    } else {
      data = { data: { client_order_uuid: uuid }, raw: text };
    }

    if (!response.ok) {
      console.warn("newOrder upstream returned non-ok:", response.status, text);
      return res.status(502).json({ error: "Upstream error", status: response.status, body: data });
    }

    return res.json(data);
  } catch (err) {
    console.error("newOrder error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// --- تحقق من حالة طلبات ---
app.get("/api/check", async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const endpoint = `${API_BASE.replace(/\/$/, "")}/check?${qs}`;
    const response = await fetchWithTimeout(endpoint, {
      headers: { "api-token": API_TOKEN },
      method: "GET"
    }, 12000);

    const data = await response.json().catch(()=>null);
    if (!response.ok) {
      const text = JSON.stringify(data);
      console.error("check upstream error:", response.status, text);
      return res.status(502).json({ error: "Upstream error", status: response.status, body: data });
    }
    return res.json(data ?? { data: [] });
  } catch (err) {
    console.error("check error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// health
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// serve index.html by default (page الرئيسية)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
