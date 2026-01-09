const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));

// TEST LOG
console.log("🟢 MINI SERVER ÇALIŞTI");

// HEMŞİRE EKLE (TEST)
app.post("/admin/hemsire-ekle", (req, res) => {
  console.log("➡️ POST GELDİ:", req.body);
  res.send("OK HEMŞİRE EKLE ÇALIŞIYOR");
});

// TEST SAYFA
app.get("/", (req, res) => {
  res.send(`
    <h2>Mini Test</h2>
    <form method="POST" action="/admin/hemsire-ekle">
      <input name="adSoyad" placeholder="Ad Soyad" />
      <button type="submit">Gönder</button>
    </form>
  `);
});

app.listen(PORT, () => {
  console.log("🚀 Mini server ayakta:", PORT);
});
