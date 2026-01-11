console.log("🔥 DAGITIM MOTORU YÜKLENDİ");

const fs = require("fs");
const path = require("path");

const DATA = (f) => path.join(__dirname, "..", "data", f);

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const SEANSLAR = ["Sabah", "Öğle"];

function oku(file, def) {
  if (!fs.existsSync(file)) return def;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function yaz(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function haftalikDagitimYap(hafta) {
  if (!hafta) throw new Error("Hafta yok");

  console.log("🔄 Dağıtım başlıyor:", hafta);

  const hastalar = oku(DATA("hastalar.json"), []);
  const hemsireler = oku(DATA("hemsireler.json"), []);
  const dagitimlar = oku(DATA("dagitimlar.json"), {});

  dagitimlar[hafta] = [];

  if (hastalar.length === 0) {
    console.log("⛔ Hasta yok");
    yaz(DATA("dagitimlar.json"), dagitimlar);
    return;
  }

  if (hemsireler.length === 0) {
    console.log("⛔ Hemşire yok");
    yaz(DATA("dagitimlar.json"), dagitimlar);
    return;
  }

  let sayac = {};
  hemsireler.forEach(h => sayac[h.id] = 0);

  for (const gun of GUNLER) {
    for (const seans of SEANSLAR) {

      const uygunHastalar = hastalar.filter(h =>
        h.aktif === true &&
        h.seans === seans &&
        (
          (["Pzt","Çar","Cum"].includes(gun) && h.gunGrubu === "Pzt-Çar-Cum") ||
          (["Sal","Per","Cts"].includes(gun) && h.gunGrubu === "Sal-Per-Cts")
        )
      );

      for (const hasta of uygunHastalar) {
        const hemsire = hemsireler
          .filter(h => h.aktif)
          .sort((a,b) => sayac[a.id] - sayac[b.id])[0];

        if (!hemsire) continue;

        sayac[hemsire.id]++;

        dagitimlar[hafta].push({
          gun,
          seans,
          cihaz: hasta.cihaz,
          hasta: hasta.ad,
          hemsire: hemsire.adSoyad
        });
      }
    }
  }

  yaz(DATA("dagitimlar.json"), dagitimlar);
  console.log("✅ Dağıtım yazıldı:", hafta);
}

module.exports = { haftalikDagitimYap };

