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

  if (username === USER.username && password === USER.password) {
    req.session.user = username;
    return res.redirect("/dashboard");
  }

  res.send("Hatalı kullanıcı adı veya şifre");
});

// ---- KORUMALI SAYFA ----
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  res.send(`
    <h1>Hoş geldiniz ${req.session.user}</h1>
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
