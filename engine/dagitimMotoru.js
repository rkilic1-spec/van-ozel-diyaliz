const fs = require("fs");
const path = require("path");

function oku(dosya) {
  const yol = path.join(__dirname, "..", "data", dosya);
  if (!fs.existsSync(yol)) return [];
  return JSON.parse(fs.readFileSync(yol, "utf8"));
}

function yaz(dosya, veri) {
  fs.writeFileSync(
    path.join(__dirname, "..", "data", dosya),
    JSON.stringify(veri, null, 2)
  );
}

function calistir(hafta) {
  console.log("🔵 DAĞITIM MOTORU ÇALIŞTI →", hafta);

  const hastalar = oku("hastalar.json").filter(h => h.aktif !== false);
  const hemsireler = oku("hemsireler.json").filter(h => h.aktif !== false);
  const haftalar = oku("haftalar.json");

  if (!hafta) {
    throw new Error("Hafta bilgisi gelmedi");
  }

  const mevcut = haftalar.find(h => h.hafta === hafta);
  if (mevcut && mevcut.kilitli) {
    console.log("⛔ Hafta kilitli");
    return;
  }

  const toplamHasta = hastalar.length;
  const hemsireSayisi = hemsireler.length;

  if (hemsireSayisi === 0) {
    throw new Error("Hiç hemşire yok");
  }

  const taban = Math.floor(toplamHasta / hemsireSayisi);
  const kalan = toplamHasta % hemsireSayisi;

  const hedefler = hemsireler.map((h, i) => ({
    hemsireId: h.id,
    hedefHasta: i < kalan ? taban + 1 : taban,
    mevcutHasta: 0,
    mevcutSeans: 0
  }));

  let atamalar = [];

  hastalar.sort((a, b) => a.cihaz - b.cihaz);

  for (let hasta of hastalar) {
    let uygunlar = hedefler
      .filter(h => h.mevcutHasta < h.hedefHasta && h.mevcutSeans < 10)
      .sort((a, b) => a.mevcutHasta - b.mevcutHasta);

    if (uygunlar.length === 0) continue;

    let secilen = uygunlar[0];
    secilen.mevcutHasta++;
    secilen.mevcutSeans += (hasta.gunler?.length || 1);

    atamalar.push({
      hafta,
      hemsireId: secilen.hemsireId,
      hastaId: hasta.id,
      cihaz: hasta.cihaz,
      seans: hasta.seans,
      gunler: hasta.gunler || []
    });
  }

  haftalar.push({
    hafta,
    kilitli: true,
    atamalar
  });

  yaz("haftalar.json", haftalar);

  console.log("✅ Haftalık dağıtım tamamlandı");
}

module.exports = {
  calistir
};
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
  const hemsireler = oku(DATA("hemsireler.json"));
  const hastalar = oku(DATA("hastalar.json"));
  const izinler = oku(DATA("izinler.json"), {});
  const dagitimlar = {};

  dagitimlar[haftaKodu] = [];

  // hemşire başına hasta sayacı
  const sayac = {};
  hemsireler.forEach(h => sayac[h.id] = 0);

  for (const gun of GUNLER) {
    for (const seans of SEANSLAR) {

      const anahtar = `${gun}_${seans}`;
      const manuel = izinler?.[haftaKodu]?.[anahtar];

      // Bu gün-seans için hastalar
      const seansHastalari = hastalar.filter(h =>
        h.aktif &&
        h.seans === seans &&
        (
          (gun === "Pzt" || gun === "Çar" || gun === "Cum") &&
          h.gunGrubu === "Pzt-Çrş-Cum"
          ||
          (gun === "Sal" || gun === "Per" || gun === "Cts") &&
          h.gunGrubu === "Sal-Per-Cts"
        )
      );

      for (const hasta of seansHastalari) {

        let hemsire;

        if (manuel) {
          hemsire = hemsireler.find(h => h.adSoyad === manuel);
        } else {
          hemsire = hemsireler
            .filter(h => h.aktif)
            .sort((a, b) => sayac[a.id] - sayac[b.id])[0];
        }

        if (!hemsire) continue;

        sayac[hemsire.id]++;

        dagitimlar[haftaKodu].push({
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
  console.log("✅ Haftalık dağıtım tamamlandı:", haftaKodu);
}

module.exports = { haftalikDagitimYap };
