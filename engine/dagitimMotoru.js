const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname,"..","data");
const FILE = path.join(DATA,"dagitimlar.json");

const GUNLER = [
  { gun:"Pzt", grup:"Pzt-Çrş-Cum" },
  { gun:"Çar", grup:"Pzt-Çrş-Cum" },
  { gun:"Cum", grup:"Pzt-Çrş-Cum" },
  { gun:"Sal", grup:"Sal-Per-Cts" },
  { gun:"Per", grup:"Sal-Per-Cts" },
  { gun:"Cts", grup:"Sal-Per-Cts" }
];

const SEANSLAR = ["Sabah","Öğle"];

function oku(f,def){ return fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):def; }
function yaz(f,d){ fs.writeFileSync(f,JSON.stringify(d,null,2)); }

function haftalikDagitimYap(hafta){
  const hemsireler = oku(path.join(DATA,"hemsireler.json"),[]);
  const hastalar = oku(path.join(DATA,"hastalar.json"),[]);
  const dagitim = oku(FILE,{});

  dagitim[hafta]=[];

  let i=0;

  for(const g of GUNLER){
    for(const s of SEANSLAR){
      hastalar
        .filter(h=>h.aktif && h.seans===s && h.gunGrubu===g.grup)
        .forEach(h=>{
          const hem = hemsireler[i % hemsireler.length];
          dagitim[hafta].push({
            gun:g.gun,
            seans:s,
            hasta:h.ad,
            hemsire:hem.adSoyad
          });
          i++;
        });
    }
  }

  yaz(FILE,dagitim);
  console.log("✅ Dağıtım yazıldı",hafta);
}

module.exports={haftalikDagitimYap};
