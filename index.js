const http = require("http");
const querystring = require("querystring");

const PORT = process.env.PORT || 10000;

// Kullanıcılar (şimdilik sabit)
const USERS = {
  admin: { password: "123456", role: "admin" },
  hemsire1: { password: "1111", role: "hemsire" },
  hemsire2: { password: "2222", role: "hemsire" }
};

const server = http.createServer((req, res) => {

  // GİRİŞ SAYFASI
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Van Özel Diyaliz - Giriş</title>
      </head>
      <body style="font-family:Arial; background:#f4f4f4;">
        <h2>VAN ÖZEL DİYALİZ MERKEZİ</h2>
        <form method="POST">
          <label>Kullanıcı Adı</label><br>
          <input name="username" required><br><br>

          <label>Şifre</label><br>
          <input type="password" name="password" required><br><br>

          <button type="submit">Giriş Yap</button>
        </form>
      </body>
      </html>
    `);
  }

  // FORM GÖNDERİLİNCE
  else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const data = querystring.parse(body);
      const user = USERS[data.username];

      if (user && user.password === data.password) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <h2>Hoş geldin ${data.username}</h2>
          <p>Yetki: ${user.role}</p>
        `);
      } else {
        res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h3>Hatalı kullanıcı adı veya şifre</h3>");
      }
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif, port:", PORT);
});
