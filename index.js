const http = require("http");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("VAN ÖZEL DİYALİZ MERKEZİ - SUNUCU ÇALIŞIYOR");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server aktif, port:", PORT);
});
