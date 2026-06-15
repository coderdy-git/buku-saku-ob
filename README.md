# Buku Saku OB (Aplikasi Pendamping Office Boy) 📱💼

[![Svelte](https://img.shields.io/badge/svelte-%23f14135.svg?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge)](https://web.dev/explore/progressive-web-apps)

Aplikasi mobile-first, **offline-ready PWA (Progressive Web App)** yang dirancang khusus untuk mempermudah operasional harian *Office Boy* (OB). Aplikasi ini mencakup pencatatan pesanan makanan kantin, kas bailout (talangan) karyawan, kalkulator belanja ATK kantor dengan sistem autocomplete, serta modul absensi mandiri biometrik.

---

## ✨ Fitur Utama
1. **Daftar Pesanan Kantin:** Pencatatan pesanan, pembayaran cash dengan kalkulator kembalian otomatis, atau talangan hutang.
2. **Buku Kas & Buku Hutang Karyawan:** Pemisahan pencatatan deposit & hutang talangan secara transparan (tanpa pemotongan otomatis), fitur potong saldo deposit secara manual, dan integrasi pengiriman tagihan WhatsApp.
3. **Kalkulator Belanja Kantor:** Pengelolaan budget limit pengeluaran, troli belanja, dan sistem Autocomplete harga satuan berdasarkan log belanja barang sebelumnya.
4. **Absensi Mandiri:** Jam absen kehadiran sidik jari dengan visual log bulanan yang rapi.
5. **Offline-First Storage:** Menggunakan **IndexedDB (Dexie.js)** di browser lokal sehingga aplikasi dibuka instan dan dapat digunakan 100% tanpa sinyal internet.
6. **Cloud Real-time Synchronization:** Otomatis mengirimkan data lokal ke cloud database **Supabase (PostgreSQL)** begitu HP mendeteksi adanya sinyal internet.


---


## 🏗️ Struktur Proyek
```text
buku-saku-ob/
├── app/                  # Aplikasi utama (Vite + Svelte PWA)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.js          # Skema database lokal Dexie
│   │   │   ├── dbHelper.js    # Sinkronisasi Cloud & CRUD Helper
│   │   │   └── supabaseClient # Koneksi Client Supabase
│   │   └── components/        # Komponen Tab Halaman Svelte
│   └── vite.config.js    # Konfigurasi bundler & PWA Engine
├── prototype/            # Berkas dokumentasi & mock-up HTML awal
├── schema.sql            # Script SQL untuk Setup Tabel di Supabase
└── README.md             # Petunjuk dokumentasi utama proyek
```

---

## 🚀 Panduan Deploy Produksi (PWA)
1. Buat build aplikasi versi produksi:
   ```bash
   npm run build
   ```
2. Unggah seluruh isi direktori `app/dist` ke penyedia hosting gratis seperti **Vercel**, **Netlify**, atau **GitHub Pages**.
3. **Cara Install di HP:** Buka link website hasil deploy Anda di Chrome/Safari HP, lalu klik **"Tambahkan ke Layar Utama" (Add to Home Screen)**. Aplikasi siap dijalankan secara native dari homescreen HP Anda!
