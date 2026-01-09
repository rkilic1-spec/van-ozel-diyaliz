const express = require("express");
const session = require("express-session");
const path = require("path");

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
    req.session.user = { role: "hemsire" };
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

const fs = require("fs");

// ===== HEMŞİRE EKLE (GERÇEK) =====
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;

  if (!adSoyad || !tc) {
    return res.send("Eksik bilgi");
  }

  const dosyaYolu = path.join(__dirname, "data", "hemsireler.json");

  let hemsireler = [];
  if (fs.existsSync(dosyaYolu)) {
    hemsireler = JSON.parse(fs.readFileSync(dosyaYolu));
  }

  // TC mükerrer kontrol
  if (hemsireler.find(h => h.tc === tc)) {
    return res.send("Bu TC ile kayıtlı hemşire var");
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



// ===== HEMŞİRE EKLE =====
const fs = require("fs");

app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;

  if (!adSoyad || !tc) {
    return res.status(400).send("Eksik bilgi");
  }

  const dosyaYolu = path.join(__dirname, "data", "hemsireler.json");

  let hemsireler = [];
  if (fs.existsSync(dosyaYolu)) {
    hemsireler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  }

  // Aynı TC kontrolü
  if (hemsireler.find(h => h.tc === tc)) {
    return res.send("Bu TC ile hemşire zaten kayıtlı");
  }

  hemsireler.push({
    id: Date.now(),
    adSoyad,
    tc,
    aktif: true
  });

  fs.writeFileSync(dosyaYolu, JSON.stringify(hemsireler, null, 2));

  console.log("✅ Hemşire eklendi:", adSoyad);
  res.redirect("/admin");
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== SERVER =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif:", PORT);
});
