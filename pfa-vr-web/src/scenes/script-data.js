// script-data.js — SATU-SATUNYA sumber narasi & timing. Disalin dari NASKAH_VR.md.
// Struktur per scene: { id, judul, durasiTarget (detik), tujuanPFA, voiceLines: [{ teks, jeda }], cues }
// jeda = detik jeda SETELAH baris dibacakan.

// PLAYLIST = urutan scene yang BENAR-BENAR dimainkan (referensi ke id di SCENES).
// Dosen minta sesi ~2 menit: S3/S4/S5 DILEWATI (file & data tetap ada di repo, reversibel),
// S2 (napas) diulang 2×. Kembalikan ke ['s1'..'s7'] untuk memulihkan alur penuh.
export const PLAYLIST = ['s1', 's2', 's2', 's7']

export const SCENES = [
  {
    id: 's1',
    judul: 'Orientasi dan Rasa Aman',
    ambience: '/audio/amb-calm.ogg', // ruang tamu: pad tenang (bukan lagi amb-nature)
    durasiTarget: 90,
    tujuanPFA: 'Contact and Engagement',
    voiceLines: [
      { teks: 'Selamat datang.', jeda: 2 },
      { teks: 'Saat ini Anda berada di tempat yang aman.', jeda: 2 },
      { teks: 'Tidak ada bahaya di sekitar Anda.', jeda: 2 },
      { teks: 'Luangkan waktu sejenak untuk melihat ruangan di sekitar Anda.', jeda: 4 },
      { teks: 'Perhatikan benda-benda di sekitar Anda.', jeda: 3 },
      { teks: 'Perhatikan suasana ruangan yang tenang.', jeda: 3 },
      { teks: 'Dengarkan suasana yang tenang di sekitar Anda.', jeda: 4 },
      { teks: 'Anda aman di sini.', jeda: 4 },
    ],
  },
  {
    id: 's2',
    judul: 'Latihan Pernapasan',
    ambience: '/audio/amb-breath.ogg', // grup B: instrumental yoga lambat
    durasiTarget: 150,
    tujuanPFA: 'Safety and Comfort',
    voiceLines: [
      { teks: 'Sekarang mari bernapas bersama.', jeda: 2 },
      { teks: 'Tarik napas perlahan melalui hidung.', jeda: 1, cue: 'inhale-start' },
      { teks: 'Satu. Dua. Tiga.', jeda: 1, cue: 'inhale-end' },
      { teks: 'Tahan sejenak.', jeda: 2, cue: 'hold' },
      { teks: 'Hembuskan perlahan melalui mulut.', jeda: 1, cue: 'exhale-start' },
      { teks: 'Satu. Dua. Tiga.', jeda: 1, cue: 'exhale-end' },
    ],
    // Siklus napas dihitung di scene (s2.js membaca `siklus`). Dipangkas ke 2 agar total
    // sesi ringkas (~2 mnt): alur aktif S1→S2→S2→S7 (lihat PLAYLIST di bawah), S2 dimainkan 2×.
    siklus: 2,
  },
  {
    id: 's3',
    judul: 'Grounding 5-4-3-2-1',
    ambience: '/audio/amb-calm.ogg', // ruang tamu: pad tenang (sama dengan S1)
    durasiTarget: 150,
    tujuanPFA: 'Emotional Stabilization',
    voiceLines: [
      { teks: 'Sekarang mari kembali fokus pada saat ini.', jeda: 2 },
      { teks: 'Sebutkan dalam hati lima hal yang dapat Anda lihat.', jeda: 2, cue: 'grounding-see' },
      { teks: 'Sofa. Layar. Tanaman. Karpet. Meja.', jeda: 12, cue: 'grounding-objects' },
      { teks: 'Sekarang empat hal yang dapat Anda rasakan.', jeda: 10 },
      { teks: 'Tiga suara yang dapat Anda dengar.', jeda: 10 },
      { teks: 'Dua aroma yang dapat Anda bayangkan.', jeda: 8 },
      { teks: 'Dan satu hal yang membuat Anda bersyukur hari ini.', jeda: 10 },
    ],
    groundingTargets: ['sofa', 'layar', 'tanaman', 'karpet', 'meja'],
  },
  {
    id: 's4',
    judul: 'Membangun Kemampuan Kontrol Diri',
    ambience: '/audio/amb-calm.ogg', // grup C: pad universal hangat
    durasiTarget: 150,
    tujuanPFA: 'Practical Assistance',
    voiceLines: [
      { teks: 'Setelah mengalami peristiwa yang berat, banyak orang merasa kehilangan kendali.', jeda: 3 },
      { teks: 'Perasaan itu adalah hal yang wajar.', jeda: 3 },
      { teks: 'Saat ini fokuslah pada hal-hal yang masih dapat Anda lakukan.', jeda: 3, cue: 'symbols-show' },
      { teks: 'Anda dapat merawat diri.', jeda: 3, cue: 'symbol-air' },
      { teks: 'Anda dapat meminta bantuan.', jeda: 3, cue: 'symbol-rumah' },
      { teks: 'Anda dapat berbicara dengan orang yang Anda percaya.', jeda: 3, cue: 'symbol-keluarga' },
      { teks: 'Anda tidak harus menghadapi semuanya sendirian.', jeda: 4, cue: 'symbol-komunitas' },
    ],
    simbol: ['Air Minum', 'Rumah', 'Keluarga', 'Komunitas'],
  },
  {
    id: 's5',
    judul: 'Dukungan Sosial',
    ambience: '/audio/amb-calm.ogg', // grup C: pad universal
    durasiTarget: 120,
    tujuanPFA: 'Connection with Social Support',
    voiceLines: [
      { teks: 'Di sekitar Anda ada orang-orang yang peduli.', jeda: 3 },
      { teks: 'Keluarga.', jeda: 3, cue: 'silhouette-0' },
      { teks: 'Tetangga.', jeda: 3, cue: 'silhouette-1' },
      { teks: 'Relawan.', jeda: 3, cue: 'silhouette-2' },
      { teks: 'Petugas kesehatan.', jeda: 3, cue: 'silhouette-3' },
      { teks: 'Dukungan dapat membantu meringankan beban yang Anda rasakan.', jeda: 3 },
      { teks: 'Menghubungi seseorang bukanlah tanda kelemahan.', jeda: 3 },
      { teks: 'Itu adalah langkah untuk pulih.', jeda: 5 },
    ],
    siluet: ['Keluarga', 'Tetangga', 'Relawan', 'Tenaga Kesehatan'],
  },
  {
    id: 's6',
    judul: 'Harapan dan Resiliensi',
    ambience: '/audio/amb-calm.ogg', // grup C: pad universal
    durasiTarget: 90,
    tujuanPFA: 'Coping Information',
    voiceLines: [
      { teks: 'Apa yang Anda rasakan saat ini adalah reaksi yang normal, setelah mengalami peristiwa yang tidak biasa.', jeda: 4, cue: 'sunrise-start' },
      { teks: 'Pemulihan membutuhkan waktu.', jeda: 3 },
      { teks: 'Tidak apa-apa jika Anda masih merasa sedih.', jeda: 3 },
      { teks: 'Tidak apa-apa jika Anda masih merasa takut.', jeda: 3 },
      { teks: 'Setiap langkah kecil yang Anda lakukan adalah bagian dari proses pemulihan.', jeda: 3 },
      { teks: 'Anda telah bertahan hingga hari ini.', jeda: 3 },
      { teks: 'Itu menunjukkan kekuatan yang Anda miliki.', jeda: 5 },
    ],
  },
  {
    id: 's7',
    judul: 'Penutup dan Reorientasi',
    ambience: '/audio/amb-calm.ogg', // grup C: pad universal (penutup tenang)
    durasiTarget: 60,
    tujuanPFA: 'Linkage and Follow-up',
    voiceLines: [
      { teks: 'Terima kasih telah mengikuti sesi ini.', jeda: 3, cue: 'board-show' },
      { teks: 'Jika Anda masih merasa terganggu oleh pikiran, perasaan, atau kenangan yang muncul, bicarakan dengan tenaga kesehatan atau petugas pendamping.', jeda: 5 },
      { teks: 'Saat Anda siap, arahkan perhatian kembali ke ruangan tempat Anda berada.', jeda: 4 },
      { teks: 'Gerakkan jari tangan perlahan.', jeda: 3 },
      { teks: 'Tarik napas dalam satu kali lagi.', jeda: 4 },
      { teks: 'Dan buka mata secara perlahan.', jeda: 3 },
      { teks: 'Terima kasih.', jeda: 3 },
    ],
    papan: ['Anda Aman', 'Anda Tidak Sendiri', 'Bantuan Tersedia'],
  },
]
