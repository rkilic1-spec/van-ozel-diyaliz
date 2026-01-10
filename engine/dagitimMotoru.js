// engine/dagitimMotoru.js
const fs = require("fs");
const path = require("path");

const DATA = (file) => path.join(__dirname, "..", "data", file);

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const SEANSLAR = ["Sabah", "Öğle"];

function oku(file, def = []) {
  if (!fs.existsSync(file)) return def;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function yaz(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function haftalikDagitimYap(haftaKodu) {
  console.log("🔵 Dağıtım motoru çalıştı:", haftaKodu);

  const hemsireler = oku(DATA("hemsireler.json"));
  const hastalar = oku(DATA("hastalar.json"));
  const izinler = oku(DATA("izinler.json"), {});
  const dagitimlar = {};

  dagitimlar[haftaKodu] = [];

  // hemşire başına sayaç
  const sayac = {};
  hemsireler.forEach(h => sayac[h.id] = 0);

  for (const gun of GUNLER) {
    for (const seans of SEANSLAR) {

      const seansHastalari = hastalar.filter(h =>
        h.aktif &&
        h.seans === seans &&
        (
          (["Pzt","Çar","Cum"].includes(gun) && h.gunGrubu === "Pzt-Çrş-Cum") ||
          (["Sal","Per","Cts"].includes(gun) && h.gunGrubu === "Sal-Per-Cts")
        )
      );

      for (const hasta of seansHastalari) {
        const uygun = hemsireler
          .filter(h => h.aktif)
          .sort((a,b) => sayac[a.id] - sayac[b.id])[0];

        if (!uygun) continue;

        sayac[uygun.id]++;

        dagitimlar[haftaKodu].push({
          gun,
          seans,
          cihaz: hasta.cihaz,
          hasta: hasta.ad,
          hemsire: uygun.adSoyad
        });
      }
    }
  }

  yaz(DATA("dagitimlar.json"), dagitimlar);
  console.log("✅ Haftalık dağıtım tamamlandı");
}

module.exports = { haftalikDagitimYap };
