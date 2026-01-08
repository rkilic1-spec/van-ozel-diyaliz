const fs = require("fs");
const path = require("path");

// ===================
// JSON yardımcıları
// ===================
function oku(dosya) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", dosya), "utf-8")
  );
}

function yaz(dosya, veri) {
  fs.writeFileSync(
    path.join(__dirname, "..", "data", dosya),
    JSON.stringify(veri, null, 2)
  );
}

// ===================
// ANA DAĞITIM FONKSİYONU
// ===================
function haftalikDagitimYap(hafta) {
  console.log("🔵 DAĞITIM MOTORU ÇALIŞTI →", hafta);

  const hastalar = oku("hastalar.json").filter(h => h.aktif);
  const hemsireler = oku("hemsireler.json").filter(h => h.aktif);
  const izinler = oku("izinler.json");
  let haftalar = oku("haftalar.json");

  // ---- Hafta kontrolü ----
  const mevcutHafta = haftalar.find(h => h.hafta === hafta);

  if (mevcutHafta && mevcutHafta.kilitli) {
    console.log("🟡 Hafta kilitli, sadece BOŞ hastalar dağıtılacak");
  }

  // ---- Adil hedef hesabı ----
  const toplamHasta = hastalar.length;
  const hemsireSayisi = hemsireler.length;

  const taban = Math.floor(toplamHasta / hemsireSayisi);
  const kalan = toplamHasta % hemsireSayisi;

  const hedefler = hemsireler.map((h, i) => ({
    hemsireId: h.id,
    hedefHasta: i < kalan ? taban + 1 : taban,
    mevcutHasta: 0,
    mevcutSeans: 0
  }));

  let atamalar = [];

  // ---- Hastaları cihaz sırasına göre sırala ----
  hastalar.sort((a, b) => a.cihaz - b.cihaz);

  for (let hasta of hastalar) {
    // Eğer kilitli hafta varsa ve hasta zaten atanmışsa geç
    if (mevcutHafta && mevcutHafta.kilitli) {
      const varMi = mevcutHafta.atamalar.find(a => a.hastaId === hasta.id);
      if (varMi) continue;
    }

    // ---- Uygun hemşireler ----
    let uygunlar = hedefler
      .filter(h =>
        h.mevcutHasta < h.hedefHasta &&
        h.mevcutSeans + hasta.gunler.length <= 10
      )
      .sort((a, b) => a.mevcutHasta - b.mevcutHasta);

    if (uygunlar.length === 0) continue;

    let secilen = uygunlar[0];

    secilen.mevcutHasta++;
    secilen.mevcutSeans += hasta.gunler.length;

    atamalar.push({
      hafta,
      hemsireId: secilen.hemsireId,
      hastaId: hasta.id,
      gunler: hasta.gunler,
      seans: hasta.seans,
      cihaz: hasta.cihaz
    });
  }

  // ---- Haftayı kaydet / güncelle ----
  if (mevcutHafta) {
    mevcutHafta.atamalar.push(...atamalar);
  } else {
    haftalar.push({
      hafta,
      kilitli: true,
      atamalar
    });
  }

  yaz("haftalar.json", haftalar);
  console.log("✅ Haftalık dağıtım tamamlandı");
}

// ===================
// DIŞARI AÇILAN FONKSİYON
// ===================
function calistir(hafta) {
  haftalikDagitimYap(hafta);
}

module.exports = { calistir };
