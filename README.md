# PFA-VR — Psychological First Aid

![A-Frame](https://img.shields.io/badge/A-Frame-2f81f7?style=flat) ![Vite](https://img.shields.io/badge/Vite-2f81f7?style=flat) ![PWA](https://img.shields.io/badge/PWA-2f81f7?style=flat) ![WebSocket](https://img.shields.io/badge/WebSocket-2f81f7?style=flat) ![WebXR](https://img.shields.io/badge/WebXR-2f81f7?style=flat) ![JavaScript](https://img.shields.io/badge/JavaScript-2f81f7?style=flat)

> Eksperimen WebXR untuk pengalaman pertolongan psikologis awal yang dapat diakses dari browser VR maupun desktop.

## Tentang proyek

Eksperimen WebXR untuk pengalaman pertolongan psikologis awal yang dapat diakses dari browser VR maupun desktop. Dokumentasi ini dibuat sebagai panduan singkat untuk memahami ruang lingkup proyek, menjalankannya secara lokal, dan membaca batasan penggunaannya.

## Fitur utama

- 7 sesi terapi terpandu
- Gaze, controller, dan hand-tracking
- Mode offline melalui PWA
- Panel kontrol laptop via WebSocket
- Subtitle dan ambience per scene

## Teknologi

- A-Frame
- Vite
- PWA
- WebSocket
- WebXR
- JavaScript

## Menjalankan secara lokal

Prasyarat dan konfigurasi dapat berbeda menurut sistem operasi. Contoh langkah utama:

```bash
npm install
npm run dev
npm run build
```

## Struktur dan pengembangan

Mulai dari entry point dan folder konfigurasi proyek. Pisahkan credential lokal dari source code, tambahkan test untuk perubahan penting, dan gunakan environment variable untuk konfigurasi deployment.

## Keamanan

- Jangan commit API key, password, token, session ID, atau data pribadi.
- Gunakan file environment lokal dan contoh konfigurasi tanpa nilai rahasia.
- Uji perubahan pada environment development sebelum deployment.

## Status

Proyek ini merupakan bagian dari portofolio **Hilman Arifin Ilham** dan dapat dikembangkan sesuai kebutuhan penggunaan.

> **Catatan:** Proyek ini merupakan prototipe teknologi dan bukan alat diagnosis atau pengganti layanan profesional kesehatan mental.

## Lisensi

Belum ada lisensi open-source yang dinyatakan di repository ini. Hubungi pemilik repository sebelum menggunakan ulang atau mendistribusikan kode.

---

Dibuat oleh [Hilman Arifin Ilham](https://github.com/hilman-devop).
