const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data");
const FILE = path.join(DATA, "dagitimlar.json");

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const SEANSLAR = ["Sabah", "Öğle"];

function oku(file, def = []) {
  if (!fs.existsSync(file)) return def;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function yaz(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function haftalikDagitimYap(hafta) {
  const hemsireler = oku(path.join(DATA, "hemsireler.json"));
  const hastalar = oku(path.join(DATA, "hastalar.json"));
  let dagitimlar = oku(FILE, {});

  dagitimlar[hafta] = [];

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

  yaz(FILE, dagitimlar);
}

module.exports = { haftalikDagitimYap };
