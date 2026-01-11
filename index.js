app.get("/", (req, res) => {
  res.redirect("/login/admin");
});


const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const { haftalikDagitimYap } = require("./engine/dagitimMotoru");

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

const DATA = f => path.join(__dirname, "data", f);

function admin(req,res,next){
  if(!req.session.user) return res.redirect("/login");
  next();
}

app.get("/login",(r,s)=>s.send(`
<form method="POST">
<input name="u"><input name="p">
<button>Giriş</button>
</form>`));

app.post("/login",(r,s)=>{
  if(r.body.u==="admin" && r.body.p==="1234"){
    r.session.user={admin:true};
    s.redirect("/admin");
  } else s.send("Hatalı");
});

app.get("/admin",admin,(r,s)=>{
  s.sendFile(path.join(__dirname,"views/admin.html"));
});

/* HEMŞİRE */
app.post("/admin/hemsire-ekle",admin,(r,s)=>{
  const list = JSON.parse(fs.readFileSync(DATA("hemsireler.json")));
  list.push({
    id:Date.now(),
    adSoyad:r.body.adSoyad,
    aktif:true
  });
  fs.writeFileSync(DATA("hemsireler.json"),JSON.stringify(list,null,2));
  s.redirect("/admin");
});

/* HASTA */
app.post("/admin/hasta-ekle",admin,(r,s)=>{
  const list = JSON.parse(fs.readFileSync(DATA("hastalar.json")));
  list.push({
    id:Date.now(),
    ad:r.body.ad,
    cihaz:Number(r.body.cihaz),
    gunGrubu:r.body.gunGrubu,
    seans:r.body.seans,
    aktif:true
  });
  fs.writeFileSync(DATA("hastalar.json"),JSON.stringify(list,null,2));
  s.redirect("/admin");
});

/* DAĞITIM */
app.post("/admin/dagitim",admin,(r,s)=>{
  haftalikDagitimYap(r.body.hafta);
  s.redirect("/admin");
});

/* GETİR */
app.get("/admin/dagitim/:hafta",admin,(r,s)=>{
  const d = JSON.parse(fs.readFileSync(DATA("dagitimlar.json")));
  s.json(d[r.params.hafta]||[]);
});

app.listen(PORT,()=>console.log("🚀 Server:",PORT));
