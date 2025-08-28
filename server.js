import express from "express";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_BASE = process.env.API_BASE || "https://fastcard1.store/client/api";
const API_TOKEN = process.env.API_TOKEN || ""; // لا تضع التوكن هنا في الريبو

if (!API_TOKEN) {
  console.warn("⚠️ API_TOKEN غير موجود. ضع المتغير في Environment على Render أو ملف .env محلي للاختبار.");
}

// جلب المنتجات
app.get("/api/products", async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      headers: { "api-token": API_TOKEN }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("products error:", err);
    res.status(500).json({ error: err.message });
  }
});

// إنشاء طلب جديد
app.post("/api/newOrder/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty, playerId } = req.body;
    if (!qty) return res.status(400).json({ error: "qty is required" });

    const uuid = uuidv4();
    const params = new URLSearchParams({ qty: String(qty), order_uuid: uuid });
    if (playerId) params.append("playerId", playerId);

    const response = await fetch(`${API_BASE}/newOrder/${encodeURIComponent(productId)}/params?${params.toString()}`, {
      method: "POST",
      headers: { "api-token": API_TOKEN }
    });
    const data = await response.json();
    // أرفق uuid العميل للتتبع
    if (data && data.data) data.data.client_order_uuid = uuid;
    res.json(data);
  } catch (err) {
    console.error("newOrder error:", err);
    res.status(500).json({ error: err.message });
  }
});

// تحقق من حالة طلبات
// يمكن استدعاؤها كـ /api/check?orders=["UUID"]&uuid=1 أو orders=123,124
app.get("/api/check", async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const response = await fetch(`${API_BASE}/check?${qs}`, {
      headers: { "api-token": API_TOKEN }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("check error:", err);
    res.status(500).json({ error: err.message });
  }
});

// health
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// serve index.html by default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));