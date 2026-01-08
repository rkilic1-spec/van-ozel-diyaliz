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

// ===== VERİLER =====
let hemsireler = []; // {id, adSoyad, tc, aktif}
let hemsireIdCounter = 1;

let hastalar = []; // {id, ad, cihaz, seans, gunGrubu, hemsireId}
let hastaIdCounter = 1;

app.get("/admin/hemsireler", requireAdmin, (req, res) => {
  res.json(hemsireler);
});

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

// ===== ADMIN PANEL =====
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// ===== HEMŞİRE PANEL =====
app.get("/hemsire", requireHemsire, (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire.html"));
});

// ===== HEMŞİRE EKLE =====
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;

  if (hemsireler.find(h => h.tc === tc)) {
    return res.send("Bu TC ile hemşire zaten var");
  }

  hemsireler.push({
    id: hemsireIdCounter++,
    adSoyad,
    tc,
    aktif: true,
  });

  res.redirect("/admin");
});

// ===== HASTA EKLE =====
app.post("/admin/hasta-ekle", requireAdmin, (req, res) => {
  const { ad, cihaz, seans, gunGrubu } = req.body;

  if (hastalar.find(h => h.cihaz == cihaz && h.seans === seans)) {
    return res.send("Bu cihaz ve seans dolu");
  }

  hastalar.push({
    id: hastaIdCounter++,
    ad,
    cihaz: Number(cihaz),
    seans,
    gunGrubu,
    hemsireId: null,
  });

  otomatikDagit();
  res.redirect("/admin");
});

// ===== OTOMATİK DAĞITIM =====
function otomatikDagit() {
  hastalar.forEach(h => (h.hemsireId = null));

  hemsireler
    .filter(h => h.aktif)
    .forEach(hemsire => {
      let sayac = 0;

      hastalar.forEach(hasta => {
        if (sayac < 5 && hasta.hemsireId === null) {
          hasta.hemsireId = hemsire.id;
          sayac++;
        }
      });
    });
}

// ===== HEMŞİRE HASTALARI =====
app.get("/hemsire/hastalar", requireHemsire, (req, res) => {
  res.json(hastalar);
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== SERVER =====
app.listen(PORT, "0.0.0.0", () =>
  console.log("Server aktif:", PORT)
);
