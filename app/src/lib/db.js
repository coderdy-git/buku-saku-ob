import Dexie from 'dexie';

export const db = new Dexie('BukuSakuOBDatabase');

// Skema database lokal (IndexedDB) untuk caching offline-first.
// Definisi index hanya mencakup field yang akan di-query / di-filter secara aktif.
db.version(2).stores({
  employees: 'id, nama, telepon',
  orders: 'id, karyawanId, status, tanggal',
  ledger: 'id, karyawanId, tipe, tanggal',
  otp_requests: 'id, phone, expires_at',
  shoppingList: 'id, name',
  shoppingHistory: 'id, tanggal',
  attendanceLogs: 'id, tanggal, checkIn'
});
