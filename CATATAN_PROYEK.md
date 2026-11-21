# Catatan Proyek — PFA-VR (Phase 3)

> Dokumentasi lengkap proyek dalam bahasa yang mudah dipahami: apa, kenapa,
> teknologi, infrastruktur, alur pakai, arsitektur kode, dan status.
> Sumber kebenaran isi: `NASKAH_VR.md` → `AGENTS.md` → `SESSION.md`.
> Diperbarui: 2026-08-21 (setelah hand tracking presisi, VO rekaman, navbar sentuh).

---

## Daftar Isi

1. [Ringkasan sekali baca](#1-ringkasan-sekali-baca)
2. [Project ini apa & untuk siapa](#2-project-ini-apa--untuk-siapa)
3. [Perangkat yang didukung](#3-perangkat-yang-didukung)
4. [Teknologi yang dipakai](#4-teknologi-yang-dipakai)
5. [Infrastruktur](#5-infrastruktur)
6. [Struktur folder & peran file](#6-struktur-folder--peran-file)
   - [6a. Peta lokasi aset](#6a-peta-lokasi-aset-di-mana-file-apa)
   - [6b. Peta komponen A-Frame](#6b-peta-komponen-a-frame-di-mana-perilaku-apa)
7. [Arsitektur & alur data](#7-arsitektur--alur-data)
8. [Flowchart alur aplikasi](#8-flowchart-alur-aplikasi)
9. [Tujuh scene terapi](#9-tujuh-scene-terapi)
10. [Cara berinteraksi (3 jalur input)](#10-cara-berinteraksi-3-jalur-input)
11. [Workflow penggunaan (operator & peserta)](#11-workflow-penggunaan-operator--peserta)
12. [Workflow pengembangan (developer)](#12-workflow-pengembangan-developer)
13. [Invariant penting (jangan dilanggar)](#13-invariant-penting-jangan-dilanggar)
14. [Fitur: sudah jalan vs belum](#14-fitur-sudah-jalan-vs-belum)
15. [Progres & yang menahan rilis](#15-progres--yang-menahan-rilis)

---

## 1. Ringkasan sekali baca

> Aplikasi **web VR** untuk **Pertolongan Pertama Psikologis (PFA)** korban
> bencana, berbahasa Indonesia. Peserta memakai headset, "duduk" di halaman
> rumah pedesaan 360° yang tenang, dan dibimbing suara pemandu melalui **7 sesi**
> menenangkan (orientasi, napas, grounding, kontrol diri, dukungan sosial,
> harapan, penutup). Jalan di **browser desktop & Meta Quest**, **offline penuh**
> (PWA), **tanpa backend/telemetri** (privasi korban terjaga). Teknologi:
> JavaScript + A-Frame/WebXR + Vite + PWA. Fungsional sudah lengkap; yang menahan
> rilis final adalah review psikolog & uji peserta sungguhan (butuh manusia).

---

## 2. Project ini apa & untuk siapa

**PFA-VR** = **P**sychological **F**irst **A**id berbasis **V**irtual **R**eality.

Bayangkan: seorang korban bencana memakai headset VR, lalu berada di halaman
rumah pedesaan yang damai. Suara pemandu menuntunnya lewat latihan-latihan
psikologis singkat yang menenangkan — tanpa perlu tenaga ahli berada di ruangan
yang sama.

- **Tujuan:** membantu pemulihan psikologis korban bencana (konteks contoh:
  erupsi) lewat sesi terpandu PFA yang aman dan menenangkan.
- **Standar klinis:** mengikuti kerangka PFA resmi — tiap scene memetakan satu
  tahap (Contact & Engagement, Safety & Comfort, Emotional Stabilization,
  Practical Assistance, Connection with Social Support, Coping Information,
  Linkage & Follow-up).
- **Khalayak:** korban bencana / peserta umum, didampingi operator, pendamping,
  atau tenaga kesehatan.
- **Prinsip privasi:** semua berjalan lokal; **tidak ada data yang dikirim ke
  server mana pun**. Data mood hanya tersimpan di perangkat.

---

## 3. Perangkat yang didukung

| Perangkat | Cara pakai | Catatan |
|---|---|---|
| **Meta Quest 3S** (target utama) | Browser VR bawaan Quest | Hand tracking, gaze, controller. Wajib HTTPS/secure context. |
| Headset WebXR lain (Quest 2/3/Pro) | Browser VR | Belum diuji, tapi arsitektur WebXR standar — seharusnya jalan. |
| **Desktop** (Windows/Mac/Linux) | Chrome/Edge/Firefox | Untuk dev & demo; navigasi mouse + WASD, gaze via cursor. |

Kenapa "web", bukan aplikasi install: mudah disebar (cukup buka URL), lintas
perangkat, tanpa proses instalasi di lapangan darurat, dan setelah dimuat sekali
bisa jalan offline penuh (PWA).

---

## 4. Teknologi yang dipakai

| Lapisan | Teknologi | Untuk apa |
|---|---|---|
| Bahasa | **JavaScript (Vanilla, ES module)** | Semua logika; tanpa framework UI, tanpa TypeScript |
| Layar 2D | **HTML + CSS** | Onboarding, jeda, selesai, bantuan (overlay DOM) |
| Dunia 3D / VR | **A-Frame 1.8** (WebXR di atas THREE.js) | Scene 3D, kamera, gaze, controller, hand tracking |
| Build & dev server | **Vite 5** | Dev server HTTPS + build produksi |
| Offline | **vite-plugin-pwa** (Workbox) | Precache semua aset → jalan tanpa internet |
| Suara pemandu (VO) | **Rekaman edge-tts (id-ID)** + fallback Web Speech | File mp3 lokal; berbunyi di Quest |
| Model 3D | **GLB + Draco compression** | Papan penutup S7 (furnitur lain = primitif A-Frame) |
| HTTPS dev | **@vitejs/plugin-basic-ssl** (v1.x, kompatibel Vite 5) | Secure context untuk WebXR via LAN |

**Catatan penting soal suara:** sebelumnya VO memakai Web Speech API browser,
tapi **Meta Quest Browser tidak punya Web Speech API** → suara bisu di headset.
Sejak 2026-08-21 VO memakai **file mp3 rekaman** (dibuat edge-tts, suara
Indonesia GadisNeural/ArdiNeural) yang berbunyi di perangkat apa pun dan ikut
di-cache offline. Web Speech tetap ada sebagai fallback desktop.

---

## 5. Infrastruktur

- **Satu aplikasi web** (`pfa-vr-web/`) — **tidak ada backend sama sekali**.
- **Semua aset lokal** di `public/` (model, audio ambience, VO, font, decoder
  Draco) → aplikasi jalan **100% offline** setelah dimuat pertama kali (PWA).
- **Dev:** `npm run dev -- --port 7100` → server **HTTPS** (sertifikat
  self-signed; warning browser itu normal) agar VR di Quest bisa diuji via LAN.
- **Build:** `npm run build` → hasil di `pfa-vr-web/dist/`.
- **Deploy:** owner mengunggah isi `dist/` **manual** ke Vercel (bukan via Git,
  bukan CLI). URL live: **https://pfa-vr.vercel.app**.
- **Pengujian:** headless via CDP (`scripts/cdp.mjs`, screenshot & cek error) +
  panel diagnostik in-VR (`?diag`) + verifikasi akhir wajib di headset Quest.

Kenapa HTTPS wajib: WebXR butuh *secure context*. `http://<IP-LAN>` membuka
halaman tapi tombol Enter VR mati di Quest — hanya `localhost` & `https://`
yang dikecualikan.

---

## 6. Struktur folder & peran file

```
VR-Phase3/
├── NASKAH_VR.md            # Naskah terapi 7 scene (SUMBER KEBENARAN isi)
├── AGENTS.md               # Aturan kerja, invariant, keputusan owner, cacat
├── SESSION.md              # Log posisi kerja per sesi
├── CATATAN_PROYEK.md       # Dokumen ini (penjelasan lengkap)
├── README.md               # Gambaran umum + cara menjalankan
├── Todolist.md             # Permintaan owner terbaru
└── pfa-vr-web/             # APLIKASI (Vite + A-Frame + PWA)
    ├── index.html          # Kerangka halaman + scene A-Frame + entity VR
    │   ├── vite.config.js      # Build + PWA (Workbox) + HTTPS dev + relay sesi (/__relay)
    ├── scripts/
    │   ├── cdp.mjs         # Driver CDP verifikasi headless (dev tool)
    │   ├── gen-vo.mjs      # Generator VO mp3 dari script-data.js (edge-tts)
    │   └── download-tja.mjs# Unduh GLB dari threejsassets (dev tool)
    ├── src/
    │   ├── main.js         # "Pintu masuk": boot, wiring UI 2D, navbar in-VR, eksekusi perintah kontrol
    │   ├── session-state.js# State sesi pusat + log + koneksi relay WS (lintas-perangkat)
    │   ├── control.js      # Halaman kontrol sesi (?role=control, di laptop)
    │   ├── diag.js         # Panel diagnostik in-VR (opt-in ?diag)
    │   ├── selfcheck.js    # Assert ringan saat boot
    │   ├── utils.js        # Helper el() + inVR()
    │   ├── dev-log.js      # Logging tag [PFA] (matikan via ?nolog)
    │   ├── scenes/
    │   │   ├── script-data.js   # SATU-SATUNYA tempat narasi, cue & timing
    │   │   ├── vo-manifest.json # Penanda baris VO mana yang punya file mp3
    │   │   ├── scene-manager.js # Urutan S1→S7, fade, navigasi, HUD
    │   │   └── s1.js … s7.js    # Isi visual & animasi tiap scene
    │   ├── environment/
    │   │   └── environment.js   # Dunia 360° (rumah, danau, pohon, marker, dll.)
    │   └── components/
    │       ├── raw-hands.js     # Hand tracking presisi (fillPoses) + sentuh
    │       ├── gaze-dwell.js    # Cursor fuse 1,5 dtk → gaze-select
    │       ├── gaze-highlight.js# Glow objek grounding S3
    │       ├── breathing-orb.js # Bola napas S2
    │       ├── audio-player.js  # VO (mp3/Web Speech) + ambience per scene
    │       ├── safety-exit.js   # Menunduk 3 dtk / Esc → panel jeda
    │       └── sunrise.js       # Matahari terbit S6
    └── public/
        ├── models/         # Model GLB lokal (rumah, pohon, danau, dll.)
        ├── audio/          # 7 ambience/musik per scene
        ├── audio/vo/f, /m  # VO rekaman: perempuan (f) & laki-laki (m), 50 baris
        ├── fonts/          # Font a-text lokal (offline)
        └── draco/          # Decoder GLB terkompresi
```

**Aturan emas file:** narasi, urutan kalimat, cue animasi, dan jeda **hanya**
diedit di `src/scenes/script-data.js`. Kalau narasi berubah, jalankan ulang
`node scripts/gen-vo.mjs` untuk membuat ulang file VO.

---

## 6a. Peta lokasi aset (di mana file apa)

Semua path relatif ke `pfa-vr-web/`. Semua aset **lokal** (tidak ada CDN) agar
offline aman.

| Aset | Lokasi | Isi / catatan |
|---|---|---|
| **Suara pemandu (VO)** — perempuan | `public/audio/vo/f/` | 50 file `s1-0.mp3 … s7-6.mp3` (edge-tts GadisNeural) |
| **Suara pemandu (VO)** — laki-laki | `public/audio/vo/m/` | 50 file `s1-0.mp3 … s7-6.mp3` (edge-tts ArdiNeural) |
| **Penanda VO** (baris mana punya file) | `src/scenes/vo-manifest.json` | Dibaca `audio-player.js` |
| **Musik / ambient per scene** | `public/audio/` | `s1-ambient.wav`, `s2-music-medium.mp3`, `s3-ambient.wav`, `s4-music-soft.mp3`, `s5-ambient-tranquil.mp3`, `s6-music-soft.mp3`, `s7-music-drone.wav` |
| **Model 3D (GLB)** | `public/models/` | 11 file: `home-cottage-01`, `lineside-pine`, `tree-oak-01`, `water-pond-01`, `grass-tuft-scatter`, `terrain-dirt-path-01`, `railway-boulder`, `sandstone-boulder`, `cloud-puff-01`, `farm-gate-sign`, `bench-01` (`.glb`) |
| **Decoder GLB (Draco)** | `public/draco/` | `draco_decoder.js/.wasm`, `draco_wasm_wrapper.js` |
| **Font teks VR** | `public/fonts/` | `Roboto-msdf.json` + `Roboto-msdf.png` (atlas MSDF a-text) |
| **Ikon PWA** | `public/icon.svg` | Ikon aplikasi |
| **Foto langit 360°** | `public/sky/` | *(belum ada — rencana realisme, lihat plan)* |
| **Narasi + cue + timing** | `src/scenes/script-data.js` | SATU sumber teks & urutan |
| **Generator VO** | `scripts/gen-vo.mjs` | Membuat `public/audio/vo/**` dari script-data |
| **Hasil build** | `dist/` | Output `npm run build` (untuk deploy) |

**Pemetaan VO ↔ scene:** nama file `s<scene>-<index>.mp3` mengikuti indeks baris
di `script-data.js`. Contoh: baris pertama Scene 1 = `s1-0.mp3`; baris ketiga
Scene 3 = `s3-2.mp3`. Gender folder (`f`/`m`) dipilih dari pilihan suara di
onboarding.

**Peta ambient ↔ scene** ditetapkan di field `ambience` tiap scene di
`script-data.js` (mis. `ambience: '/audio/s1-ambient.wav'`).

## 6b. Peta komponen A-Frame (di mana perilaku apa)

Semua di `src/components/`:

| Perilaku | File | Dipakai di |
|---|---|---|
| Hand tracking presisi + sentuh navbar | `raw-hands.js` | Semua scene (VR) |
| Gaze-dwell 1,5 dtk → pilih | `gaze-dwell.js` | Semua target `.clickable` |
| Glow objek grounding | `gaze-highlight.js` | Scene 3 |
| Bola napas mengembang/mengempis | `breathing-orb.js` | Scene 2 |
| VO (mp3/Web Speech) + ambient | `audio-player.js` | Semua scene |
| Safety exit (tunduk 3 dtk / Esc) | `safety-exit.js` | Semua scene |
| Matahari terbit | `sunrise.js` | Scene 6 |

Dunia 360° berupa **ruang tamu indoor** (lantai, dinding, jendela + tirai, sofa, meja,
karpet, tanaman, regal/TV, pintu, foto keluarga) + per-scene groups (4 kartu simbol S4,
siluet S5, bunga S6, papan S7, penanda `#mk-*`) dibangun di `src/environment/environment.js`.


---

## 7. Arsitektur & alur data

**Prinsip inti:** satu dunia 360° dipakai untuk semua scene. Tiap scene hanya
menampilkan/menyembunyikan objek & memicu animasi tertentu — bukan membangun
ulang dunia.

```
script-data.js  (narasi + cue + timing + ambience, 1 sumber)
      │
      ▼
scene-manager.js ── goTo(i) ──► fade ► cleanup ► build scene ► ambience ► runVo
      │                                              │              │
      │                                              ▼              ▼
      │                                        s1..s7.js       audio-player.js
      │                                     (visual & cue)    (VO mp3 / Web Speech)
      ▼                                              │              │
  environment.js  ◄── show/hide grup objek ──────────┘              ▼
  (dunia 360° dibangun sekali)                                 vo:line / vo:clear
                                                                     │
                                                                     ▼
                                                        subtitle DOM + panel in-VR
```

- **`environment.js`** membangun dunia sekali (`buildEnvironment`) dan menyimpan
  referensi objek di `env.*` (mis. `env.silhouetteGroup`, `env.symbols`,
  `env.grounding`). Semua grup scene-spesifik dibuat `visible: false`.
- **`scene-manager.js`** mengatur siklus hidup: `goTo(i)` melakukan fade hitam →
  `cleanup()` (stop audio + panggil `destroy()` scene lama + kosongkan
  `#scene-root`) → muat modul scene via `import.meta.glob` → `build()` → mulai
  ambience → `runVo()`. Ada guard `transitioning` supaya tap ganda tak membuat
  dua scene aktif bersamaan.
- **Tiap `sX.js`** meng-*export* `build()`, opsional `onCue(cue)` dan
  `destroy()`. `onCue` dipicu per baris VO (dari field `cue` di script-data)
  untuk memunculkan objek berurutan; `destroy()` menyembunyikan grup scene agar
  **tidak bocor** ke scene berikutnya.
- **`audio-player.js`** memutar VO: file mp3 rekaman sesuai gender bila ada
  (`vo-manifest.json`) → fallback Web Speech (desktop) → fallback subtitle +
  tempo baca. Tiap baris memancarkan event `vo:line` yang ditangkap subtitle DOM
  dan panel subtitle in-VR.

---

## 8. Flowchart alur aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                      MULAI (buka URL)                        │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
                    ┌───────────────┐
                    │  ONBOARDING   │  pilih suara pemandu (♀/♂),
                    │   (layar 2D)  │  isi mood "sebelum" (1–10)
                    └───────┬───────┘
                 ┌──────────┴──────────┐
                 ▼                     ▼
          [Mulai Sesi]        [Mulai Tanpa Audio]
                 └──────────┬──────────┘
                            ▼  (opsional: Enter VR di headset)
        ┌───────────────────────────────────────────┐
        │           SCENE 1 → 2 → 3 → … → 7          │
        │  tiap scene:                               │
        │   • narasi VO + subtitle                   │
        │   • objek muncul mengikuti cue             │
        │   • setelah narasi → tombol "Lanjut"       │
        │  navigasi bebas: Sebelumnya/Selanjutnya/   │
        │  lompat ke nomor scene (navbar in-VR kiri) │
        └───────────────────┬───────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼ (kapan saja)               ▼ (selesai S7)
      ┌───────────────┐            ┌────────────────┐
      │  SAFETY EXIT  │            │    SELESAI     │
      │ tunduk 3 dtk  │            │ isi mood "sesudah"│
      │  atau Esc     │            │ simpan + unduh   │
      │ → panel jeda  │            │ JSON, pesan      │
      │  (Lanjutkan/  │            │ penutup & rujukan│
      │   Akhiri)     │            └────────────────┘
      └───────────────┘
```

---

## 9. Tujuh scene terapi

| # | Judul | Tahap PFA | Inti interaksi |
|---|---|---|---|
| S1 | Orientasi dan Rasa Aman | Contact & Engagement | Melihat ruang tamu yang aman (jendela, sofa, tanaman) |
| S2 | Latihan Pernapasan | Safety & Comfort | Bola napas mengembang/mengempis, 5 siklus + riak lembut di lantai |
| S3 | Grounding 5-4-3-2-1 | Emotional Stabilization | 5 objek (sofa/jendela/tanaman/karpet/meja) bersinar saat dipandang |
| S4 | Membangun Kemampuan Kontrol Diri | Practical Assistance | 4 kartu simbol muncul (air, rumah, keluarga, komunitas) |
| S5 | Dukungan Sosial | Connection w/ Social Support | 4 siluet bercahaya di sudut ruang tamu (keluarga, tetangga, relawan, nakes) |
| S6 | Harapan dan Resiliensi | Coping Information | Cahaya pagi masuk jendela + bunga bermekaran |
| S7 | Penutup dan Reorientasi | Linkage & Follow-up | Papan pesan: "Anda Aman / Tidak Sendiri / Bantuan Tersedia" |

Scene berpindah **otomatis** setelah narasi selesai + jeda 1,5 detik (auto-lanjut ON, keputusan owner 2026-08-31). Dari halaman kontrol (`?role=control` di laptop) auto-lanjut bisa dimatikan — perilaku lama kembali: muncul tombol "Lanjut" yang peserta tekan saat siap.

### 9a. Halaman kontrol sesi (laptop → Quest)

Saat sesi dijalankan lewat server dev laptop (`npm run dev`), buka `https://localhost:7100/?role=control` di laptop untuk memantau & mengendalikan sesi yang berjalan di Quest:

- **Status sesi** (berjalan/menunggu) dan **scene aktif** (nama + nomor).
- **Tombol**: Hentikan Sesi, Sebelumnya, Selanjutnya, toggle Auto-lanjut, lompat ke scene 1–7.
- **Log realtime** semua event sesi (pindah scene, VO selesai, perintah).
- Komunikasi via relay WebSocket lokal `/__relay` (menempel di server dev, plugin `sessionRelay()` di `vite.config.js`, devDep `ws`).
- **Batasan**: hanya jalan saat server dev laptop hidup & laptop satu Wi-Fi dengan Quest; di deploy Vercel statis relay tidak ada, sehingga halaman kontrol tidak berfungsi di sana.
- State sesi pusat: `src/session-state.js`; UI kontrol: `src/control.js`; perintah dieksekusi di akhir `main.js`.

---

## 10. Cara berinteraksi (3 jalur input, paralel)

Semua target interaktif memakai kelas `.clickable` (dan `.touchable` untuk
navbar). Ketiga jalur bekerja bersamaan lewat target yang sama:

1. **Gaze-dwell** — pandangi objek/tombol **1,5 detik** → otomatis terpilih.
   Fallback universal: desktop, hand tracking mati, aksesibilitas motorik.
2. **Controller Quest** — laser dari controller kiri/kanan, tarik pemicu.
3. **Hand tracking (sentuh)** — tangan tergambar presisi via `raw-hands`;
   **sentuh** tombol navbar dengan ujung jari mana pun → tombol berubah warna →
   aksi terpanggil (interaksi ala webxr-samples immersive-hands).

**Kenapa hand tracking presisi (2026-08-21):** komponen bawaan A-Frame
`hand-tracking-controls` menggambar sendi sebagai anak `camera-rig`, sehingga
visual tangan tergeser ~1,2 m ke atas. Solusi: komponen `raw-hands` menggambar
25 sendi × 2 tangan **mentah di scene root** via
`frame.fillPoses(inputSource.hand, refSpace renderer)` — reference space yang
sama dengan kamera, tanpa offset parent — persis teknik webxr-samples, sehingga
tangan virtual = tangan asli.

---

## 11. Workflow penggunaan (operator & peserta)

1. **Persiapan (operator):** buka URL di headset (via LAN HTTPS atau Vercel);
   lewati peringatan sertifikat (Advanced → Proceed) bila memakai dev server.
2. **Onboarding (sebelum headset dipasang lebih nyaman):** pilih suara pemandu
   (♀/♂), isi skala perasaan "sebelum" (1–10).
3. **Mulai:** tekan **Mulai Sesi** (dengan suara) atau **Mulai Tanpa Audio**
   (subtitle saja), lalu **Enter VR** di headset.
4. **Selama sesi:** peserta duduk tenang, ikuti pemandu; pindah scene saat siap
   lewat tombol Lanjut atau navbar kiri (Sebelumnya/Selanjutnya/nomor 1–7).
5. **Berhenti darurat kapan saja:** menunduk 3 detik atau tekan `Esc` →
   panel "Sesi dihentikan" muncul (juga di dalam VR) → Lanjutkan / Akhiri.
6. **Selesai (S7):** isi skala "sesudah" (1–10); riwayat mood tersimpan lokal &
   bisa diunduh JSON; muncul pesan penutup + info bantuan lanjutan.

---

## 12. Workflow pengembangan (developer)

```bash
cd pfa-vr-web
npm install                 # sekali; termasuk @vitejs/plugin-basic-ssl
npm run dev -- --port 7100  # dev server HTTPS (uji Quest via LAN)
npm run build               # produksi → dist/
npm run preview             # sajikan dist/ (uji offline PWA)
```

- **Uji di Quest:** buka `https://<IP-LAN>:7100` (mis. `https://192.168.100.3:7100`).
  Tambahkan `?diag` untuk panel diagnostik in-VR (eye.y, posisi navbar, gaze).
- **Verifikasi headless:** `node scripts/cdp.mjs <nav|eval|offline|shot>` (butuh
  Chrome remote debugging port 9222).
- **Regenerasi VO** setelah mengubah narasi: `node scripts/gen-vo.mjs`.
- **Wajib** `npm run build` setelah perubahan runtime/aset. Tidak ada
  lint/test/typecheck di project ini — jangan mengklaimnya dijalankan.

---

## 13. Invariant penting (jangan dilanggar)

Detail lengkap ada di `AGENTS.md`; ringkasnya:

1. **`#camera-rig` WAJIB di lantai (`0 0 0`)**; tinggi mata (1,2 m) dipasang di
   `a-camera`. Melanggar ini bikin POV terlalu tinggi + navbar tak terjangkau +
   tangan meleset — bertiga sekaligus.
2. **`webxr` WAJIB `referenceSpaceType: local-floor`** (dunia floor-anchored).
   `local` merusak POV/tangan/navbar.
3. **Narasi/cue/timing hanya di `script-data.js`.** Regenerasi VO setelahnya.
4. **Gaze-dwell wajib tetap ada** sebagai fallback universal — hand tracking
   hanya lapisan tambahan, bukan pengganti.
5. **Info penting di VR wajib punya panel A-Frame** (a-plane + a-text), bukan
   DOM saja — DOM tak terlihat di headset (mis. panel jeda, subtitle, status).
6. **Jangan akses Web Speech API tanpa penjaga** (`'speechSynthesis' in window`)
   di top-level modul boot — Quest tak punya API itu; boot akan mati total.
7. **Bahasa Indonesia, lokal-only, tanpa backend/telemetri.**

---

## 14. Fitur: sudah jalan vs belum

### ✅ Sudah jalan
- 7 scene terpandu lengkap + narasi Indonesia.
- **VO rekaman** (edge-tts ♀/♂) berbunyi di Quest; prosodi menenangkan.
- Dunia 360° detail (ruang tamu indoor: lantai kayu, dinding, jendela + tirai, sofa,
  meja, karpet, tanaman, regal/TV, pintu, foto keluarga).
- **Hand tracking presisi** (raw-hands) + navbar in-VR yang bisa **disentuh**.
- 3 jalur input paralel (gaze, controller, tangan).
- Navbar in-VR di sisi kiri, tata letak kolom, tombol "Sebelumnya" tersembunyi
  di Scene 1.
- Panel jeda, subtitle, & status **di dalam VR**.
- Mode Mulai Tanpa Audio + subtitle tempo baca.
- Mood check sebelum/sesudah, tersimpan lokal, unduh JSON.
- Safety exit (tunduk 3 dtk / Esc) dengan panel in-VR.
- Offline penuh (PWA); jalan di desktop & Quest 3S.

### ⚠️ Belum / catatan
- **Scene 2 belum pakai VO rekaman** — alur napasnya kustom (`s2.js` memanggil
  `audio.speak()` tanpa key baris), jadi S2 masih jalur lama. 6 scene lain sudah.
- Angka posisi/ukuran navbar & ambang sentuh masih perlu penyetelan halus di
  Quest.
- Permintaan owner (`Todolist.md`) yang belum: tekstur rumput/gunung/sungai/
  tanah, penempatan ulang gunung, ilusi hutan di endbox, putar gazebo,
  visualisasi keluarga S4 (videotron), UI bernuansa desa.

  (Catatan 2026-08-30: environment kini **ruang tamu indoor** — item Todolist
  yang berkaitan outdoor (tekstur rumput/gunung/sungai/tanah, penempatan ulang
  gunung, ilusi hutan di endbox, putar gazebo) menjadi tidak relevan selama
  env indoor dipakai. Yang masih relevan: visualisasi keluarga S4 (videotron)
  dan UI bernuansa desa.)

---

## 15. Progres & yang menahan rilis

| Fase | Isi | Status |
|---|---|---|
| Fase 0–1 | Kerangka app, 7 scene dasar, gaze, safety-exit, audio, UI | ✅ Selesai |
| Fase 2–3 | Dunia 360° detail + scene interaktif penuh | ✅ Selesai |
| Fase 4 | Gate review owner (T4.2) + perbaikan visual | ✅ Lolos |
| Fase 5 | Aset GLB, ambience/musik, subtitle & status in-VR | ✅ Selesai |
| Fase 6 | Offline penuh ✅, SOP draft ✅, **hand tracking + VO rekaman + navbar sentuh ✅ (2026-08-21)** · review psikolog, uji peserta, serah terima ⏳ | 🔶 Berjalan |

**Posisi terakhir (2026-08-21):** aplikasi fungsional penuh, diuji berulang di
Quest 3S oleh owner. Hand tracking kini presisi, suara pemandu berbunyi di
headset, navbar bisa disentuh. **Yang menahan rilis final:** review psikolog dan
uji peserta sungguhan — keduanya butuh manusia, tidak bisa dikerjakan agent.

