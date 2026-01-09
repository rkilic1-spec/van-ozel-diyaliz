const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== MIDDLEWARE =====
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "van-diyaliz-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ===== YETKİ =====
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login/admin");
  }
  next();
}

// ===== LOGIN =====
app.get("/", (req, res) => res.redirect("/login/admin"));

app.get("/login/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin-login.html"));
});

app.post("/login/admin", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "1234") {
    req.session.user = { role: "admin" };
    return res.redirect("/admin");
  }
  res.send("Hatalı admin girişi");
});

// ===== ADMIN PANEL =====
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// ===== HEMŞİRE EKLE (TEK VE TEMİZ) =====
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;
  if (!adSoyad || !tc) return res.send("Eksik bilgi");

  const dosyaYolu = path.join(__dirname, "data", "hemsireler.json");

  // ===== HASTA EKLE =====
app.post("/admin/hasta-ekle", requireAdmin, (req, res) => {
  const { ad, cihaz, gunGrubu, seans } = req.body;

  if (!ad || !cihaz || !gunGrubu || !seans) {
    return res.status(400).send("Eksik hasta bilgisi");
  }

  const dosyaYolu = path.join(__dirname, "data", "hastalar.json");

  let hastalar = [];
  if (fs.existsSync(dosyaYolu)) {
    hastalar = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  }

  // Aynı cihaz + aynı seans doluluk kontrolü
  if (hastalar.find(h => h.cihaz == cihaz && h.seans === seans)) {
    return res.send("Bu cihaz ve seans dolu");
  }

  hastalar.push({
    id: Date.now(),
    ad,
    cihaz: Number(cihaz),
    gunGrubu,
    seans,
    aktif: true
  });

  fs.writeFileSync(dosyaYolu, JSON.stringify(hastalar, null, 2));

  console.log("✅ Hasta eklendi:", ad);
  res.redirect("/admin");
});

  // 🔥 DOSYA YOKSA OLUŞTUR
  if (!fs.existsSync(dosyaYolu)) {
    fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
    fs.writeFileSync(dosyaYolu, "[]");
  }

  const hemsireler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));

  if (hemsireler.find(h => h.tc === tc)) {
    return res.send("Bu TC ile hemşire zaten var");
  }

  hemsireler.push({
    id: Date.now(),
    adSoyad,
    tc,
    aktif: true
  });

  fs.writeFileSync(dosyaYolu, JSON.stringify(hemsireler, null, 2));
  res.redirect("/admin");
});


// ===== HEMŞİRE LİSTESİ (TEST İÇİN) =====
app.get("/admin/hemsireler", requireAdmin, (req, res) => {
  const dosyaYolu = path.join(__dirname, "data", "hemsireler.json");
  const hemsireler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  res.json(hemsireler);
});
// ===== HASTA LİSTESİ (ADMIN) =====
app.get("/admin/hastalar", requireAdmin, (req, res) => {
  const dosyaYolu = path.join(__dirname, "data", "hastalar.json");

  let hastalar = [];
  if (fs.existsSync(dosyaYolu)) {
    hastalar = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  }

  res.json(hastalar);
});
const fs = require("fs");

// ===== HASTA LİSTESİ (ADMIN) =====
app.get("/admin/hastalar", requireAdmin, (req, res) => {
  const dosyaYolu = path.join(__dirname, "data", "hastalar.json");

  if (!fs.existsSync(dosyaYolu)) {
    return res.json([]);
  }

  const hastalar = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  res.json(hastalar);
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== SERVER =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server aktif:", PORT);
});
