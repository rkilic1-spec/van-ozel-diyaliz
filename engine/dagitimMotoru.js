console.log("🔥 DAGITIM MOTORU YÜKLENDİ");

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DAGITIM_FILE = path.join(DATA_DIR, "dagitimlar.json");

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const SEANSLAR = ["Sabah", "Öğle"];

function oku(dosya, def = []) {
  if (!fs.existsSync(dosya)) return def;
  return JSON.parse(fs.readFileSync(dosya, "utf8"));
}

function yaz(dosya, veri) {
  fs.writeFileSync(dosya, JSON.stringify(veri, null, 2));
}

function haftalikDagitimYap(hafta) {
  console.log("🔄 Dağıtım başlatıldı:", hafta);

  const hemsireler = oku(path.join(DATA_DIR, "hemsireler.json"));
  const hastalar = oku(path.join(DATA_DIR, "hastalar.json"));
  const izinler = oku(path.join(DATA_DIR, "izinler.json"), {});
  let dagitimlar = oku(DAGITIM_FILE, {});

  dagitimlar[hafta] = [];

  let sayac = {};
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

        dagitimlar[hafta].push({
          gun,
          seans,
          cihaz: hasta.cihaz,
          hasta: hasta.ad,
          hemsire: uygun.adSoyad
        });
      }
    }
  }

  yaz(DAGITIM_FILE, dagitimlar);
  console.log("✅ Dağıtım dosyaya yazıldı:", hafta);
}

module.exports = { haftalikDagitimYap };
