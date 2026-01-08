const fs = require("fs");
const path = require("path");

// JSON yardımcıları
function oku(dosya) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", dosya)));
}

function yaz(dosya, veri) {
  fs.writeFileSync(
    path.join(__dirname, "..", "data", dosya),
    JSON.stringify(veri, null, 2)
  );
}

// Ana fonksiyon
function haftalikDagitimYap(hafta) {
  const hastalar = oku("hastalar.json").filter(h => h.aktif);
  const hemsireler = oku("hemsireler.json").filter(h => h.aktif);
  const izinler = oku("izinler.json");
  const haftalar = oku("haftalar.json");

  // Eğer hafta varsa ve kilitliyse → dokunma
  const mevcutHafta = haftalar.find(h => h.hafta === hafta);
  if (mevcutHafta && mevcutHafta.kilitli) {
    console.log("Hafta kilitli, sadece boş yerlere bakılabilir.");
    return;
  }

  // Adil hasta sayısı hesabı
  const toplamHasta = hastalar.length;
  const hemsireSayisi = hemsireler.length;

  const taban = Math.floor(toplamHasta / hemsireSayisi);
  const kalan = toplamHasta % hemsireSayisi;

  // Her hemşire için hedef
  const hedefler = hemsireler.map((h, i) => ({
    hemsireId: h.id,
    hedefHasta: i < kalan ? taban + 1 : taban,
    mevcutHasta: 0,
    mevcutSeans: 0
  }));

  let atamalar = [];

  // Hastaları sırala (ana cihaz öncelikli)
  hastalar.sort((a, b) => a.cihaz - b.cihaz);

  for (let hasta of hastalar) {
    // Uygun hemşireleri bul
    let uygunlar = hedefler
      .filter(h =>
        h.mevcutHasta < h.hedefHasta &&
        h.mevcutSeans < 10
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

  // Haftayı kaydet
  haftalar.push({
    hafta,
    kilitli: true,
    atamalar
  });

  yaz("haftalar.json", haftalar);
  console.log("Haftalık dağıtım tamamlandı.");
}

module.exports = { haftalikDagitimYap };

