# Ringkasan AGENTS.md — Project PFA-VR (VR-Phase3)

> Ringkasan padat dari `AGENTS.md` untuk share ke dosen/tim. Detail lengkap & alasan teknis tetap di `AGENTS.md`.

## 1. Apa projectnya

**PFA-VR** — aplikasi *Psychological First Aid* berbasis Virtual Reality untuk korban bencana erupsi. 7 sesi terapi (orientasi → napas → grounding → kontrol diri → dukungan sosial → harapan → penutup), berbahasa Indonesia, berjalan di **Meta Quest** lewat browser (WebXR), offline penuh (PWA), tanpa backend/telemetri. Live: `https://pfa-vr.vercel.app`.

## 2. Teknologi

- **Stack**: Vite (vanilla JS), A-Frame 1.8, PWA (`vite-plugin-pwa`), WebSocket relay (`ws`, dev-only)
- **Perangkat uji**: Meta Quest 3S
- **Suara**: narasi voice-over rekaman edge-tts (id-ID ♀/♂), ambience musik terapi per scene
- **Aset**: semua lokal di `public/` (model GLB, audio, font, draco) — offline penuh

## 3. Struktur kode utama

| File | Peran |
|---|---|
| `src/main.js` | Boot, UI 2D, navbar in-VR, eksekusi perintah kontrol |
| `src/scenes/scene-manager.js` | Urutan S1→S7, fade, navigasi, auto-lanjut |
| `src/scenes/script-data.js` | **Satu-satunya** tempat narasi, cue & timing |
| `src/environment/environment.js` | Dunia 3D bersama (ruang tamu terapeutik) |
| `src/session-state.js` | State sesi pusat + log (untuk halaman kontrol) |
| `src/control.js` | Halaman kontrol sesi dari laptop (`?role=control`) |
| `src/components/raw-hands.js` | Hand tracking Quest (gambar sendi mentah) |
| `src/components/audio-player.js` | Pemutar VO + ambience |

## 4. Fitur interaksi (3 jalur paralel)

1. **Gaze dwell 1,5 detik** — fallback universal (wajib, tidak boleh dihapus)
2. **Controller Quest** — laser pointer
3. **Hand tracking** — sentuh tombol langsung dengan jari

## 5. Aturan penting (invariant yang tidak boleh dilanggar)

- **Rig kamera WAJIB di lantai** (`0 0 0`); tinggi mata 1,2 m di `a-camera` — melanggar = POV salah + tangan & navbar bergeser (3 bug sekaligus)
- **Pengguna duduk statis** — locomotion dimatikan (keputusan owner)
- **Web Speech API tidak ada di Quest** — semua akses TTS wajib di belakang penjaga `'speechSynthesis' in window`; kalau tidak, seluruh aplikasi gagal boot
- **UI yang harus diklik tidak boleh head-locked** — gaze cursor tidak akan pernah bisa mengenainya
- **Hand tracking pakai komponen `raw-hands` buatan sendiri**, bukan bawaan A-Frame (yang bawaan menggeser visual tangan ~1,2 m)
- **VO = file rekaman mp3** (bukan Web Speech) — kalau narasi berubah, wajib regenerasi via `scripts/gen-vo.mjs`
- **Auto-lanjut ON default** — scene pindah otomatis setelah narasi selesai; bisa dimatikan dari halaman kontrol
- **Keluar dari VR** = tombol Meta di headset, bukan aksi aplikasi

## 6. Halaman kontrol sesi (fitur terbaru)

Dari laptop, buka `?role=control` saat sesi berjalan di Quest (satu Wi-Fi, server dev laptop hidup):
- Pantau status & scene aktif secara realtime
- Tombol: Hentikan Sesi, Next/Prev, lompat scene 1–7, toggle Auto-lanjut
- Log realtime semua event sesi
- Komunikasi via relay WebSocket lokal (`/__relay`)

## 7. Cacat yang sudah diperbaiki (Agustus 2026)

Hand tracking meleset, navbar tak bisa diklik, VO bisu di Quest, tabrakan suara antar scene, subtitle meluber, kebocoran objek antar scene, panel jeda in-VR — semuanya sudah fix & build hijau. Detail per bug ada di `SESSION.md`.

## 8. Yang masih berjalan

- Validasi akhir di Quest asli (kenyamanan, posisi navbar, ambang sentuh)
- Review psikolog (T6.2) & uji peserta (T6.3) — butuh manusia
- Penyesuaian halus posisi/ukuran elemen UI in-VR
