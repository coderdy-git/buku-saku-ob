# Ringkasan Proyek & Panduan Deploy - Buku Saku OB

Proyek **Buku Saku OB** kini telah sepenuhnya dimigrasikan dari prototipe HTML/CSS statis tunggal menjadi aplikasi **Progressive Web App (PWA)** berbasis framework **Svelte + Vite** yang terintegrasi dengan **Supabase** sebagai database cloud realtime, serta database lokal **Dexie.js (IndexedDB)** sebagai engine penyimpanan offline-first.

---

## 1. Arsitektur Teknis yang Terpasang
* **Frontend:** Vite + Svelte. Menjamin ukuran berkas bundle sangat kecil, performa rendering tinggi, dan konsumsi baterai rendah di HP.
* **Database Offline-First:** Dexie.js (wrapper IndexedDB). Data transaksi tersimpan instan secara lokal. Aplikasi tetap berfungsi 100% saat tidak ada sinyal internet.
* **Cloud Database & Sinkronisasi:** Supabase (PostgreSQL + Realtime). Sinkronisasi otomatis dari database lokal ke cloud berjalan di latar belakang saat HP terhubung ke internet.
* **WhatsApp OTP Handler:** Dirancang menggunakan **Metode A (Edge Functions)**. Saat ini dalam mode pengembangan (*bypassed* menggunakan kode OTP simulasi `1234`).
* **Styling & Ikon:** Tailwind CSS dengan Google Font Inter untuk gaya minimalis profesional, dipadukan dengan pustaka ikon resmi `@lucide/svelte`.

---

## 2. Struktur Proyek Terpasang (`/app`)
* `/app/src/lib/db.js`: Skema & inisialisasi IndexedDB lokal (Dexie).
* `/app/src/lib/dbHelper.js`: Sync Engine & Logika CRUD offline-first.
* `/app/src/lib/supabaseClient.js`: Konfigurasi koneksi SDK Supabase.
* `/app/src/lib/components/`:
  * `Header.svelte` & `BottomNav.svelte`: Komponen shell & navigasi.
  * `Login.svelte` & `Register.svelte` & `Otp.svelte`: Form autentikasi.
  * `Dashboard.svelte`: Pengendali modal bottom sheet global dan tab panel.
  * `PesananTab.svelte` & `BukuKasTab.svelte` & `KalkulatorTab.svelte` & `AbsensiTab.svelte`: Modul tab fungsional.

---

## 3. Cara Menjalankan Project secara Lokal
1. Masuk ke direktori aplikasi:
   ```bash
   cd app
   ```
2. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
3. Buka tautan lokal yang disediakan oleh Vite di browser Anda (misalnya `http://localhost:5177/`).

---

## 4. Langkah Men-deploy ke Produksi (Hosting PWA)
Untuk mempublikasikan aplikasi ini agar dapat diakses oleh OB dan Karyawan melalui internet, Anda dapat menggunakan layanan gratis seperti **Vercel**, **Netlify**, atau **GitHub Pages**.

### Langkah-langkah Deploy:
1. Pastikan file `.env` di folder `/app` berisi kredensial Supabase Anda yang valid.
2. Buat build produksi dari aplikasi Svelte:
   ```bash
   npm run build
   ```
   *Perintah ini akan menghasilkan folder `/app/dist` yang berisi file HTML/CSS/JS statis yang siap di-hosting.*
3. Unggah isi folder `/app/dist` tersebut ke layanan hosting pilihan Anda (misalnya Vercel).
4. **Cara Install di HP (PWA):**
   * Buka URL situs hosting Anda di browser HP (Chrome di Android, Safari di iOS).
   * Klik ikon **Titik Tiga** (Android) atau tombol **Share** (iOS), lalu pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
   * Aplikasi Buku Saku OB akan terinstal dan memiliki ikon launcher sendiri di layar HP Anda, berjalan tanpa address bar browser, serta memiliki splash screen bawaan.
