-- SQL Schema untuk Buku Saku OB (Supabase / PostgreSQL)
-- Jalankan script ini di SQL Editor dashboard Supabase Anda

-- =========================================================================
-- 1. PEMBUATAN TABEL
-- =========================================================================

-- Tabel Karyawan (employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY, -- format: emp-XXXXXX
    nama TEXT NOT NULL,
    telepon TEXT NOT NULL UNIQUE,
    deposit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    hutang NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Pesanan Canteen (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    karyawan_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    barang TEXT NOT NULL,
    titipan NUMERIC(15, 2) NOT NULL DEFAULT 0,
    real_harga NUMERIC(15, 2) NOT NULL DEFAULT 0,
    kembalian NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('BELUM_DIBELI', 'MENUNGGU_KEMBALIAN', 'SELESAI')),
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Transaksi Buku Kas (ledger)
CREATE TABLE IF NOT EXISTS public.ledger (
    id TEXT PRIMARY KEY,
    karyawan_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    tipe TEXT NOT NULL CHECK (tipe IN ('PESANAN', 'TOPUP')),
    nominal NUMERIC(15, 2) NOT NULL, -- Negatif untuk pengeluaran/hutang, positif untuk bayar/topup
    keterangan TEXT NOT NULL,
    lunas BOOLEAN NOT NULL DEFAULT FALSE,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel OTP WhatsApp Verification (otp_codes)
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- =========================================================================
-- 2. INDEKS UNTUK OPTIMALISASI QUERY
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_orders_karyawan ON public.orders(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_ledger_karyawan ON public.ledger(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone) WHERE NOT verified;

-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Mengaktifkan RLS pada seluruh tabel untuk keamanan data
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Catatan Keamanan: Untuk menyederhanakan tahap awal, policy di bawah ini mengizinkan
-- akses baca/tulis bagi pengguna anonim (anon) atau terotentikasi (authenticated).
-- Di tahap produksi, ini harus diperketat menggunakan user-based auth.

CREATE POLICY "Allow public read access to employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public write access to employees" ON public.employees FOR ALL USING (true);

CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public write access to orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Allow public read access to ledger" ON public.ledger FOR SELECT USING (true);
CREATE POLICY "Allow public write access to ledger" ON public.ledger FOR ALL USING (true);

CREATE POLICY "Allow public access to otp_codes" ON public.otp_codes FOR ALL USING (true);
