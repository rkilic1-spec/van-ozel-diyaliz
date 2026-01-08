const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

// form verisini okumak için
app.use(express.urlencoded({ extended: true }));

// ANASAYFA – GİRİŞ FORMU
app.get("/", (req, res) => {
  res.send(`
    <h2>Giriş Yap</h2>
    <form method="POST" action="/login">
      <input type="text" name="username" placeholder="Kullanıcı Adı" required />
      <br/><br/>
      <input type="password" name="password" placeholder="Şifre" required />
      <br/><br/>
      <button type="submit">Giriş</button>
    </form>
  `);
});

// GİRİŞ KONTROLÜ
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    res.redirect("/dashboard");
  } else {
    res.send("Hatalı kullanıcı adı veya şifre");
  }
});

// GİRİŞTEN SONRAKİ SAYFA
app.get("/dashboard", (req, res) => {
  res.send("<h1>Hoş geldiniz 👋</h1><p>Başarıyla giriş yaptınız.</p>");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif, port:", PORT);
});
