import { db } from './db';
import { supabase } from './supabaseClient';

// Helper untuk memeriksa status koneksi internet secara aktif
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// =========================================================================
// 1. SINKRONISASI DATA KARYAWAN (employees)
// =========================================================================
export async function syncEmployees() {
  if (!isOnline()) return;

  try {
    // 1. Ambil data terbaru dari Supabase
    const { data: cloudData, error } = await supabase
      .from('employees')
      .select('*');

    if (error) throw error;

    // 2. Simpan/Update data dari Cloud ke Database Lokal (Dexie)
    if (cloudData && cloudData.length > 0) {
      await db.transaction('rw', db.employees, async () => {
        for (const emp of cloudData) {
          await db.employees.put({
            id: emp.id,
            nama: emp.nama,
            telepon: emp.telepon,
            deposit: parseFloat(emp.deposit),
            hutang: parseFloat(emp.hutang)
          });
        }
      });
    }
  } catch (err) {
    console.error('Gagal sinkronisasi employees:', err.message);
  }
}

// =========================================================================
// 2. SINKRONISASI DATA PESANAN (orders)
// =========================================================================
export async function syncOrders() {
  if (!isOnline()) return;

  try {
    // 1. Ambil data terbaru dari Supabase
    const { data: cloudData, error } = await supabase
      .from('orders')
      .select('*');

    if (error) throw error;

    // 2. Update database lokal
    if (cloudData && cloudData.length > 0) {
      await db.transaction('rw', db.orders, async () => {
        for (const ord of cloudData) {
          await db.orders.put({
            id: ord.id,
            karyawanId: ord.karyawan_id,
            barang: ord.barang,
            titipan: parseFloat(ord.titipan),
            realHarga: parseFloat(ord.real_harga),
            kembalian: parseFloat(ord.kembalian),
            status: ord.status,
            tanggal: ord.tanggal
          });
        }
      });
    }
  } catch (err) {
    console.error('Gagal sinkronisasi orders:', err.message);
  }
}

// =========================================================================
// 3. SINKRONISASI DATA MUTASI KAS (ledger)
// =========================================================================
export async function syncLedger() {
  if (!isOnline()) return;

  try {
    // 1. Ambil data terbaru dari Supabase
    const { data: cloudData, error } = await supabase
      .from('ledger')
      .select('*');

    if (error) throw error;

    // 2. Update database lokal
    if (cloudData && cloudData.length > 0) {
      await db.transaction('rw', db.ledger, async () => {
        for (const led of cloudData) {
          await db.ledger.put({
            id: led.id,
            karyawanId: led.karyawan_id,
            tipe: led.tipe,
            nominal: parseFloat(led.nominal),
            keterangan: led.keterangan,
            lunas: led.lunas,
            tanggal: led.tanggal
          });
        }
      });
    }
  } catch (err) {
    console.error('Gagal sinkronisasi ledger:', err.message);
  }
}

// =========================================================================
// 4. METHOD OPERASIONAL UNTUK MENULIS DATA (OFFLINE-FIRST)
// =========================================================================

// Tambah Karyawan Baru
export async function dbAddEmployee(employee) {
  // Tulis ke lokal dulu
  await db.employees.put(employee);

  // Jika online, langsung upload ke Supabase
  if (isOnline()) {
    try {
      await supabase.from('employees').insert({
        id: employee.id,
        nama: employee.nama,
        telepon: employee.telepon,
        deposit: employee.deposit,
        hutang: employee.hutang
      });
    } catch (err) {
      console.warn('Gagal push langsung ke cloud. Tersimpan di lokal.', err.message);
    }
  }
}

// Tambah Pesanan Baru
export async function dbAddOrder(order) {
  // Tulis ke lokal
  await db.orders.put(order);

  // Jika online, push ke Supabase
  if (isOnline()) {
    try {
      await supabase.from('orders').insert({
        id: order.id,
        karyawan_id: order.karyawanId,
        barang: order.barang,
        titipan: order.titipan,
        real_harga: order.realHarga,
        kembalian: order.kembalian,
        status: order.status,
        tanggal: order.tanggal
      });
    } catch (err) {
      console.warn('Gagal push order ke cloud. Tersimpan di lokal.', err.message);
    }
  }
}

// Update Mutasi Finansial & Transaksi Kas (Buku Kas & Order)
export async function dbUpdateFinances(order, employee, ledItem = null) {
  // 1. Tulis ke DB Lokal (Dexie)
  if (order) await db.orders.put(order);
  if (employee) await db.employees.put(employee);
  if (ledItem) await db.ledger.put(ledItem);

  // 2. Jika online, sinkronisasikan ke Supabase
  if (isOnline()) {
    try {
      const promises = [];
      if (order) {
        promises.push(
          supabase.from('orders').upsert({
            id: order.id,
            karyawan_id: order.karyawanId,
            barang: order.barang,
            titipan: order.titipan,
            real_harga: order.realHarga,
            kembalian: order.kembalian,
            status: order.status,
            tanggal: order.tanggal
          })
        );
      }
      if (employee) {
        promises.push(
          supabase.from('employees').upsert({
            id: employee.id,
            nama: employee.nama,
            telepon: employee.telepon,
            deposit: employee.deposit,
            hutang: employee.hutang
          })
        );
      }
      if (ledItem) {
        promises.push(
          supabase.from('ledger').upsert({
            id: ledItem.id,
            karyawan_id: ledItem.karyawanId,
            tipe: ledItem.tipe,
            nominal: ledItem.nominal,
            keterangan: ledItem.keterangan,
            lunas: ledItem.lunas,
            tanggal: ledItem.tanggal
          })
        );
      }
      await Promise.all(promises);
    } catch (err) {
      console.warn('Koneksi bermasalah. Perubahan saldo dicatat di lokal.', err.message);
    }
  }
}

// Jalankan sinkronisasi penuh
export async function runFullSync() {
  if (!isOnline()) return;
  await syncEmployees();
  await syncOrders();
  await syncLedger();
}
