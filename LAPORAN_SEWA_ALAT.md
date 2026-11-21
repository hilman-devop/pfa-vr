# Klarifikasi Realisasi Anggaran: "Sewa Alat" — PFA-VR

> Lampiran klarifikasi kategori anggaran untuk update laporan.
> Proyek: **PFA-VR** — aplikasi Psychological First Aid berbasis Virtual Reality untuk korban bencana erupsi.
> Status: aplikasi fungsional penuh, teruji di Meta Quest 3S, live di `https://pfa-vr.vercel.app`.

---

## Catatan Kategori

Kategori **Sewa Alat** mencakup penyediaan sarana produksi (workstation, headset Meta Quest 3S untuk pengujian) serta jasa teknis pengerjaan proyek. Seluruh perangkat lunak pembangun aplikasi bersifat **open source** (A-Frame/WebXR, Vite, Workbox) sehingga **tidak menimbulkan biaya lisensi** — alokasi anggaran terfokus pada produksi dan pengerjaan teknis.

---

## Rincian Item & Realisasi

| No | Item Anggaran | Definisi Kerja | Realisasi & Bukti |
|----|---------------|----------------|-------------------|
| 1 | **Bug fixing** | Jasa QA: verifikasi perangkat, identifikasi & perbaikan cacat perangkat lunak | Log perbaikan per sesi terdokumentasi (`SESSION.md`); uji berulang di Quest 3S; panel diagnostik in-VR; perbaikan terdokumentasi: hand tracking, audio VO, navigasi in-VR, stabilitas antar-scene |
| 2 | **Environmental 3D terapeutik** | Produksi lingkungan 3D 360° bernuansa terapeutik | Dunia ruang tamu indoor lengkap (7 scene berbagi satu dunia); model 3D GLB terkompresi Draco; objek grounding terapi 5-4-3-2-1; pencahayaan tenang sesuai konteks terapi |
| 3 | **Sound therapy** | Produksi audio terapi: suara pemandu (voice-over) & musik ambient | **100 file VO** (50 baris narasi × 2 pilihan gender, bahasa Indonesia, edge-tts); **2 musik ambient** per scene; generator VO otomatis (`scripts/gen-vo.mjs`) |
| 4 | **Aplikasi VR** | Pengembangan aplikasi VR 7 sesi terapi PFA | Aplikasi `pfa-vr-web/` (Vite + A-Frame/WebXR); 7 scene terapi; 3 jalur input (gaze, controller, hand tracking); safety exit; mood check pre/post; naskah terapi terstruktur (`NASKAH_VR.md`) |
| 5 | **Build aplikasi** | Build produksi, PWA offline penuh, deploy | Output build `dist/`; PWA dengan precache seluruh aset (~124 entri, ±11 MB) — berjalan **100% offline tanpa backend**; deploy di `https://pfa-vr.vercel.app` |

---

## Narasi Realisasi (siap tempel ke laporan)

Seluruh perangkat lunak pembangun aplikasi berbasis teknologi open source (A-Frame/WebXR, Vite, Workbox) sehingga tidak menimbulkan biaya lisensi. Alokasi anggaran dimanfaatkan untuk kebutuhan produksi dan pengerjaan teknis: perbaikan bug dan verifikasi di perangkat, produksi lingkungan 3D terapeutik, produksi audio terapi (50 baris suara pemandu dalam dua pilihan gender + musik ambient per scene), pengembangan aplikasi VR tujuh sesi terapi, serta build dan penerapan aplikasi secara offline penuh (PWA).

---

## Tahapan Berikutnya

- Review materi oleh tenaga psikolog
- Uji coba dengan peserta (pendampingan tenaga kesehatan)
- Penyetelan halus UI in-VR berdasarkan umpan balik Quest

---

## Catatan Penyampaian (internal, tidak untuk laporan pusat)

1. Kirim sebagai **lampiran klarifikasi**, bukan pembetulan — framing "klarifikasi kategori", bukan "kesalahan".
2. Bukti fisik (file, log, screenshot) tidak perlu dicantumkan semua di laporan pusat — cukup tabel di atas; sisanya bisa ditunjukkan saat diminta.
3. **Jangan membuat kuitansi/invoice fiktif.** Jika pusat meminta bukti "sewa", jawabannya adalah catatan realisasi-vs-rencana dengan penjelasan kategori di atas.
4. Saran: dosen dapat mengonfirmasi ke pusat apakah update laporan boleh mencantumkan realisasi yang berbeda kategori dari rencana dengan catatan penjelasan — format "rencana vs realisasi + justifikasi" adalah format standar skema pendanaan.
5. Semua angka pada tabel sudah diverifikasi langsung dari repo per 2026-08-31: 50 VO × 2 gender, 2 ambience, 1 model GLB, precache 124 entri, 7 scene.
