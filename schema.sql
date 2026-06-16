-- SQL Schema untuk Buku Saku OB (SaaS dengan Supabase Auth)
-- Jalankan script ini di SQL Editor dashboard Supabase Anda

-- =========================================================================
-- 1. PEMBUATAN TABEL
-- =========================================================================

-- Tabel Operator (Akun OB yang terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    telepon TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Karyawan (employees - Pelanggan Kantin dari tiap OB)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY, -- format: emp-XXXXXX
    operator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.operators(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    telepon TEXT NOT NULL,
    deposit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    hutang NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Pesanan Canteen (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    operator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.operators(id) ON DELETE CASCADE,
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
    operator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.operators(id) ON DELETE CASCADE,
    karyawan_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    tipe TEXT NOT NULL CHECK (tipe IN ('PESANAN', 'TOPUP')),
    nominal NUMERIC(15, 2) NOT NULL,
    keterangan TEXT NOT NULL,
    lunas BOOLEAN NOT NULL DEFAULT FALSE,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Riwayat Belanja Kantor (shopping_history)
CREATE TABLE IF NOT EXISTS public.shopping_history (
    id TEXT PRIMARY KEY,
    operator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.operators(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Log Absensi (attendance_logs)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id TEXT PRIMARY KEY,
    operator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.operators(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE
);

-- =========================================================================
-- 2. INDEKS UNTUK OPTIMALISASI QUERY
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_employees_operator ON public.employees(operator_id);
CREATE INDEX IF NOT EXISTS idx_orders_operator ON public.orders(operator_id);
CREATE INDEX IF NOT EXISTS idx_ledger_operator ON public.ledger(operator_id);
CREATE INDEX IF NOT EXISTS idx_shopping_history_operator ON public.shopping_history(operator_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_operator ON public.attendance_logs(operator_id);

-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- RLS aktif: Data 100% aman dan tersekat antar OB.

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Hanya pengguna yang login (auth.uid()) yang bisa mengakses datanya sendiri
CREATE POLICY "Operators can view own profile" ON public.operators FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Operators can update own profile" ON public.operators FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Operators can insert own profile" ON public.operators FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "OB can manage own employees" ON public.employees FOR ALL USING (operator_id = auth.uid());
CREATE POLICY "OB can manage own orders" ON public.orders FOR ALL USING (operator_id = auth.uid());
CREATE POLICY "OB can manage own ledger" ON public.ledger FOR ALL USING (operator_id = auth.uid());
CREATE POLICY "OB can manage own shopping history" ON public.shopping_history FOR ALL USING (operator_id = auth.uid());
CREATE POLICY "OB can manage own attendance" ON public.attendance_logs FOR ALL USING (operator_id = auth.uid());
