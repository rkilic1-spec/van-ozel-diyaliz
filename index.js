console.log("🚀 INDEX.JS ÇALIŞTI");
app.post("/admin/hemsire-ekle", (req, res) => {
  res.send("OK - ROUTE ÇALIŞIYOR");
});

const express = require("express");
const session = require("express-session");
const path = require("path");

const dagitimMotoru = require("./engine/dagitimMotoru");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== MIDDLEWARE =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 🔴 ÖNEMLİ
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

function requireHemsire(req, res, next) {
  if (!req.session.user || req.session.user.role !== "hemsire") {
    return res.redirect("/login/hemsire");
  }
  next();
}

// ===== LOGIN =====
app.get("/", (req, res) => res.redirect("/login/admin"));

app.get("/login/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin-login.html"));
});

app.get("/login/hemsire", (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire-login.html"));
});

app.post("/login/admin", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "1234") {
    req.session.user = { role: "admin" };
    return res.redirect("/admin");
  }
  res.send("Hatalı admin girişi");
});

app.post("/login/hemsire", (req, res) => {
  if (req.body.username === "hemsire" && req.body.password === "1234") {
    req.session.user = { role: "hemsire", hemsireId: 1 };
    return res.redirect("/hemsire");
  }
  res.send("Hatalı hemşire girişi");
});

// ===== PANELLER =====
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/hemsire", requireHemsire, (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire.html"));
});

// ===== DAĞITIMI ÇALIŞTIR (ADMIN) =====
app.post("/admin/dagitim-calistir", requireAdmin, (req, res) => {
  console.log("➡️ DAĞITIM İSTEĞİ:", req.body);

  try {
    const { hafta } = req.body;

    if (!hafta) {
      throw new Error("hafta bilgisi gelmedi");
    }

    dagitimMotoru.calistir(hafta);

    res.send("✅ Dağıtım başarıyla çalıştı");
  } catch (err) {
    console.error("❌ DAĞITIM HATASI:", err.message);
    res.status(500).send("Dağıtım hatası: " + err.message);
  }
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL HATA:", err.stack);
  res.status(500).send("Sunucu hatası: " + err.message);
});

// ===== SERVER =====
app.listen(PORT, "0.0.0.0", () =>
  console.log("Server aktif:", PORT)
);
///HEMSİRE EKLE///
const fs = require("fs");

function oku(dosya) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", dosya), "utf8"));
}

function yaz(dosya, veri) {
  fs.writeFileSync(
    path.join(__dirname, "data", dosya),
    JSON.stringify(veri, null, 2)
  );
}

  hemsireler.push({
    id: Date.now(),
    adSoyad,
    tc,
    aktif: true
  });

  yaz("hemsireler.json", hemsireler);
  res.redirect("/admin");
});
const fs = require("fs");

// JSON yardımcıları (index.js içinde YOKSA)
function oku(dosya) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", dosya), "utf8")
  );
}

function yaz(dosya, veri) {
  fs.writeFileSync(
    path.join(__dirname, "data", dosya),
    JSON.stringify(veri, null, 2)
  );
}

// ===== HEMŞİRE EKLE =====
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  try {
    const { adSoyad, tc } = req.body;

    if (!adSoyad || !tc) {
      return res.status(400).send("Ad Soyad ve TC zorunlu");
    }

    let hemsireler = oku("hemsireler.json");

    if (hemsireler.find(h => h.tc === tc)) {
      return res.send("Bu TC ile hemşire zaten kayıtlı");
    }

    hemsireler.push({
      id: Date.now(),
      adSoyad,
      tc,
      aktif: true
    });

    yaz("hemsireler.json", hemsireler);

    res.redirect("/admin");
  } catch (err) {
    console.error("❌ HEMŞİRE EKLE HATASI:", err);
    res.status(500).send("Hemşire ekleme hatası");
  }
});
