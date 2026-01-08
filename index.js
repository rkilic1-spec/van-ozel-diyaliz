let hemsireler = [];
let hemsireIdCounter = 1;

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "van-diyaliz-secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.post("/admin/hemsire-ekle", requireAdmin, (req, res) => {
  const { adSoyad, tc } = req.body;

  // TC kontrol
  const varMi = hemsireler.find(h => h.tc === tc);
  if (varMi) {
    return res.send("Bu TC ile hemşire zaten kayıtlı");
  }

  hemsireler.push({
    id: hemsireIdCounter++,
    adSoyad,
    tc,
    aktif: true
  });

  res.redirect("/admin");
});

// ===== YETKİ KONTROLLERİ =====
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
app.get("/admin/hastalar", requireAdmin, (req, res) => {
  res.json(hastalar);
});

// ===== LOGIN SAYFALARI =====
app.get("/", (req, res) => {
  res.redirect("/login/admin");
});

app.get("/login/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin-login.html"));
});

app.get("/login/hemsire", (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire-login.html"));
});

// ===== LOGIN İŞLEMLERİ =====
app.post("/login/admin", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.user = { username, role: "admin" };
    return res.redirect("/admin");
  }

  res.send("Hatalı admin bilgileri");
});

app.post("/login/hemsire", (req, res) => {
  const { username, password } = req.body;

  if (username === "hemsire1" && password === "1234") {
    req.session.user = { username, role: "hemsire" };
    return res.redirect("/hemsire");
  }

  res.send("Hatalı hemşire bilgileri");
});

// ===== PANELLER =====
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/hemsire", requireHemsire, (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire.html"));
});

// ===== HASTA EKLE =====
app.post("/admin/hasta-ekle", requireAdmin, (req, res) => {
  const { ad, cihaz, seans, gunGrubu } = req.body;

  const cakisma = hastalar.find(
    h => h.cihaz == cihaz && h.seans === seans
  );

  if (cakisma) {
    return res.send(`
      <script>
        alert("Bu cihaz ve seans için zaten bir hasta var!");
        window.location.href = "/admin";
      </script>
    `);
  }

  hastalar.push({
    id: hastaId++,
    ad,
    cihaz: Number(cihaz),
    seans,
    gunGrubu,
    hemsireId: null
  });

  // 🔁 DAĞITIMI ÇALIŞTIR
  hemsireHastaDagitimi();

  res.redirect("/admin");
});


  // ÇAKIŞMA KONTROLÜ
  const cakisma = hastalar.find(
    h => h.cihaz == cihaz && h.seans === seans
  );

  if (cakisma) {
    return res.send(`
      <script>
        alert("Bu cihaz ve seans için zaten bir hasta var!");
        window.location.href = "/admin";
      </script>
    `);
  }

  hastalar.push({
    id: hastaId++,
    ad,
    cihaz: Number(cihaz),
    seans,
    gunGrubu
  });

  res.redirect("/admin");
});

// ===== HEMŞİRELER =====
const hemsireler = [
  {
    id: 1,
    ad: "Ayşe",
    anaCihazlar: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    ad: "Fatma",
    anaCihazlar: [6, 7, 8, 9, 10]
  },
  {
    id: 3,
    ad: "Zeynep",
    anaCihazlar: [11, 12, 13, 14, 15]
  }
];
function hemsireHastaDagitimi() {
  // Her hastanın sorumlu hemşiresini sıfırla
  hastalar.forEach(h => h.hemsireId = null);

  hemsireler.forEach(hemsire => {
    let sayac = 0;

    // 1️⃣ Önce ana cihazlardaki hastalar
    hastalar.forEach(h => {
      if (
        sayac < 5 &&
        hemsire.anaCihazlar.includes(h.cihaz) &&
        h.hemsireId === null
      ) {
        h.hemsireId = hemsire.id;
        sayac++;
      }
    });

    // 2️⃣ Eksikse diğer cihazlardan tamamla
    if (sayac < 5) {
      hastalar.forEach(h => {
        if (
          sayac < 5 &&
          !hemsire.anaCihazlar.includes(h.cihaz) &&
          h.hemsireId === null
        ) {
          h.hemsireId = hemsire.id;
          sayac++;
        }
      });
    }
  });
}

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ===== SERVER =====
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif, port:", PORT);
});


// ===== HASTALAR =====
let hastalar = [];
let hastaId = 1;

app.get("/hemsire/hastalar", requireHemsire, (req, res) => {
  const hemsire = hemsireler.find(h => h.ad === req.session.user.username);

  const liste = hastalar.filter(h => h.hemsireId === hemsire.id);

  res.json(liste);
});
app.get("/admin", requireAdmin, (req, res) => {
  let liste = hemsireler.map(h => `
    <li>
      ${h.adSoyad} (${h.tc}) - 
      ${h.aktif ? "🟢 Aktif" : "🔴 Pasif"}
      <a href="/admin/hemsire-toggle/${h.id}">[Değiştir]</a>
    </li>
  `).join("");

  res.sendFile(path.join(__dirname, "views/admin.html"));
});
