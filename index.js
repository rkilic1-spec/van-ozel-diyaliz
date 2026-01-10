const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");


const app = express();
const PORT = process.env.PORT || 10000;

/* ================== MIDDLEWARE ================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "van-diyaliz-secret",
    resave: false,
    saveUninitialized: true,
  })
);

/* ================== HELPERS ================== */
function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "[]");
  }
}

const DATA_DIR = path.join(__dirname, "data");
const HEMSIRE_FILE = path.join(DATA_DIR, "hemsireler.json");
const HASTA_FILE = path.join(DATA_DIR, "hastalar.json");

ensureFile(HEMSIRE_FILE);
ensureFile(HASTA_FILE);

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


/* ================== LOGIN ================== */
app.get("/", (req, res) => res.redirect("/login/admin"));

app.get("/login/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin-login.html"));
});

app.post("/login/admin", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    req.session.user = { role: "admin" };
    return res.redirect("/admin");
  }
  res.send("Hatalı giriş");
});

/* ================== ADMIN ================== */
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/admin/cizelge", requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname,"views/admin-cizelge.html"));
});

app.post("/admin/izinler-kaydet", requireAdmin, (req,res)=>{
  const { hafta, ...veriler } = req.body;

  const dosya = path.join(__dirname,"data","izinler.json");
  if(!fs.existsSync(path.dirname(dosya))){
    fs.mkdirSync(path.dirname(dosya),{recursive:true});
  }

  let json = {};
  if(fs.existsSync(dosya)){
    json = JSON.parse(fs.readFileSync(dosya,"utf8"));
  }

  json[hafta] = {};

  Object.keys(veriler).forEach(k=>{
    const [id,gun,seans] = k.split("_");
    if(!json[hafta][id]) json[hafta][id]=[];
    json[hafta][id].push(`${gun}_${seans}`);
  });

  fs.writeFileSync(dosya, JSON.stringify(json,null,2));
  res.send("✅ Haftalık çizelge kaydedildi");
});


/* ================== HEMŞİRE EKLE ================== */
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;
  if (!adSoyad || !tc) return res.status(400).send("Eksik bilgi");

  const hemsireler = JSON.parse(fs.readFileSync(HEMSIRE_FILE, "utf8"));

  if (hemsireler.find(h => h.tc === tc)) {
    return res.send("Bu TC zaten kayıtlı");
  }

  hemsireler.push({
    id: Date.now(),
    adSoyad,
    tc,
    aktif: true
  });

  fs.writeFileSync(HEMSIRE_FILE, JSON.stringify(hemsireler, null, 2));
  res.redirect("/admin");
});

/* ================== HEMŞİRE LİSTESİ ================== */
app.get("/admin/hemsireler", requireAdmin, (req, res) => {
  const hemsireler = JSON.parse(fs.readFileSync(HEMSIRE_FILE, "utf8"));
  res.json(hemsireler);
});

// ===== HEMŞİREYE CİHAZ TANIMLA =====
app.post("/admin/hemsire-cihaz", requireAdmin, (req, res) => {
  const { hemsireId, cihazlar } = req.body;

  const dosyaYolu = path.join(__dirname, "data", "hemsireler.json");
  let hemsireler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));

  hemsireler = hemsireler.map(h =>
    h.id == hemsireId
      ? { ...h, cihazlar: cihazlar.map(Number) }
      : h
  );

  fs.writeFileSync(dosyaYolu, JSON.stringify(hemsireler, null, 2));
  res.redirect("/admin");
});

const { haftalikDagitimYap } = require("./engine/dagitimMotoru");

app.post("/admin/dagitim-calistir", requireAdmin, (req, res) => {
  const { hafta } = req.body;

  if (!hafta) {
    return res.status(400).send("Hafta bilgisi yok");
  }

  try {
    haftalikDagitimYap(hafta);
    res.send("✅ Dağıtım başarıyla çalıştırıldı");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Dağıtım hatası: " + err.message);
  }
});


// ===== HAFTALIK İZİN KAYDET =====
app.post("/admin/izin-kaydet", requireAdmin, (req, res) => {
  const { hafta, izin } = req.body;

  const dosyaYolu = path.join(__dirname, "data", "izinler.json");

  let izinler = {};
  if (fs.existsSync(dosyaYolu)) {
    izinler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  }

  izinler[hafta] = izin || {};

  fs.writeFileSync(dosyaYolu, JSON.stringify(izinler, null, 2));
  res.redirect("/admin");
});

app.get("/admin/izinler", requireAdmin, (req, res) => {
  const dosyaYolu = path.join(__dirname, "data", "izinler.json");

  if (!fs.existsSync(dosyaYolu)) {
    return res.json([]);
  }

  const izinler = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  res.json(izinler);
});

// ===== HAFTALIK DAĞITIMI GETİR =====
app.get("/admin/dagitim/:hafta", requireAdmin, (req, res) => {
  const hafta = req.params.hafta;
  const dosya = path.join(__dirname, "data", "dagitimlar.json");

  if (!fs.existsSync(dosya)) {
    return res.json([]);
  }

  const dagitimlar = JSON.parse(fs.readFileSync(dosya, "utf8"));

  res.json(dagitimlar[hafta] || []);
});


// ===== HEMŞİREYE AİT HASTALAR =====
app.get("/hemsire/hastalar", requireHemsire, (req, res) => {
  const hemsireId = req.session.user.hemsireId;

  const hemsireler = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "hemsireler.json"), "utf8")
  );

  const hastalar = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "hastalar.json"), "utf8")
  );

  const hemsire = hemsireler.find(h => h.id == hemsireId);
  if (!hemsire || !hemsire.cihazlar) return res.json([]);

  const liste = hastalar.filter(
    h => h.aktif && hemsire.cihazlar.includes(h.cihaz)
  );

  res.json(liste);
});

/* ================== HASTA EKLE ================== */
app.post("/admin/hasta-ekle", requireAdmin, (req, res) => {
  const { ad, cihaz, gunGrubu, seans } = req.body;

  if (!ad || !cihaz || !gunGrubu || !seans) {
    return res.status(400).send("Eksik hasta bilgisi");
  }

  const hastalar = JSON.parse(fs.readFileSync(HASTA_FILE, "utf8"));

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

  fs.writeFileSync(HASTA_FILE, JSON.stringify(hastalar, null, 2));
  res.redirect("/admin");
});

// ===== HASTA PASİF YAP =====
app.post("/admin/hasta-pasif", requireAdmin, (req, res) => {
  const { id } = req.body;
  const dosyaYolu = path.join(__dirname, "data", "hastalar.json");

  let hastalar = JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));

  hastalar = hastalar.map(h =>
    h.id == id ? { ...h, aktif: false } : h
  );

  fs.writeFileSync(dosyaYolu, JSON.stringify(hastalar, null, 2));
  res.redirect("/admin");
});


/* ================== HASTA LİSTESİ ================== */
app.get("/admin/hastalar", requireAdmin, (req, res) => {
  const hastalar = JSON.parse(fs.readFileSync(HASTA_FILE, "utf8"));
  res.json(hastalar);
});

/* ================== LOGOUT ================== */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login/admin"));
});

/* ================== SERVER ================== */
app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor:", PORT);
});
