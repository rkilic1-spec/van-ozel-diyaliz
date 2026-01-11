const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/data", express.static(path.join(__dirname, "data")));

app.use(session({
  secret: "van-diyaliz",
  resave: false,
  saveUninitialized: true
}));

function ensure(file, def) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(def, null, 2));
  }
}

const DATA = path.join(__dirname, "data");
ensure(path.join(DATA, "hastalar.json"), []);
ensure(path.join(DATA, "hemsireler.json"), []);
ensure(path.join(DATA, "dagitimlar.json"), {});

function requireAdmin(req,res,next){
  if(!req.session.user) return res.redirect("/login/admin");
  next();
}

app.get("/", (req,res)=> res.redirect("/login/admin"));

app.get("/login/admin",(req,res)=>{
  res.send(`
    <form method="POST">
      <input name="username">
      <input name="password" type="password">
      <button>Giriş</button>
    </form>
  `);
});

app.post("/login/admin",(req,res)=>{
  if(req.body.username==="admin" && req.body.password==="1234"){
    req.session.user={role:"admin"};
    return res.redirect("/admin");
  }
  res.send("Hatalı giriş");
});

app.get("/admin",requireAdmin,(req,res)=>{
  res.send(`
    <h2>Admin</h2>
    <form method="POST" action="/admin/dagitim">
      <input name="hafta" value="2026-01-HAFTA-1">
      <button>Dağıtımı Çalıştır</button>
    </form>
    <a href="/admin/dagitim/2026-01-HAFTA-1">Dağıtımı Gör</a>
  `);
});

const { haftalikDagitimYap } = require("./engine/dagitimMotoru");

app.post("/admin/dagitim",requireAdmin,(req,res)=>{
  haftalikDagitimYap(req.body.hafta);
  res.send("Dağıtım yapıldı");
});

app.get("/admin/dagitim/:hafta",requireAdmin,(req,res)=>{
  const d = JSON.parse(fs.readFileSync(path.join(DATA,"dagitimlar.json")));
  res.json(d[req.params.hafta] || []);
});

app.listen(PORT,()=>console.log("🚀 Server çalışıyor",PORT));
