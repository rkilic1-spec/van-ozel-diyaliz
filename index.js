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
