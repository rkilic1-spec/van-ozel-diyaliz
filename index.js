const path = require("path");
const express = require("express");
const session = require("express-session");

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
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/");
  }
  next();
}

function requireHemsire(req, res, next) {
  if (!req.session.user || req.session.user.role !== "hemsire") {
    return res.redirect("/");
  }
  next();
}

// ---- KULLANICI ----
const USER = {
  username: "admin",
  password: "1234",
};

// ---- GİRİŞ SAYFASI ----
app.get("/", (req, res) => {
  res.send(`
    <h2>Van Özel Diyaliz Merkezi</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="Kullanıcı Adı" required /><br><br>
      <input name="password" type="password" placeholder="Şifre" required /><br><br>
      <button type="submit">Giriş Yap</button>
    </form>
  `);
});

// ---- LOGIN ----
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // ADMIN
  if (username === "admin" && password === "1234") {
    req.session.user = { username, role: "admin" };
    return res.redirect("/admin");
  }

  // HEMŞİRE
  if (username === "hemsire1" && password === "1234") {
    req.session.user = { username, role: "hemsire" };
    return res.redirect("/hemsire");
  }

  res.send("Hatalı kullanıcı adı veya şifre");
});
// HEMŞİRE LOGIN SAYFASI
app.get("/login/hemsire", (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire-login.html"));
});


// ---- KORUMALI SAYFA ----
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  res.send(`
    <h1>Hoş geldiniz ${req.session.user.username}</h1>
    <p>Sistem aktif.</p>
    <a href="/logout">Çıkış Yap</a>
  `);
});

// ---- LOGOUT ----
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ---- SERVER ----
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif, port:", PORT);
});

// ===== HEMŞİRE TAKİP =====
let seanslar = [];
const SEANS_SAAT = 4.5;

app.get("/hemsire", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "views/hemsire.html"));
});

app.get("/admin", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.post("/seans-ekle", (req, res) => {
  const { hemsire, gun, vardiya } = req.body;
  seanslar.push({ hemsire, gun, vardiya });
  res.redirect("/hemsire");
});

app.get("/seanslar", (req, res) => {
  res.json(seanslar);
});

app.get("/seans-ozet", (req, res) => {
  const ozet = {};
  seanslar.forEach(s => {
    ozet[s.hemsire] = (ozet[s.hemsire] || 0) + SEANS_SAAT;
  });
  res.json(
    Object.keys(ozet).map(h => ({ hemsire: h, saat: ozet[h] }))
  );
});

app.post("/haftalik-reset", (req, res) => {
  seanslar = [];
  res.redirect("/admin");
});

// 🔐 YETKİ KORUMALI SAYFALAR

app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/hemsire", requireHemsire, (req, res) => {
  res.sendFile(path.join(__dirname, "views/hemsire.html"));
});

});
app.post("/login/admin", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.user = { username, role: "admin" };
    return res.redirect("/admin");
  }

  res.send(`
    <script>
      alert("Hatalı kullanıcı adı veya şifre");
      window.location.href = "/login/admin";
    </script>
  `);
});



