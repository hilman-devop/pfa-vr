# Daftar Model 3D Berbayar — Pemetaan ke Environment PFA-VR

> Daftar kandidat model berbayar (lisensi komersial) yang cocok/mirip dengan objek di environment ruang tamu PFA-VR.
> Semua URL diverifikasi ada via hasil pencarian (Desember 2025 format situs). **Cek harga & format glTF di halaman produk sebelum beli** — harga bisa berubah dan situs marketplace memblokir pengecekan otomatis.

## Context environment sekarang

Environment ruang tamu dibangun dari primitif (a-box/a-sphere/a-cylinder) — semua objek di bawah ini adalah pengganti berkualitas yang "sama atau mirip" dengan objek yang sudah ada di scene. Semua situs menyediakan konversi glTF/GLB (filter `file_formats=gltf` tersedia di CGTrader).

---

## 1. Sofa (di scene: sofa 3-seat dari 6 box)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/furniture/sofa/blender-low-poly-sofa | Low-poly, cocok gaya sekarang |
| CGTrader | https://www.cgtrader.com/3d-models/furniture/sofa | (kategori — filter glTF + harga) |
| TurboSquid | https://www.turbosquid.com/3d-model/low-poly/sectional-sofa | Alternatif |

*Gratis legal (CC-BY, komersial + atribusi):* https://sketchfab.com/3d-models/dream-on-low-poly-sofa-cbc08e24225845b4addefb13c23085ed (1.9k tri)

## 2. Meja (di scene: meja kopi kayu dari 5 box)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/furniture/other/kragsta-coffee-table | Gaya IKEA |
| CGTrader | https://www.cgtrader.com/3d-models/furniture/table/bone-coffee-table | Alternatif |
| CGTrader | https://www.cgtrader.com/3d-models/furniture/table/gamino-coffee-table-walnut-finish | Kayu walnut — paling mirip warna sekarang |

## 3. Tanaman pot (di scene: tanaman dari cylinder + 4 sphere)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/plant/leaf/monstera-in-pot1 | Monstera — umum di ruang tamu |
| CGTrader | https://www.cgtrader.com/3d-models/plant/pot-plant/low-poly-popular-indoor-plant-collection | Pack beberapa tanaman — lebih hemat |
| CGTrader | https://www.cgtrader.com/3d-models/plant/pot-plant/monster-pot-plant | Alternatif |

*Gratis legal:* https://sketchfab.com/3d-models/monstera-deliciosa-potted-mid-century-plant-1ab9bf841df04c07b1819be596327629 (9.3k tri, game-ready)

## 4. Karpet (di scene: a-plane 4.2×3.6)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/architectural/decoration/low-poly-carpet-1-pbr | PBR, low-poly |
| CGTrader | https://www.cgtrader.com/3d-models/architectural/decoration/low-poly-game-ready-carpet-and-rug-collection | Pack rug |
| CGTrader | https://www.cgtrader.com/3d-models/architectural/floor/rugs-3d-model-with-low-poly | Alternatif |

## 5. Kabinet TV + TV (di scene: regal dari box)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/furniture/cabinet/mid-century-modern-tv-stand | Mid-century, cocok nuansa |
| CGTrader | https://www.cgtrader.com/3d-models/furniture/cabinet/tv-stand-2 | Alternatif |
| TurboSquid | https://www.turbosquid.com/3d-model/tv-stand | Pencarian |

*Gratis legal:* https://sketchfab.com/3d-models/television-with-blank-screen-ff2329f8275c4c2f9abe02d5481b3741 (642 tri — TV di atas console)

## 6. Pintu kayu (di scene: pintu dari box + kenop)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/architectural/door/interior-door-217fe620-b0dd-423e-8e51-4d6b51d94bc7 | Interior door |
| CGTrader | https://www.cgtrader.com/3d-models/interior/other/low-poly-door-1 | Low-poly |
| CGTrader | https://www.cgtrader.com/3d-models/interior/house-interior/low-poly-doors-pack-3 | Pack beberapa pintu |

## 7. Rak dinding (di scene: 2 shelf dari box)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/furniture/other/low-poly-wall-shelf-pack-01 | Pack shelf |

## 8. Layar proyektor (di scene: layar dari box + plane, jadi objek grounding S3)

| Sumber | URL | Catatan |
|---|---|---|
| CGTrader | https://www.cgtrader.com/3d-models/electronics/video/projector-screen | Layar saja |
| CGTrader | https://www.cgtrader.com/3d-models/electronics/video/projector-and-screen | Proyektor + layar |

*Gratis legal:* https://sketchfab.com/3d-models/projector-screen-low-poly-ad904b77975c44a98a4c33d78a1d5c2b (1.7k tri, game-ready — halaman terverifikasi penuh)

---

## Catatan penting sebelum beli

1. **Harga & ketersediaan glTF tidak bisa diverifikasi otomatis** (CGTrader/TurboSquid memblokir bot). Buka URL, cek: harga (umumnya $2–30/model), format file (pilih glTF/GLB), dan lisensi (pilih Royalty Free / Editorial BUKAN — harus **Royalty Free Commercial**).
2. **Untuk WebXR/Quest, prioritaskan low-poly** (idealnya < 20k triangle per objek) — headset budget seperti Quest 3S cepat drop FPS di scene berat.
3. **Pack/collection lebih hemat** daripada per-item kalau butuh beberapa objek sekaligus (tanaman, rug, pintu).
4. **Alternatif gratis CC-BY** legal untuk komersial dengan atribusi — bisa jadi pembanding sebelum memutuskan beli; kualitas sering setara dengan item berbayar murah.
5. Setelah beli: download GLB, letakkan di `public/models/`, ganti primitif terkait di `src/environment/environment.js`, jalankan `npm run build`, uji di Quest.
