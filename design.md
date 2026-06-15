# UI Kit & Design System: Buku Saku OB

Aplikasi ini ditujukan untuk kemudahan penggunaan di lapangan (mobile-first), sehingga elemen UI harus besar, jelas (kontras tinggi), dan mudah disentuh dengan satu tangan (jempol).

## 🎨 1. UI Kit (Color Palette & Typography)

### A. Palet Warna (Color Palette)
Warna sangat krusial di aplikasi ini untuk membedakan status dengan cepat tanpa harus membaca teks (contoh: merah untuk hutang/minus, hijau untuk aman/selesai).

*   **Primary (Biru/Indigo):** `#4F46E5` (Digunakan untuk header, tombol utama, dan bottom navigation yang aktif).
*   **Success (Hijau):** `#10B981` (Digunakan untuk Saldo Deposit, tombol Selesai, dan sisa budget aman).
*   **Danger (Merah):** `#EF4444` (Digunakan untuk Saldo Minus/Hutang, budget melebihi limit, dan tombol hapus).
*   **Warning (Kuning/Oranye):** `#F59E0B` (Digunakan untuk status pesanan "Belum Dibeli" atau peringatan).
*   **Background (Abu-abu Terang):** `#F3F4F6` (Latar belakang aplikasi agar kartu/card terlihat menonjol).
*   **Card/Surface (Putih):** `#FFFFFF` (Latar belakang untuk daftar pesanan dan profil staf).
*   **Text (Hitam/Abu Gelap):** `#111827` (Teks utama), `#6B7280` (Teks sekunder/keterangan).

### B. Tipografi (Typography)
*   **Font Family:** Inter atau Roboto (Bawaan Tailwind/Next.js) - Sangat mudah dibaca.
*   **Ukuran:**
    *   *Heading/Nominal Uang:* Besar dan tebal (Font bold, ukuran `text-2xl` atau `text-3xl`).
    *   *Teks Utama:* Ukuran standar (`text-base`).
    *   *Teks Sekunder (Tanggal/Waktu):* Agak kecil (`text-sm`).

### C. Komponen Utama (Components)
*   **Bottom Navigation Bar (Menu Bawah):** Menu dengan ikon untuk navigasi (Pesanan, Buku Kas, Absen, Kalkulator). Ikon harus cukup besar agar mudah di-tap.
*   **Floating Action Button (FAB):** Tombol bulat melayang di pojok kanan bawah (biasanya ikon `+`) untuk aksi utama yang sering dipakai: "Tambah Pesanan", "Mulai Belanja".
*   **Card (Kartu):** Setiap data (pesanan, karyawan) ditampilkan dalam bentuk kotak bersudut melengkung (`rounded-xl`) dengan sedikit bayangan (`shadow-sm`) agar terpisah dari background.
*   **Button (Tombol):** Berukuran besar (padding `py-3`, `px-4`), sudut melengkung (`rounded-lg`), khusus dirancang agar mudah ditekan pakai jempol.

---

## 📱 2. Wireframe / Layout Tiap Halaman

### Layout Utama (Global)
*   **Header (Top Bar):** Menampilkan Judul Halaman (Misal: "Daftar Pesanan").
*   **Body (Konten):** Area utama yang bisa di-scroll.
*   **Footer (Bottom Nav):** 4 Tab Utama:
    1. 📝 **Pesanan** (Home)
    2. 👥 **Buku Kas**
    3. 🛒 **Belanja**
    4. ⏱️ **Absen**

### Halaman 1: Pesanan (Home)
*   **Atas:** Tab toggle antara "Belum Dibeli" dan "Riwayat Selesai".
*   **Isi:** Daftar Card. Tiap Card berisi:
    *   Nama Karyawan (Tebal)
    *   Teks Pesanan (Misal: Kopi Hitam)
    *   Status Label (Warna Kuning: Belum Dibeli)
*   **Tombol Bawah (FAB):** `+ Pesanan Baru`.

### Halaman 2: Buku Kas Karyawan
*   **Atas:** Total Uang yang sedang dipegang (Opsional).
*   **Isi:** Daftar Karyawan (berbentuk Card baris).
    *   Nama Karyawan (Kiri)
    *   Nominal Saldo (Kanan) -> Teks Hijau jika Deposit, Merah jika Minus.
*   **Klik Card -> Buka "Detail Karyawan":**
    *   Info Saldo Besar di atas.
    *   2 Tombol Berjejer: "Top Up / Bayar" & "Kirim WA Tagihan".
    *   Daftar Riwayat Transaksi ke bawah.

### Halaman 3: Kalkulator Belanja
*   **Header Sticky:**
    *   Limit: Rp 500.000
    *   Total Belanja: Rp 150.000
    *   Sisa: Rp 350.000 (Warna Hijau. Jika < 0 berubah Merah).
*   **Isi:** Form "Tambah Barang" (Nama, Harga, Qty) bersebelahan dengan tombol "Tambah".
*   **Bawahnya:** Daftar list barang yang sudah di-input (Ada tombol silang kecil 'x' untuk hapus).
*   **Tombol Bawah:** "Selesai Belanja".

### Halaman 4: Absen Pribadi
*   **Tengah Layar:** 
    *   Info Tanggal & Jam saat ini (Berjalan).
    *   Tombol Lingkaran Raksasa: "CHECK IN" (Hijau). Jika sudah ditekan, berubah jadi "CHECK OUT" (Merah).
*   **Bawahnya:** Tombol "Lihat Laporan Bulanan".
    *   Jika diklik, membuka list riwayat masuk & pulang per hari.

---

## 🛠️ 3. Iconography (Lucide React)
Kita akan menggunakan icon set yang minimalis dan jelas, contohnya dari *Lucide React*.
*   Pesanan: `ClipboardList`
*   Buku Kas: `Users` atau `Wallet`
*   Kalkulator: `ShoppingCart` atau `Calculator`
*   Absen: `Clock`
*   Tambah: `Plus`
*   WhatsApp: `MessageCircle` (Atau icon logo WA jika tersedia).

---

## 🎨 4. Sistem Status & Umpan Balik (States & Feedback)

Untuk meningkatkan kenyamanan penggunaan di lapangan (offline-first), berikut adalah standar status UI:

### A. Toast Notification (Notifikasi Melayang)
*   **Success Toast:** Border kiri hijau (`#10B981`), ikon `CheckCircle`. Digunakan untuk aksi berhasil (misal: "Pesanan disimpan", "Absen berhasil").
*   **Danger Toast:** Border kiri merah (`#EF4444`), ikon `AlertTriangle`. Digunakan untuk error atau validasi budget terlampaui.

### B. Status Loading (Skeleton Loader)
*   Menampilkan animasi *skeleton animation* (berkedip abu-abu terang) pada kartu pesanan atau profil kas untuk merepresentasikan loading data sebelum data terisi penuh.
*   **Button Spinner:** Tombol aksi utama berubah menjadi setengah transparan dengan animasi spinner berputar dan berstatus disabled saat memproses input data.

### C. Halaman Kosong (Empty State)
*   Menggunakan layout terpusat (*center aligned*) dengan ikon berukuran besar yang pudar (`#9CA3AF`), teks judul tebal (seperti *"Belum Ada Pesanan"*), dan deskripsi penjelasan beserta tombol aksi cepat untuk mengarahkan pengguna melakukan input pertama kali.

### D. Bottom Sheet Input Modal
*   Panel form input yang bergeser naik dari bagian bawah layar handphone (*slide up bottom sheet*) untuk melakukan entri data penting (seperti "Buat Pesanan Baru" atau "Top Up Saldo").

### E. Konektivitas & Cadangan Awan (Cloud Sync Status)
*   **Mode Offline:** Status berwarna oranye/kuning (`#F59E0B`) dengan ikon `CloudOff` ketika berjalan lokal.
*   **Sedang Sinkronisasi:** Ikon berputar `RefreshCw` berwarna biru (`#3B82F6`) untuk memberi tahu proses unggah data sedang berjalan.
*   **Terkoneksi/Synced:** Status berwarna hijau (`#10B981`) dengan ikon `Cloud` ketika data lokal dan Supabase sudah aman tersinkronisasi.