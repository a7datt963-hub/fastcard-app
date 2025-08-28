async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("output").textContent = "❌ خطأ: " + err.message;
  }
}

async function getProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("output").textContent = "❌ خطأ: " + err.message;
  }
}
