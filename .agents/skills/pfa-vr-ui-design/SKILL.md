---
name: pfa-vr-ui-design
description: Panduan desain UI untuk project PFA-VR (A-Frame WebXR + overlay DOM, konteks terapi korban bencana) — gabungan keputusan owner + guideline resmi Meta/Microsoft/Apple/W3C (legibilitas teks VR, penempatan panel, gaze dwell, caption, kenyamanan/cybersickness). Wajib dipakai saat membuat/mengubah/mereview elemen UI apa pun di pfa-vr-web — layar overlay (onboarding/jeda/selesai/bantuan), tombol, subtitle, HUD, panel dalam-VR (a-plane/a-text), warna, tipografi, layout, atau saat ada permintaan "ubah tampilan", "perbaiki UI", "tambah panel/tombol/teks". Berisi token desain final, keputusan owner yang tidak boleh dilanggar, dan jebakan A-Frame yang sudah terbukti.
---

# PFA-VR UI Design

Konteks: aplikasi terapi PFA untuk korban bencana. Nuansa WAJIB tenang, hangat, tidak mengagetkan — tanpa warna jenuh/mencolok, tanpa animasi cepat, tanpa transisi mendadak (kecuali fade hitam 1 dtk antar scene).

## Token desain (final — src/style.css `:root`)

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--bg` | `#0e2a25` | latar aplikasi, latar a-scene |
| `--bg-soft` | `#16382f` | gradasi screen |
| `--sage` | `#a8d5ba` | aksen utama: border, ikon, tombol primer |
| `--cream` | `#f4e8c3` | aksen hangat: angka mood, dot aktif, brand-mark |
| `--text` | `#eef5f0` | teks utama |
| `--text-dim` | `#9db8ab` | teks sekunder |
| `--radius` | `20px` | card; tombol `14px`; pill `999px` |

Panel gelap (VR + tombol): `#12241f` dengan `opacity 0.7–0.85` + border `rgba(168,213,186,0.25–0.35)`.
Jangan perkenalkan warna baru tanpa alasan; variasi lewat opacity token yang ada.

## Zonasi layar (KEPUTUSAN OWNER — jangan dilanggar)

- **Atas** = teks/informasi: HUD judul+dots (`top:16px`), subtitle (`top:58px`), tombol ? (`top:18px right:18px`).
- **Kiri bawah** = SEMUA tombol aksi: satu flex row `#scene-nav` (`bottom:22px left:22px`) — prev / next / Lanjut masuk row yang sama agar tidak pernah bertumpuk.
- DILARANG: elemen melayang di tengah pandangan (panel hijau in-VR pernah dihapus owner karena menutupi pemandangan), tombol di luar row nav, UI bertumpuk.

## Pola DOM overlay

- Screen: `<section class="screen">` + toggle class `visible` (transisi opacity 0,5 dtk). Jangan pakai `hidden` untuk screen.
- Card: `.card` (`width: min(440px,100%)`, kaca gelap translucent + `backdrop-filter: blur`); varian `.card-calm` (jeda/selesai), `.card-help` (rata kiri, scroll).
- Tombol: `.btn-primary` (sage, aksi utama satu per screen), `.btn-ghost` (sekunder), `.nav-btn` (pill gelap, hanya di row nav).
- `#ui` punya `pointer-events: none` global — setiap elemen interaktif WAJIB `pointer-events: auto` (sudah ada di `.screen.visible`, `.nav-btn`, `#btn-help-hud`; tiru pola ini untuk elemen baru).
- `#fade` (hitam, 1 dtk) = satu-satunya transisi antar scene; dikendalikan scene-manager, jangan sentuh dari UI.
- Font: `Segoe UI, system-ui` — jangan tambah webfont (offline-only).

## Pola panel dalam-VR (anak `a-camera`, hanya tampil saat vr-mode)

- DOM TIDAK terlihat di headset → setiap info penting harus punya kembaran `a-plane` + `a-text` di dalam scene.
- Posisi (sudah disetujui): jarak `z=-1.5` m; status di `y=0.55`, subtitle di `y=0.36` — zona atas pandangan, tidak menutupi objek interaksi (danau/objek grounding ada di tengah-bawah).
- `a-plane` latar + `a-text` digeser `z+0.01` di depannya; teks `align="center" baseline="center"`, `width` sedikit < lebar plane.
- Toggle visibilitas lewat `visible` attribute + helper `inVR()` dari `src/utils.js` (jangan pakai display/opacity).
- Subtitle VR dikendalikan event `vo:line`/`vo:clear`; status VR diisi `updateHud()` format `Judul · n/7`. Fitur info baru = ikut pola event yang sama.
- Font a-text SUDAH dilokalkan via override default di `main.js` — JANGAN set atribut `font` manual, JANGAN kembalikan ke CDN.
- Teks VR: warna `#f4f0e6`/`#ffffff` di atas plane `#12241f`; jaga kontras, ukuran via `width` (bukan skala sembarangan).

## Jebakan A-Frame yang sudah terbukti (jangan diulang)

- `a-cylinder` TIDAK memetakan `radius-top/bottom` → pakai `a-cone` untuk bentuk meruncing.
- `setAttribute` animasi dengan nilai identik = no-op → pakai pola `startEvents` + `emit()` untuk animasi yang bisa dipicu ulang.
- `look-controls` menimpa rotasi kamera yang di-set via kode → disable dulu saat perlu atur sudut.
- THREE.Raycaster mengenai objek `visible:false` → filter hit; objek interaktif pakai `class="clickable"` agar kena raycaster gaze-dwell.
- Event A-Frame tidak bubble ke sceneEl — pasang listener langsung di entity, atau pakai event `gaze-select` dari komponen gaze-dwell.
- `a-camera` default y=1,6 MENUMPUK rig — selalu tulis eksplisit `position="0 0 0"` di a-camera (rig = 1,2 m, tinggi duduk).
- Verifikasi visual WAJIB di build `dist/` juga, bukan hanya dev server (import dinamis & SW bisa beda perilaku).

## Aksesibilitas (tidak boleh disederhanakan)

- Subtitle DOM: `aria-live="polite"`; selalu sediakan jalan "Tanpa Audio" (TTS tidak andal di Quest).
- Kontras teks ≥ 4,5:1 di atas latar gelap; teks informasi minimal 14px (DOM) / setara terbaca di 1,5 m (VR).
- Setiap aksi yang hanya bisa diakses gaze (dwell 1,5 dtk) WAJIB punya padanan klik DOM (pola `advanceFromUI`).

## Praktik eksternal tervalidasi (riset 2026-08-08 — Meta/MS/Apple/W3C)

Angka resmi yang relevan dengan desain project ini:

- **Ukuran teks**: legible min 0,35–0,4° sudut pandang, nyaman 0,6–0,75° (MS Typography). Pada panel kita @1,5 m → tinggi huruf min ±11 mm, nyaman 16–20 mm. Hindari font weight tipis; jangan italic (Meta); teks 2D, bukan ekstrusi 3D (Apple).
- **Jarak panel**: menu/GUI nyaman ≥ 0,5–1 m (Meta); zona optimal 1,25–5 m, jangan pernah < 0,4 m (MS). Panel kita 1,5 m ✔.
- **Zona pandang**: konten optimal 0–35° DI BAWAH horizon; hindari >10° di atas horizon (MS Comfort). ⚠ KONFLIK: panel status/subtitle kita di +13–20° di atas horizon (keputusan zonasi owner). Jangan ubah sepihak — bahan evaluasi saat uji peserta T6.3 (keluhan leher/mata).
- **Head-locked vs world-locked**: Meta, MS, dan Apple sepakat JANGAN kunci UI 1:1 ke kepala (discomfort, rasa "terjebak"); rekomendasi body-locked/lazy-follow. ⚠ KONFLIK: panel kita anak a-camera = head-locked rigid. W3C immersive-captions: sebagian pengguna justru prefer headlocked untuk caption — idealnya bisa dikustomisasi. Bahan evaluasi T6.3, perubahan perlu acc owner.
- **Caption (Meta accessibility)**: maks 32 karakter/baris, maks 2 baris, WAJIB background box (kita ✔), jeda antar kalimat min 1–1,5 dtk, roll-up 0,5 dtk, opsi ukuran teks.
- **Gaze dwell**: MS merekomendasikan feedback mulai 150–250 ms + aktivasi ±650–850 ms (total ±0,8–1,1 dtk); fuse kita 1,5 dtk — lebih lambat, AMAN untuk populasi rentan (anti aktivasi tak sengaja), pertahankan. Target gaze min 2° sudut visual (≈3,5 cm @ 1 m). Hindari tata letak yang memaksa menengok atas-bawah berulang ("yo-yo effect").
- **Flicker**: jangan ada kedipan > 3×/detik (W3C XAUR) — animasi pulse/ripple wajib pelan.
- **Frame rate**: syarat store Meta ≥ 60 fps berkelanjutan; budget draw call A-Frame < 300 (kita 47 ✔).
- **Golden rule kamera**: jangan pernah mengambil alih kamera dari pengguna (A-Frame/MS) — kamera kita statis 1,2 m ✔.
- **Teks A-Frame tidak bisa di-raycast** — tombol/teks interaktif WAJIB punya plane sebagai hit area.
- **DOM overlay**: spesifikasi W3C WebXR DOM Overlays ada (tipe `floating` untuk VR), tapi di Quest Browser terutama berguna untuk AR — pola panel 3D kita tetap pilihan umum yang benar.
- Tidak ada angka resmi untuk: curved vs flat panel, rasio kontras khusus VR (Meta merujuk WCAG 4,5:1), durasi sesi maksimal — jangan mengarang; prinsip W3C: sediakan jalan keluar cepat (safety-exit kita ✔).

Sumber: developers.meta.com/horizon/design/*, learn.microsoft.com/windows/mixed-reality/design/*, Apple HIG (Spatial Layout/Typography/Eyes), w3.org/TR/xaur/, w3c.github.io/immersive-captions/, aframe.io/docs/1.6.0.

## Workflow mengubah UI

1. Ubah CSS di `src/style.css` (DOM) atau atribut panel di `index.html` (VR) — ikuti token & zonasi di atas.
2. `npm run build`, sajikan `dist/`, verifikasi screenshot via headless CDP (`scripts/cdp.mjs` — lihat SESSION.md untuk pola).
3. Cek 0 error console + screenshot zona yang berubah. UI DOM diverifikasi desktop; panel VR diverifikasi dengan stub vr-mode.
4. Bila mengubah zonasi/warna yang disetujui owner → konfirmasi dulu, jangan asal ubah.
