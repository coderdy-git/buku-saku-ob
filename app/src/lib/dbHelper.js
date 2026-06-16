import { db } from './db';
import { supabase } from './supabaseClient';
import { generateId } from './utils';

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

// Helper untuk menghilangkan Svelte Proxy agar IndexedDB tidak error (DataCloneError)
function unproxy(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// =========================================================================
// 4. METHOD OPERASIONAL UNTUK MENULIS DATA (OFFLINE-FIRST)
// =========================================================================

// Tambah Karyawan Baru
export async function dbAddEmployee(employee) {
  const cleanEmp = unproxy(employee);
  await db.employees.put(cleanEmp);

  if (isOnline()) {
    try {
      await supabase.from('employees').upsert({
        id: cleanEmp.id,
        nama: cleanEmp.nama,
        telepon: cleanEmp.telepon,
        deposit: cleanEmp.deposit,
        hutang: cleanEmp.hutang
      });
    } catch (err) {
      console.warn('Gagal push langsung ke cloud.', err.message);
    }
  }
}

// Tambah Pesanan Baru
export async function dbAddOrder(order) {
  const cleanOrd = unproxy(order);
  await db.orders.put(cleanOrd);

  if (isOnline()) {
    try {
      await supabase.from('orders').upsert({
        id: cleanOrd.id,
        karyawan_id: cleanOrd.karyawanId,
        barang: cleanOrd.barang,
        titipan: cleanOrd.titipan,
        real_harga: cleanOrd.realHarga,
        kembalian: cleanOrd.kembalian,
        status: cleanOrd.status,
        tanggal: cleanOrd.tanggal
      });
    } catch (err) {
      console.warn('Gagal push order ke cloud.', err.message);
    }
  }
}

// Update Mutasi Finansial & Transaksi Kas (Buku Kas & Order)
export async function dbUpdateFinances(order, employee, ledItem = null) {
  const cleanOrd = unproxy(order);
  const cleanEmp = unproxy(employee);
  const cleanLed = unproxy(ledItem);

  if (cleanOrd) await db.orders.put(cleanOrd);
  if (cleanEmp) await db.employees.put(cleanEmp);
  if (cleanLed) await db.ledger.put(cleanLed);

  if (isOnline()) {
    try {
      const promises = [];
      if (cleanOrd) {
        promises.push(
          supabase.from('orders').upsert({
            id: cleanOrd.id,
            karyawan_id: cleanOrd.karyawanId,
            barang: cleanOrd.barang,
            titipan: cleanOrd.titipan,
            real_harga: cleanOrd.realHarga,
            kembalian: cleanOrd.kembalian,
            status: cleanOrd.status,
            tanggal: cleanOrd.tanggal
          })
        );
      }
      if (cleanEmp) {
        promises.push(
          supabase.from('employees').upsert({
            id: cleanEmp.id,
            nama: cleanEmp.nama,
            telepon: cleanEmp.telepon,
            deposit: cleanEmp.deposit,
            hutang: cleanEmp.hutang
          })
        );
      }
      if (cleanLed) {
        promises.push(
          supabase.from('ledger').upsert({
            id: cleanLed.id,
            karyawan_id: cleanLed.karyawanId,
            tipe: cleanLed.tipe,
            nominal: cleanLed.nominal,
            keterangan: cleanLed.keterangan,
            lunas: cleanLed.lunas,
            tanggal: cleanLed.tanggal
          })
        );
      }
      await Promise.all(promises);
    } catch (err) {
      console.warn('Koneksi bermasalah. Perubahan saldo dicatat di lokal.', err.message);
    }
  }
}

// =========================================================================
// 5. SINKRONISASI DATA RIWAYAT BELANJA (shopping_history)
// =========================================================================
export async function syncShoppingHistory() {
  if (!isOnline()) return;
  try {
    const { data: cloudData, error } = await supabase
      .from('shopping_history')
      .select('*');
    if (error) throw error;
    if (cloudData && cloudData.length > 0) {
      await db.transaction('rw', db.shoppingHistory, async () => {
        for (const item of cloudData) {
          await db.shoppingHistory.put({
            id: item.id,
            items: item.items,
            total: parseFloat(item.total),
            budget: parseFloat(item.budget),
            tanggal: item.tanggal
          });
        }
      });
    }
  } catch (err) {
    console.error('Gagal sinkronisasi shopping_history:', err.message);
  }
}

// =========================================================================
// 6. SINKRONISASI DATA LOG ABSENSI (attendance_logs)
// =========================================================================
export async function syncAttendanceLogs() {
  if (!isOnline()) return;
  try {
    const { data: cloudData, error } = await supabase
      .from('attendance_logs')
      .select('*');
    if (error) throw error;
    if (cloudData && cloudData.length > 0) {
      await db.transaction('rw', db.attendanceLogs, async () => {
        for (const log of cloudData) {
          await db.attendanceLogs.put({
            id: log.id,
            checkIn: log.check_in,
            checkOut: log.check_out,
            tanggal: log.tanggal
          });
        }
      });
    }
  } catch (err) {
    console.error('Gagal sinkronisasi attendance_logs:', err.message);
  }
}

// =========================================================================
// 7. METHOD OPERASIONAL TAMBAHAN (OFFLINE-FIRST)
// =========================================================================

// Tambah Riwayat Belanja
export async function dbAddShoppingHistory(historyItem) {
  const cleanItem = unproxy(historyItem);
  await db.shoppingHistory.put(cleanItem);
  if (isOnline()) {
    try {
      await supabase.from('shopping_history').upsert({
        id: cleanItem.id,
        items: cleanItem.items,
        total: cleanItem.total,
        budget: cleanItem.budget,
        tanggal: cleanItem.tanggal
      });
    } catch (err) {
      console.warn('Gagal push shopping_history ke cloud.', err.message);
    }
  }
}

// Tambah Log Absensi
export async function dbAddAttendanceLog(log) {
  const cleanLog = unproxy(log);
  await db.attendanceLogs.put(cleanLog);
  if (isOnline()) {
    try {
      await supabase.from('attendance_logs').upsert({
        id: cleanLog.id,
        check_in: cleanLog.checkIn,
        check_out: cleanLog.checkOut || null,
        tanggal: cleanLog.tanggal
      });
    } catch (err) {
      console.warn('Gagal push attendance_log ke cloud.', err.message);
    }
  }
}

// Jalankan sinkronisasi penuh
export async function runFullSync() {
  if (!isOnline()) return;
  await Promise.all([
    syncEmployees(),
    syncOrders(),
    syncLedger(),
    syncShoppingHistory(),
    syncAttendanceLogs()
  ]);
}
