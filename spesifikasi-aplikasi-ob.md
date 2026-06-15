# Spesifikasi Aplikasi: Buku Saku Office Boy (OB)

Aplikasi web mobile-first yang dirancang khusus untuk mempermudah pekerjaan harian Office Boy, terutama dalam hal pencatatan keuangan (talangan), absensi pribadi, dan belanja bulanan kantor.

## Fitur Utama

### 1. Sistem Pesanan & Buku Kas Karyawan (Saldo/Deposit/Hutang)
Sistem untuk mencatat pesanan harian (makanan/minuman) yang terintegrasi dengan saldo masing-masing staf.

*   **Daftar Karyawan & Saldo Akhir:**
    *   Menampilkan nama staf dan status saldonya.
    *   Saldo Positif (Warna Hijau) = Deposit (Staf punya tabungan di OB).
    *   Saldo Negatif (Warna Merah) = Hutang (OB nalangi / kurang bayar).
*   **Alur Pesanan:**
    *   OB membuat pesanan baru dan menautkannya ke nama staf. (Status: Belum Dibeli).
    *   Setelah dibelikan, OB mengubah status menjadi "Selesai" dan memasukkan *Harga Asli Beli*.
    *   Sistem otomatis memotong saldo staf tersebut sebesar harga beli.
*   **Detail & Riwayat Karyawan (Buku Kas):**
    *   Halaman khusus per karyawan yang berisi riwayat lengkap (Pesanan A, Pesanan B, Setor Tunai).
    *   Sangat berguna sebagai bukti jika staf bertanya rincian hutangnya.
*   **Transaksi Manual:** Tombol untuk menambah/mengurangi saldo jika staf memberi uang tunai (untuk bayar hutang atau nambah deposit).
*   **Tagihan WhatsApp:** Tombol "Kirim WA" di profil staf. Hanya aktif jika saldo staf minus (hutang). Meng-generate pesan WA otomatis berisi total tagihan berdasarkan riwayat pesanan yang belum terbayar.

### 2. Absen Pribadi OB
Catatan waktu kerja mandiri, sangat simpel tanpa validasi GPS/Foto.

*   **Check In & Check Out:** Hanya dua tombol besar untuk mencatat jam mulai kerja dan jam selesai kerja hari ini.
*   **Laporan Rentang Waktu:** 
    *   OB bisa memilih tanggal *Dari* (From) dan *Sampai* (To) (Contoh: 1 Juni - 15 Juni).
    *   Menampilkan daftar riwayat jam masuk dan jam pulang dalam rentang waktu tersebut untuk pelaporan mandiri.

### 3. Kalkulator Belanja Bulanan Kantor (Budget Tracker)
Alat bantu hitung saat belanja stok kantor (gula, kopi, dll) agar tidak melebihi uang limit/budget yang diberikan perusahaan.

*   **Input Limit/Budget:** Di awal, OB memasukkan total uang budget (Contoh: Rp 500.000).
*   **Live Tracker (Saat Belanja):**
    *   Header selalu menampilkan: Total Belanjaan & Sisa Budget.
    *   Jika sisa budget minus, angka berubah menjadi merah.
*   **Daftar Barang Interaktif:**
    *   OB memasukkan (Nama Barang + Harga + Qty) saat memasukkan barang ke troli.
    *   Barang langsung masuk ke daftar urut.
    *   Memecahkan masalah kalkulator biasa: OB bisa melihat dengan jelas barang apa saja yang sudah dihitung, sehingga tidak ada barang yang terlewat atau dihitung ganda.
    *   Barang mudah dihapus/diedit jika ternyata budget kurang.
*   **Riwayat Belanja:** Daftar belanja dapat disimpan sebagai riwayat untuk dicocokkan dengan struk asli saat lapor ke GA/HRD.

## Kebutuhan Teknis

*   **Tampilan:** Mobile-first (UI dirancang khusus menyerupai aplikasi HP, navigasi mudah menggunakan jempol).
*   **Penyimpanan Data (Storage):**
    *   *Utama:* Data disimpan di HP secara offline (`localStorage`) agar aplikasi sangat cepat dan tetap bisa digunakan di area tanpa sinyal (seperti di dalam supermarket).
    *   *Backup:* Disiapkan koneksi ke Supabase (Database Cloud) agar data aman jika HP hilang atau browser dibersihkan.
*   **Tech Stack:** Next.js (React) dan Tailwind CSS.
