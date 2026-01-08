const http = require("http");
const PORT = process.env.PORT || 10000;

// Kullanıcılar
const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "hemsire1", password: "1234", role: "hemsire" }
];

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // GİRİŞ SAYFASI (GET)
  if (req.method === "GET" && req.url === "/") {
    return res.end(`
      <h2>Van Özel Diyaliz Merkezi - Giriş</h2>
      <form method="POST">
        <input name="username" placeholder="Kullanıcı adı" required /><br><br>
        <input name="password" type="password" placeholder="Şifre" required /><br><br>
        <button>Giriş Yap</button>
      </form>
    `);
  }

  // GİRİŞ KONTROLÜ (POST)
  if (req.method === "POST" && req.url === "/") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const data = new URLSearchParams(body);
      const username = data.get("username");
      const password = data.get("password");

      const user = users.find(
        u => u.username === username && u.password === password
      );

      if (!user) {
        return res.end("<h3>Hatalı giriş</h3><a href='/'>Geri</a>");
      }

      if (user.role === "admin") {
        res.writeHead(302, { Location: "/admin" });
        return res.end();
      }

      if (user.role === "hemsire") {
        res.writeHead(302, { Location: "/hemsire" });
        return res.end();
      }
    });
  }

  // ADMIN PANEL
  if (req.url === "/admin") {
    return res.end(`
      <h1>ADMIN PANELİ</h1>
      <p>Hoş geldin Admin</p>
      <a href="/">Çıkış</a>
    `);
  }

  // HEMŞİRE PANEL
  if (req.url === "/hemsire") {
    return res.end(`
      <h1>HEMŞİRE PANELİ</h1>
      <p>Hoş geldin Hemşire</p>
      <a href="/">Çıkış</a>
    `);
  }

  res.end("Sayfa bulunamadı");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif:", PORT);
});
