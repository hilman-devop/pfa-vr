# AGENTS.md - VR-Phase3 (PFA-VR)

## Sumber kebenaran

- Baca entri log terbaru di `SESSION.md` sebelum bekerja; permintaan owner terbaru ada di `Todolist.md`.
- Jika dokumen bertentangan: `NASKAH_VR.md` (isi naskah) -> `AGENTS.md` (aturan & invariant) -> `SESSION.md` (posisi kerja).
- Jangan mengerjakan item yang menunggu owner, psikolog, peserta, atau Quest tanpa persetujuan manusia tersebut.

## Struktur dan invariants

- App tunggal: `pfa-vr-web/`, Vite vanilla JS, A-Frame 1.8, PWA `vite-plugin-pwa`.
- Boot/UI DOM ada di `src/main.js`; lifecycle scene ada di `src/scenes/scene-manager.js`; environment bersama ada di `src/environment/environment.js`.
- Narasi, cue, ambience, dan timing hanya ada di `src/scenes/script-data.js`.
- Runtime assets harus lokal di `public/models`, `public/audio`, `public/fonts`, `public/draco`.
- Bahasa Indonesia, lokal-only tanpa backend/telemetri, gaze dwell 1,5 detik, dan `safety-exit` wajib dipertahankan.
- **`#camera-rig` WAJIB di lantai (`position="0 0 0"`); tinggi mata dipasang di `a-camera`, bukan di rig.** Ini menyebabkan tiga bug sekaligus saat dilanggar, dan owner sudah pernah mengalaminya di Quest 3S (2026-08-19: "POV terlalu tinggi", "nav bar terlalu rendah dan jauh", "tracking tangan tidak pas").
  - Mekanismenya: `look-controls.onEnterVR` menjalankan `object3D.position.set(0,0,0)` pada KAMERA, lalu three.js mengisinya dari pose headset yang **relatif lantai** (`referenceSpaceType` default `local-floor`), dan memulihkannya saat `exit-vr`. Offset di **rig tidak pernah dinolkan**. Jadi menaruh 1,2 m di rig membuat tinggi menumpuk: 1,2 + tinggi kepala asli (~1,6) = POV ~2,8 m.
  - Efek berantai: `hand-tracking-controls` menol-kan transform entity tangannya sendiri tiap tick lalu menerapkan matriks joint **langsung dari reference space lantai** (`frame.fillPoses`). Karena itu satu-satunya offset yang tersisa di rantai parent adalah rig — dengan rig di 1,2 m, SEMUA joint tangan tergambar 1,2 m terlalu tinggi sehingga terasa "tidak pas dan tidak realtime". `laser-controls` dan nav bar body-locked kena hal yang sama.
  - Cara cek cepat: entity tangan harus berada di world `(0,0,0)` saat idle. Kalau bukan, ada offset di rantai parent dan hand tracking pasti salah posisi.
  - Jangan "perbaiki" dengan menambah offset lawan (mis. `y -= 1.2`) di komponen tangan — itu pola yang sudah dibuang A-Frame di PR #5298 (dulu ada offset 1,5 m hardcode, issue #5034). Betulkan hierarkinya.
  - **`webxr` di `a-scene` WAJIB `referenceSpaceType: local-floor`** (ini default A-Frame; jangan diubah ke `local`). `local` memindah origin ke posisi kepala saat session start — cocok untuk webxr-samples `immersive-hands.html` yang dunianya head-referenced, tapi dunia PFA-VR floor-anchored (tanah di y=0, tinggi mata duduk di `a-camera`). Terbukti 2026-08-20: dengan `local`, (1) mata jatuh di y=0 = sejajar lantai → POV berubah, (2) pose tangan ikut space yang tidak selaras lantai → terasa tidak sepadan & "geser jauh saat gerak sedikit", (3) `positionVrNav()` membaca `eye.y ≈ 0` → nav bar ke y −0,38 = tenggelam ke bawah tanah → tak terlihat & tak bisa diklik. Sekali revert ke `local-floor`, ketiganya beres karena `hand-tracking-controls` A-Frame sudah menerapkan `fillPoses/fillJointRadii` ke reference space yang sama dengan viewer tanpa offset parent — teknik yang sama persis dengan sample immersive-hands.
- **Nav bar in-VR tingginya dihitung runtime dari tinggi mata sebenarnya**, lewat `positionVrNav()` di `main.js` (`y = tinggi mata − 0,38`), dipanggil saat boot dan 600 ms setelah `enter-vr` karena pose headset butuh beberapa frame untuk stabil. Jangan ganti dengan angka y tetap — tinggi peserta berbeda-beda dan rig ada di lantai. Hasilnya baris aksi ±19° dan baris lompat ±26° di bawah horizon: di dalam zona nyaman MS (0–35° di bawah) dan jauh di atas ambang `safety-exit` (−60°). Jarak tombol `z=-1.1` (sebelumnya −1,5 terasa terlalu jauh bagi owner).
- **Hand tracking adalah LAPISAN TAMBAHAN, bukan pengganti.** `gaze-dwell` (fuse 1,5 dtk) WAJIB tetap ada sebagai fallback universal: desktop tanpa headset, Quest tanpa hand tracking aktif, ruangan gelap atau tangan di luar FOV kamera, dan aksesibilitas bagi peserta dengan keterbatasan motorik tangan. Jangan pernah menghapus atau melonggarkan gaze-dwell saat menyentuh hand tracking. Ketiga jalur input (gaze, controller, tangan) berjalan paralel lewat target `.clickable` yang sama, jadi jangan bikin cabang khusus per input.
- **Hand tracking: pakai komponen `raw-hands` (`src/components/raw-hands.js`), BUKAN `hand-tracking-controls` bawaan A-Frame untuk visual.** Terbukti di Quest 3S (2026-08-21): `hand-tracking-controls` menggambar sendi sebagai anak `camera-rig` → visual tangan tergeser ~1,2 m ke atas (tangan "terlalu tinggi"), walau data posisinya benar. `raw-hands` menggambar 25 sendi × 2 tangan MENTAH di scene root via `frame.fillPoses(inputSource.hand, renderer.xr.getReferenceSpace())` — reference space yang sama dengan kamera, tanpa offset parent — persis teknik webxr-samples immersive-hands. Fitur WebXR `hand-tracking` didaftarkan di atribut `webxr` `<a-scene>` (`optionalFeatures: hand-tracking`) supaya Quest mengekspos `inputSource.hand` tanpa komponen bawaan. JANGAN pasang lagi `hand-tracking-controls` untuk visual — akan muncul tangan ganda (yang lama tetap tergambar via object3D-nya sendiri meski entity `visible=false`).
  - Sentuh navbar: `raw-hands` menguji jarak SEMUA ujung jari (5 tip × 2 tangan) ke tiap `.touchable`; masuk < 4,5 cm → `__touch.onSelect()` + tombol berubah warna (histeresis keluar 7 cm). Ini interaksi "sentuh" ala sample, bukan pinch/laser dari jauh.
- **Locomotion DIMATIKAN (2026-08-30):** pengguna DUDUK di sofa dan TIDAK boleh berpindah posisi (keputusan owner). `a-camera` diberi `wasd-controls="enabled: false"` — **wajib eksplisit**, karena primitive `<a-camera>` A-Frame memasang `wasd-controls` default; menghapus atribut saja tidak cukup (komponen tetap aktif dari `defaultComponents`). Tinggi mata duduk 1,2 m tetap dipasang di `a-camera` (rig di lantai). Kembali selaras dengan aturan "kamera 100% statis" di `NASKAH_VR.md`. Kepala tetap bebas menoleh (look-controls).
- Perubahan UI wajib mengikuti `.agents/skills/pfa-vr-ui-design/SKILL.md`; info penting dalam headset harus punya panel A-Frame, bukan DOM saja.
- **JANGAN utak-atik guard "gagal ke-load" (regresi kritis, jangan diubah/dilonggarkan).** Meta Quest Browser TIDAK punya Web Speech API (`speechSynthesis`). Mengakses API yang absen ini tanpa penjaga di top-level modul yang di-import saat boot akan melempar error → seluruh `src/main.js` batal jalan → gejala khas: halaman 2D hitam, tombol Enter VR nyangkut, masuk VR = layar hijau kosong.
  - Pertahankan `const TTS = 'speechSynthesis' in window` di `src/components/audio-player.js`. SEMUA akses `speechSynthesis` (`onvoiceschanged`, `getVoices`, `speak`, `cancel`) wajib di belakang `if (TTS)` atau di dalam fungsi yang hanya jalan saat `TTS` true. Jangan pernah dikembalikan ke akses top-level tanpa penjaga.
  - `src/selfcheck.js` TIDAK boleh `assert` keberadaan `speechSynthesis` — cukup `console.warn`. `assert` akan melempar dan mematikan boot di Quest.
  - Aturan umum turunannya: jangan sentuh API browser yang bisa absen (Web Speech, dll.) di top-level modul boot; deteksi dulu (`'x' in window`) sebelum dipakai. TTS tak berbunyi di Quest itu WAJAR — VO otomatis jatuh ke subtitle + tempo baca; itu bukan bug, jangan "diperbaiki" dengan memaksa akses TTS.

## Perintah dan verifikasi

- Dari `pfa-vr-web/`: `npm run dev -- --port 7100`, `npm run build`, `npm run preview`.
- Setelah perubahan runtime/aset, selalu jalankan `npm run build`; warning chunk utama >500 kB dan mixed static/dynamic import `script-data.js` saat ini sudah dikenal.
- `package.json` tidak punya lint, test, atau typecheck; jangan mengklaimnya dijalankan.
- CDP butuh Chrome remote debugging `9222`; dari root jalankan `node pfa-vr-web/scripts/cdp.mjs <nav|eval|offline|shot> [arg]`.
- Uji offline wajib memakai `dist/` via preview, profil browser bersih, dan service worker baru.
- Quest dev: `adb reverse tcp:7100`, lalu buka `localhost:7100`; WebXR asli belum terbukti oleh headless.

## WebBridge

- Gunakan satu grup tab WebBridge dengan session `kimi`; detail global ada di `C:\Users\Elz\.kimi\AGENTS.md`.
- Tab background dapat membekukan timer/promise; untuk headless gunakan CDP fire-and-poll dan verifikasi screenshot bila tersedia.

## Dev logging

- Setiap modul runtime impor `src/dev-log.js` (`log`, `warn`, `err`) — semua output memakai prefix `[PFA]` untuk mudah difilter di console browser.
- `log` dan `warn` aktif secara default; matikan dengan query `?nolog` di URL. `err` selalu tampil.
- Titik logging utama: boot, goTo/next/prev, showNextButton, advanceFromUI, enter/exit-vr, VR nav click (dengan x-coordinate), gaze-select, TTS availability, audio.stop, playAmbience.
- Gunakan logging ini untuk debug regresi. Kalau menambah fitur baru, tambahkan `log()` di titik-titik keputusan kunci.

## Peringatan eksperimen & rollback

- **In-VR navigation bar — DITULIS ULANG 2026-08-19, jangan kembalikan ke pola bar tunggal, dan JANGAN kembalikan `#vr-nav` menjadi anak `a-camera`.**
  - **Jebakan paling penting: UI head-locked TIDAK BISA dijangkau gaze.** Cursor gaze (`a-cursor`) adalah anak `a-camera` dan menembak lurus ke depan. Kalau panel interaktif juga anak `a-camera`, keduanya bergerak bersama secara kaku sehingga selisih sudut sinar↔tombol KONSTAN dan sinar tidak pernah bisa mengenainya, ke mana pun pengguna melihat. Terukur pada versi lama: tombol berada 30°, 34°, dan 54° dari arah sinar, dan yang kena hanya `A-SKY`. Inilah sebabnya tombol nav tidak pernah bisa diklik sama sekali — bukan karena logika pemetaan. Panel non-interaktif (subtitle/status) boleh tetap head-locked; apa pun yang harus DIKLIK tidak boleh.
  - Sekarang `#vr-nav` anak **`#camera-rig`** (body-locked): kepala bebas berputar, menunduk ±7–12° mengenai bar, dan ini sekaligus sesuai anjuran Meta/MS/Apple. Posisi dunia tombol tidak berubah (y 1,02 dan 0,86 pada z −1,5) karena rig ada di y 1,2. Efek samping yang wajar: kalau pengguna berputar jauh (mis. melihat pintu/tanaman di S1), bar ada di belakang dan harus berbalik.
  - Bug kedua pada versi lama: satu `a-plane` lebar per baris, tombol ditebak dari `intersection.point.x`. Itu koordinat DUNIA dibanding ambang lokal (titik lokal x=−0,6 terukur jadi −0,97 @yaw15°, −1,49 @yaw45°, **+0,60 @yaw180°**), dan zonanya menganggap bar selebar 2,1 padahal plane 1,8 dengan teks hanya 0,75 — menekan angka 1–7 memetakan ke Scene 2,3,3,4,4,4,5, Scene 1/6/7 mustahil, dan "Selanjutnya" membuka Bantuan.
  - Pola sekarang: **satu `a-plane` per tombol dengan listener sendiri** (`vr-act-prev|advance|next|help`, `vr-jump-0..N`), dibangun `buildVrNav()` di `main.js` dari `SCENES` — jangan hardcode 7. Tidak ada aritmetika koordinat sama sekali. `scene-manager.updateVrNav()` hanya mengurus label Lanjut/Selesai, warna scene aktif, dan menyembunyikan prev di scene 1 / next di scene terakhir.
  - **Teks label tombol nav WAJIB SAUDARA (sibling) dari plane, bukan anak.** Raycaster cursor A-Frame memanggil `intersectObjects(..., true)` (recursive) di atas `flattenObject3DMaps` dari entity `.clickable` — jadi teks yang jadi anak plane ikut diraycast dan bisa menghadang sinar gaze ke tombol lain. TERBUKTI 2026-08-20: sinar ke pusat `vr-jump-0` kena teks "Sebelumnya" (d=1,07) sebelum plane jump-0 (d=1,44) → `cursor.intersectedEl` jadi `a-text` (bukan `.clickable`) → tombol kiri-luar tak pernah terpilih. Jangan kembalikan teks menjadi anak plane.
  - **Controller Quest ditambahkan** (`laser-controls` kiri+kanan, anak `camera-rig`, `raycaster="objects: .clickable; far: 6"`, warna garis token sage). Ini melengkapi keputusan owner "gaze 1,5 dtk ATAU klik controller" yang sebelumnya belum pernah diimplementasi — sebelum ini tidak ada komponen controller/hand sama sekali di seluruh kode. Trigger memancarkan `click` ke entity `.clickable`, jadi listener tombol dipakai bersama gaze tanpa kode tambahan.
  - Terverifikasi lewat raycaster sungguhan di build produksi: mengarahkan kepala ke enam tombol tepat mengenai tombol yang dituju, dan rantai penuh (arahkan → raycast → klik → pindah scene) jalan. Pemetaan tombol juga benar pada yaw 137°, −73°, 200°. **Belum diuji di Quest asli**: dwell 1,5 dtk pada target selebar 0,24 dan perilaku `laser-controls` di headset masih perlu dicek langsung.
- **`@vitejs/plugin-basic-ssl`** ditambahkan di `vite.config.js` untuk HTTPS dev server (Quest testing via LAN butuh secure context). Sertifikat self-signed → browser akan muncul warning, itu normal.
- **Rollback point:** `da2045d` — commit stabil terakhir (in-VR nav + logging + basicSsl). Rollback src: `git checkout da2045d -- pfa-vr-web/src/`. Rollback seluruh: `git reset --hard da2045d`.
- **Perubahan besar mendatang** akan mempengaruhi scene system, UI in-VR, dan mungkin environment. Selalu commit versi stabil SEBELUM mulai perubahan besar, dan test di Quest (atau via CDP screenshot) setelah setiap perubahan signifikan.

## Deploy (fakta lapangan)

- **URL live: `https://pfa-vr.vercel.app`.** Owner deploy MANUAL lewat web Vercel, BUKAN lewat GitHub dan BUKAN lewat Vercel CLI. Jangan sarankan alur Git import.
- Yang diupload adalah isi `pfa-vr-web/dist/`, bukan folder project (folder project ikut `node_modules` ratusan MB).
- Drag-drop `dist/` biasanya membuat URL baru (`dist-xxxx.vercel.app`). Untuk tetap di `pfa-vr.vercel.app`: deploy ke project `pfa-vr` yang sudah ada, atau arahkan lewat Settings → Domains.
- **`vercel.json` TIDAK ikut** kalau hanya `dist/` yang diupload → header cache PWA tidak aktif di deployment sekarang. Konsekuensinya kecil (browser tetap revalidasi service worker per spec), tapi jangan mengklaim header itu berlaku.
- **WebXR butuh secure context.** `http://<IP LAN>:port` → halaman terbuka tapi tombol Enter VR mati di Quest. Yang dikecualikan hanya `localhost` dan `https://`. Karena itu ada `basicSsl` (sertifikat self-signed → warning browser itu normal). Alternatif: `adb reverse tcp:7100 tcp:7100` (adb belum terinstall di mesin ini).
- **Service worker basi di Quest menutupi hasil fix.** Setelah deploy ulang, tutup semua tab → Settings → clear site data, atau refresh 2–3×. Kalau tidak, kamu melihat build lama dan menyimpulkan fix gagal.

## Keputusan owner yang mengikat

- **DILARANG** elemen melayang di tengah pandangan. Panel hijau in-VR pernah dihapus owner karena menutupi pemandangan. Zonasi: atas = teks/info, kiri bawah = SEMUA tombol aksi dalam satu row `#scene-nav`.
- Bar navigasi in-VR disetujui owner dengan pilihan **"selalu tampil (lengkap)"** di zona bawah pandangan, dapat dipilih via gaze 1,5 dtk atau klik.
- Mengubah zonasi/warna yang sudah disetujui owner wajib konfirmasi dulu.
- **VO = file rekaman edge-tts (id-ID ♀/♂) sejak 2026-08-21**, bukan lagi Web Speech. File di `public/audio/vo/{f,m}/<sceneId>-<idx>.mp3`, dibuat `scripts/gen-vo.mjs` dari `script-data.js`; `vo-manifest.json` menandai baris mana yang punya file. `audio-player.js` memutar mp3 sesuai gender → fallback Web Speech (desktop) → fallback subtitle+tempo baca. Ini berbunyi di Quest (Web Speech absen di Quest Browser). Kalau narasi berubah, WAJIB `node scripts/gen-vo.mjs` untuk regenerasi. (Catatan lama "S2 masih jalur lama" sudah usang — sejak 2026-08-31 S2 memakai key `s2-0..s2-5`.)
- **Auto-lanjut = ON secara default (2026-08-31, mengganti keputusan 2026-08-04 "pengguna yang memutuskan").** Setelah VO scene selesai + jeda 1,5 dtk, `runVo()` langsung `next()`. Toggle ON/OFF ada di halaman kontrol (`?role=control`); saat auto-lanjut OFF, perilaku lama kembali (tombol Lanjut DOM + panel in-VR `vr-act-advance`).
- **Kontrol sesi lintas-perangkat (2026-08-31): relay WebSocket lokal LAN di `/__relay`** — plugin `sessionRelay()` di `vite.config.js` (devDep `ws`), menempel ke server dev yang sudah HTTPS (basicSsl → `wss://`, wajib karena `ws://` dari halaman https = mixed content). Quest (role=vr) mem-publish state via `src/session-state.js`; halaman `?role=control` (`src/control.js`) membaca state + mengirim perintah (`stop|next|prev|goto|setAuto`) yang dieksekusi di akhir `main.js`. Relay meng-cache state terakhir untuk klien yang buka di tengah sesi. **Hanya jalan saat server dev laptop hidup & satu Wi-Fi — di Vercel statis relay tidak ada.** Catatan build: target es2020 melarang top-level await → mode kontrol memakai import statis + `throw` sinkron (sentinel `PFA-CONTROL-ONLY`, difilter dari kolektor error) untuk menghentikan boot VR.

## Invariant tambahan (jangan dihapus sebagai "redundan")

- **Watchdog TTS di `audio-player.js`:** `setTimeout(finish, Math.max(3000, teks.length * 120))`. Ada mode gagal KEDUA selain `speechSynthesis` absen: TTS ada tapi tanpa voice → `speechSynthesis.speak()` diam tanpa memicu `onend`/`onerror` → `await speak()` menggantung → sesi macet di baris VO pertama dan tombol Lanjut tak pernah muncul. Watchdog itu satu-satunya yang mencegahnya.
- **Auto-masuk VR tidak mungkin,** bukan sekadar tidak disukai: `requestSession('immersive-vr')` diblokir browser kalau dipanggil otomatis saat load. Masuk VR wajib lewat gesture user.
- **Keluar dari VR** adalah aksi headset (tombol Meta di controller kanan), bukan aksi aplikasi.

## Cacat diketahui

Audit 2026-08-19; status perbaikan diperbarui 2026-08-21.

### SUDAH DIPERBAIKI (2026-08-21, build hijau — sebagian belum divalidasi ulang di Quest)
- **Panel jeda in-VR** — `#vr-pause-wrap` (a-plane + a-text + tombol Lanjutkan/Akhiri) ditambahkan; `safety-exit.js` men-toggle-nya bersama `#screen-pause`.
- **Highlight grounding S3** — 5 entity `#mk-*` (glow ring, `visible:false`) dibangun ulang di `buildEnvironment` mengikuti objek ruang tamu: sofa, **layar proyektor**, tanaman, karpet, meja (layar menggantikan foto keluarga yang dihapus 2026-08-31 karena menutupi sisi kiri layar proyeksi); sebelumnya menunjuk sungai/rumput/pohon/langit/rumah (versi outdoor).
- **Kebocoran objek antar scene** — `destroy()` yang menyembunyikan grup env ditambahkan di s4/s5/s6/s7; orb s2 diturunkan.
- **Build deploy gagal** — `@vitejs/plugin-basic-ssl` dipindah ke `pfa-vr-web/package.json` (versi `^1.2.0` untuk kompatibilitas Vite 5; `^2.x` butuh Vite 6+ → ERESOLVE).
- **Subtitle in-VR meluber** — tinggi plate dihitung dinamis per jumlah baris + `wrap-count`.
- **Awan gelap / air pudar** — awan `shader:flat` + warna terang; disc biru semi-transparan di atas danau. (Berlaku untuk env OUTDOOR sebelum 2026-08-30 — kini environment adalah ruang tamu indoor, entitas awan/danau tidak ada lagi.)
- **Hand tracking meleset & navbar tak keklik** — diganti komponen `raw-hands` (lihat bagian invariant); navbar dipindah ke kiri, jadi target sentuh.
- **VO bisu di Quest** — diganti file rekaman edge-tts (lihat keputusan owner).

### BELUM diperbaiki / catatan
- **S2 belum pakai VO rekaman** — alur napas kustom (`s2.js` `speak()` tanpa key).
- **A-Frame 1.8.0, bukan 1.7** — `package.json` menulis `^1.7.1`, lockfile & node_modules 1.8.0.
- Penyetelan halus posisi/ukuran navbar & ambang sentuh masih perlu iterasi di Quest.
