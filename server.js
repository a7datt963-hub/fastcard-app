// إنشاء طلب جديد
app.post("/api/newOrder/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty, playerId } = req.body;

    if (!qty) {
      return res.status(400).json({ error: "qty is required" });
    }

    const uuid = uuidv4();

    // نرسل الطلب كـ JSON body بدلاً من query params
    const response = await fetch(`${API_BASE}/newOrder/${encodeURIComponent(productId)}`, {
      method: "POST",
      headers: {
        "api-token": API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        qty,
        order_uuid: uuid,
        playerId
      })
    });

    const data = await response.json();

    // أرفق uuid العميل للتتبع
    if (data && data.data) {
      data.data.client_order_uuid = uuid;
    }

    res.json(data);
  } catch (err) {
    console.error("newOrder error:", err);
    res.status(500).json({ error: err.message });
  }
});
