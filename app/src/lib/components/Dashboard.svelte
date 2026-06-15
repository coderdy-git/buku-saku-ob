<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Import Icon resmi Lucide
  import { Plus } from '@lucide/svelte';

  // Import tab-tab modular
  import PesananTab from './PesananTab.svelte';
  import BukuKasTab from './BukuKasTab.svelte';
  import KalkulatorTab from './KalkulatorTab.svelte';
  import AbsensiTab from './AbsensiTab.svelte';

  // Import Layout
  import Header from './Header.svelte';
  import BottomNav from './BottomNav.svelte';

  // Import Database Offline-First & Sync Engine
  import { db } from '../db';
  import { 
    dbAddEmployee, 
    dbAddOrder, 
    dbUpdateFinances, 
    runFullSync,
    isOnline
  } from '../dbHelper';

  export let user = { nama: 'Operator', telepon: '', verified: true };
  
  let activeTab = 'orders'; // orders | cashbook | calculator | attendance
  let orderTabFilter = 'belum'; // belum | selesai
  let belanjaTabFilter = 'troli'; // troli | riwayat
  let activeEmployeeId = null;

  // Databases (Reactive state dari IndexedDB)
  let employees = [];
  let orders = [];
  let ledger = [];
  let shoppingList = [];
  let shoppingHistory = [];
  let attendanceLogs = [];
  let shoppingBudget = 500000;

  // Modal State
  let isModalOpen = false;
  let modalType = ''; // addOrder | addEmployee | payOrTopup | completeOrder
  let selectedOrder = null;
  let selectedEmployee = null;

  // Modal Form Fields
  let formKaryawanId = '';
  let formBarang = '';
  let formTitipanStr = '';
  let formEmpNama = '';
  let formEmpTel = '';
  let formEmpDepositStr = '';
  let formRealHargaStr = '';
  let formPayNominalStr = '';
  let formPayType = 'TOPUP'; // TOPUP | BAYAR_HUTANG | POTONG_DEPOSIT
  let formPayKeterangan = '';
  let formBudgetStr = '';

  // Load Data Secara Reaktif Dari Dexie (IndexedDB)
  async function loadDataFromDexie() {
    employees = await db.employees.toArray();
    orders = await db.orders.orderBy('tanggal').reverse().toArray();
    ledger = await db.ledger.orderBy('tanggal').reverse().toArray();
    shoppingList = await db.shoppingList.toArray();
    shoppingHistory = await db.shoppingHistory.toArray();
    attendanceLogs = await db.attendanceLogs.toArray();
    
    // Ambil budget belanja
    shoppingBudget = parseFloat(localStorage.getItem('ob_budget')) || 500000;
  }

  onMount(async () => {
    // 1. Muat cache data lokal secara cepat
    await loadDataFromDexie();

    // 2. Jalankan sinkronisasi awan jika online
    if (isOnline()) {
      await runFullSync();
      // Muat ulang data hasil sinkronisasi awan terbaru
      await loadDataFromDexie();
    }
  });

  // --- ACTIONS & MUTATORS ---
  function openModal(type, extra = null) {
    modalType = type;
    isModalOpen = true;
    
    if (type === 'addOrder') {
      formKaryawanId = employees.length > 0 ? employees[0].id : '';
      formBarang = '';
      formTitipanStr = '';
    } else if (type === 'addEmployee') {
      formEmpNama = '';
      formEmpTel = '';
      formEmpDepositStr = '';
    } else if (type === 'completeOrder') {
      selectedOrder = extra;
      formRealHargaStr = '';
    } else if (type === 'payOrTopup') {
      selectedEmployee = extra;
      formPayNominalStr = '';
      formPayType = 'TOPUP';
      formPayKeterangan = '';
    } else if (type === 'editBudget') {
      formBudgetStr = shoppingBudget.toLocaleString('id-ID');
    }
  }

  function closeModal() {
    isModalOpen = false;
    modalType = '';
    selectedOrder = null;
    selectedEmployee = null;
  }

  function parseFormattedNumber(valString) {
    if (!valString) return 0;
    return parseFloat(valString.replace(/\./g, "")) || 0;
  }

  function formatNumberInput(val) {
    let raw = val.replace(/\D/g, "");
    if (raw) {
      return parseInt(raw, 10).toLocaleString('id-ID');
    }
    return "";
  }

  // Submit Buat Pesanan Baru
  async function createNewOrder() {
    if (!formKaryawanId || !formBarang) return;
    const titipan = parseFormattedNumber(formTitipanStr);
    
    const newOrd = {
      id: 'ord-' + Date.now(),
      karyawanId: formKaryawanId,
      barang: formBarang,
      titipan,
      realHarga: 0,
      kembalian: 0,
      status: 'BELUM_DIBELI',
      tanggal: new Date().toISOString()
    };

    await dbAddOrder(newOrd);
    await loadDataFromDexie();
    closeModal();
  }

  // Submit Daftar Karyawan Baru
  async function createNewEmployee() {
    if (!formEmpNama || !formEmpTel) return;
    const deposit = parseFormattedNumber(formEmpDepositStr);

    const empId = 'emp-' + Date.now();
    const newEmp = {
      id: empId,
      nama: formEmpNama,
      telepon: formEmpTel,
      deposit,
      hutang: 0
    };

    await dbAddEmployee(newEmp);

    // Catat mutasi kas jika ada setoran deposit awal
    if (deposit > 0) {
      const newLed = {
        id: 'led-' + Date.now(),
        karyawanId: empId,
        tipe: 'TOPUP',
        nominal: deposit,
        keterangan: 'Setoran Deposit Awal',
        lunas: true,
        tanggal: new Date().toISOString()
      };
      await db.ledger.put(newLed);
    }

    await loadDataFromDexie();
    closeModal();
  }

  // Selesaikan Transaksi Pembelian Kantin
  async function completeCanteenPurchase() {
    if (!selectedOrder) return;
    const realHarga = parseFormattedNumber(formRealHargaStr);
    
    selectedOrder.realHarga = realHarga;
    const emp = employees.find(e => e.id === selectedOrder.karyawanId);
    let newLed = null;

    if (selectedOrder.titipan === 0) {
      // Pembayaran talangan (Diberlakukan sebagai hutang)
      selectedOrder.status = 'SELESAI';
      if (emp) {
        emp.hutang += realHarga;
      }
      
      newLed = {
        id: 'led-' + Date.now(),
        karyawanId: selectedOrder.karyawanId,
        tipe: 'PESANAN',
        nominal: -realHarga,
        keterangan: 'Beli: ' + selectedOrder.barang,
        lunas: false,
        tanggal: new Date().toISOString()
      };
    } else {
      // Pembayaran tunai/cash
      const kembalian = selectedOrder.titipan - realHarga;
      selectedOrder.kembalian = kembalian;

      if (kembalian > 0) {
        selectedOrder.status = 'MENUNGGU_KEMBALIAN';
      } else if (kembalian < 0) {
        // Kekurangan cash dicatat sebagai hutang
        selectedOrder.status = 'SELESAI';
        const deficit = Math.abs(kembalian);
        if (emp) {
          emp.hutang += deficit;
        }

        newLed = {
          id: 'led-' + Date.now(),
          karyawanId: selectedOrder.karyawanId,
          tipe: 'PESANAN',
          nominal: -deficit,
          keterangan: `Kurang bayar cash: ${selectedOrder.barang} (Beli: Rp ${realHarga}, Titip: Rp ${selectedOrder.titipan})`,
          lunas: false,
          tanggal: new Date().toISOString()
        };
      } else {
        selectedOrder.status = 'SELESAI';
      }
    }

    // Update States & Sync DB
    await dbUpdateFinances(selectedOrder, emp, newLed);
    await loadDataFromDexie();
    closeModal();
  }

  // Konfirmasi Kembalian Cash Diberikan ke Karyawan
  async function handleReturnChange(event) {
    const ord = event.detail;
    const target = orders.find(o => o.id === ord.id);
    if (target) {
      target.status = 'SELESAI';
      await dbUpdateFinances(target, null, null);
      await loadDataFromDexie();
    }
  }

  // Proses Form Bayar / Top Up Manual
  async function submitPaymentOrTopup() {
    if (!selectedEmployee) return;
    const nominal = parseFormattedNumber(formPayNominalStr);
    if (nominal <= 0) return;

    let newLed = null;

    if (formPayType === 'TOPUP') {
      selectedEmployee.deposit += nominal;
      newLed = {
        id: 'led-' + Date.now(),
        karyawanId: selectedEmployee.id,
        tipe: 'TOPUP',
        nominal,
        keterangan: formPayKeterangan || 'Top Up Deposit Saldo',
        lunas: true,
        tanggal: new Date().toISOString()
      };
    } else if (formPayType === 'BAYAR_HUTANG') {
      selectedEmployee.hutang = Math.max(0, selectedEmployee.hutang - nominal);
      newLed = {
        id: 'led-' + Date.now(),
        karyawanId: selectedEmployee.id,
        tipe: 'TOPUP', // Nominal positif masuk ledger
        nominal,
        keterangan: formPayKeterangan || 'Pelunasan Bayar Hutang Talangan',
        lunas: true,
        tanggal: new Date().toISOString()
      };
    } else if (formPayType === 'POTONG_DEPOSIT') {
      // Potong saldo deposit untuk melunasi hutang talangan
      const cutAmount = Math.min(selectedEmployee.deposit, selectedEmployee.hutang, nominal);
      if (cutAmount > 0) {
        selectedEmployee.deposit -= cutAmount;
        selectedEmployee.hutang -= cutAmount;

        newLed = {
          id: 'led-' + Date.now(),
          karyawanId: selectedEmployee.id,
          tipe: 'PESANAN', // Nominal negatif untuk mutasi potong deposit
          nominal: -cutAmount,
          keterangan: 'Potong Deposit untuk Lunas Hutang',
          lunas: true,
          tanggal: new Date().toISOString()
        };
      }
    }

    await dbUpdateFinances(null, selectedEmployee, newLed);
    await loadDataFromDexie();
    closeModal();
  }

  // Generate template WhatsApp Billing
  function handleShareWA(event) {
    const emp = event.detail;
    // Hitung sisa kekurangan
    const netShortage = emp.hutang - emp.deposit;
    
    // Format item pesanan belum lunas
    const empOrders = orders.filter(o => o.karyawanId === emp.id && o.status === 'SELESAI');
    
    let itemsText = '';
    empOrders.forEach(o => {
      const cleanDate = new Date(o.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'});
      itemsText += `[${cleanDate}] Beli: ${o.barang} Rp${o.realHarga.toLocaleString('id-ID')}\n`;
    });

    const msg = `Berikut rincian tagihan Buku Saku OB:\n\n` +
                `${itemsText}` +
                `Total Hutang: Rp ${emp.hutang.toLocaleString('id-ID')}\n` +
                `Total Deposit: Rp ${emp.deposit.toLocaleString('id-ID')}\n` +
                `-----------------------------------\n` +
                `Sisa Kekurangan Bersih: Rp ${netShortage > 0 ? netShortage.toLocaleString('id-ID') : '0'}`;

    const waLink = `https://wa.me/${emp.telepon}?text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
  }

  // --- KALKULATOR TROLLEY MUTATORS ---
  async function handleAddToTrolley(event) {
    const item = event.detail;
    await db.shoppingList.put(item);
    await loadDataFromDexie();
  }

  async function handleRemoveFromTrolley(event) {
    const id = event.detail;
    await db.shoppingList.delete(id);
    await loadDataFromDexie();
  }

  async function handleCheckoutTrolley() {
    if (shoppingList.length === 0) return;
    const total = shoppingList.reduce((acc, i) => acc + (i.price * i.qty), 0);
    
    const newHistory = {
      id: 'hist-' + Date.now(),
      tanggal: new Date().toISOString(),
      total,
      items: shoppingList
    };

    await db.shoppingHistory.put(newHistory);
    await db.shoppingList.clear(); // Reset troli
    await loadDataFromDexie();
  }

  // --- ABSENSI MUTATORS ---
  async function handleCheckInOut(event) {
    const { isCheckOut } = event.detail;
    
    if (isCheckOut) {
      // Proses Check Out
      const todayISO = new Date().toISOString().substring(0, 10);
      const activeLog = attendanceLogs.find(l => new Date(l.checkIn).toISOString().substring(0, 10) === todayISO);
      if (activeLog) {
        activeLog.checkOut = new Date().toISOString();
        await db.attendanceLogs.put(activeLog);
      }
    } else {
      // Proses Check In
      const newLog = {
        id: 'log-' + Date.now(),
        checkIn: new Date().toISOString(),
        checkOut: null
      };
      await db.attendanceLogs.put(newLog);
    }

    await loadDataFromDexie();
  }

  function handleLogout() {
    localStorage.removeItem('ob_session');
    const event = new CustomEvent('logout');
    window.dispatchEvent(event);
  }
</script>

<div class="flex flex-col min-h-screen bg-slate-50 w-full relative">
  <!-- Header -->
  <Header 
    userName={user.nama}
    on:logout={handleLogout}
  />

  <!-- Main Scrollable Dashboard Content -->
  <div class="flex-grow overflow-y-auto px-5 py-6 flex flex-col min-h-0 pb-24 relative">
    {#if activeTab === 'orders'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <PesananTab 
          orders={orders}
          employees={employees}
          orderTabFilter={orderTabFilter}
          on:filter={(e) => orderTabFilter = e.detail}
          on:addOrder={() => openModal('addOrder')}
          on:completeOrder={(e) => openModal('completeOrder', e.detail)}
          on:returnChange={handleReturnChange}
        />
      </div>
    {:else if activeTab === 'cashbook'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <BukuKasTab 
          employees={employees}
          ledger={ledger}
          activeEmployeeId={activeEmployeeId}
          on:back={() => activeEmployeeId = null}
          on:selectEmployee={(e) => activeEmployeeId = e.detail}
          on:addEmployee={() => openModal('addEmployee')}
          on:shareWA={handleShareWA}
          on:payOrTopup={(e) => openModal('payOrTopup', e.detail)}
        />
      </div>
    {:else if activeTab === 'calculator'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <KalkulatorTab 
          shoppingList={shoppingList}
          shoppingBudget={shoppingBudget}
          belanjaTabFilter={belanjaTabFilter}
          shoppingHistory={shoppingHistory}
          on:filter={(e) => belanjaTabFilter = e.detail}
          on:addToTrolley={handleAddToTrolley}
          on:removeItem={handleRemoveFromTrolley}
          on:checkout={handleCheckoutTrolley}
          on:editBudget={() => openModal('editBudget')}
        />
      </div>
    {:else if activeTab === 'attendance'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <AbsensiTab 
          attendanceLogs={attendanceLogs}
          on:checkInOut={handleCheckInOut}
        />
      </div>
    {/if}
  </div>

  <!-- Floating Action Button (FAB) -->
  {#if activeTab === 'orders' || (activeTab === 'cashbook' && !activeEmployeeId)}
    <button 
      on:click={() => openModal(activeTab === 'orders' ? 'addOrder' : 'addEmployee')}
      class="absolute bottom-20 right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/30 active:scale-95 transition-all z-30 focus:outline-none"
    >
      <Plus class="w-7 h-7" />
    </button>
  {/if}

  <!-- Bottom Navigation Bar -->
  <BottomNav 
    activeTab={activeTab}
    on:select={(e) => { activeTab = e.detail; activeEmployeeId = null; }}
  />

  <!-- MODAL DIALOGS OVERLAYS (Svelte Custom Sheet Modal) -->
  {#if isModalOpen}
    <div class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center backdrop-blur-sm" on:click={closeModal}>
      <!-- Sheet Content Container -->
      <div 
        class="bg-white rounded-t-3xl w-full max-w-[480px] p-6 space-y-4 pb-10 shadow-2xl transform translate-y-0 transition-transform duration-300"
        on:click|stopPropagation
      >
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1"></div>
        
        {#if modalType === 'addOrder'}
          <!-- Form Buat Pesanan Baru -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Buat Pesanan Baru</h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3 pt-2">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Pilih Karyawan</label>
              <select bind:value={formKaryawanId} class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none">
                {#each employees as emp}
                  <option value={emp.id}>{emp.nama}</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Barang Pesanan</label>
              <input type="text" bind:value={formBarang} placeholder="Contoh: Nasi Goreng Gila" class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Uang Titipan Cash (Optional, Rp)</label>
              <input 
                type="text" 
                value={formTitipanStr} 
                on:input={(e) => formTitipanStr = formatNumberInput(e.target.value)} 
                placeholder="Masukkan jika bayar tunai di depan" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" 
              />
            </div>
            <button on:click={createNewOrder} class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 focus:outline-none">
              Buat Pesanan
            </button>
          </div>

        {:else if modalType === 'addEmployee'}
          <!-- Form Tambah Karyawan Baru -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Daftarkan Karyawan Baru</h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3 pt-2">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Nama Karyawan</label>
              <input type="text" bind:value={formEmpNama} placeholder="Nama Lengkap" class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">No. WhatsApp</label>
              <input type="tel" bind:value={formEmpTel} placeholder="62812345678" class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Setoran Deposit Awal (Optional, Rp)</label>
              <input 
                type="text" 
                value={formEmpDepositStr}
                on:input={(e) => formEmpDepositStr = formatNumberInput(e.target.value)}
                placeholder="Contoh: 100.000" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" 
              />
            </div>
            <button on:click={createNewEmployee} class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 focus:outline-none">
              Daftarkan Karyawan
            </button>
          </div>

        {:else if modalType === 'completeOrder'}
          <!-- Form input harga asli pasca beli dari kantin -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Selesaikan Pembelian</h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="bg-brand-50 p-3.5 rounded-xl border border-brand-100 space-y-1">
            <p class="text-xs font-bold text-slate-700">{selectedOrder.barang}</p>
            {#if selectedOrder.titipan > 0}
              <p class="text-[10px] text-brand-600 font-bold">Titipan Uang: Rp {selectedOrder.titipan.toLocaleString('id-ID')}</p>
            {/if}
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Harga Pembelian Asli (Rp)</label>
              <input 
                type="text" 
                value={formRealHargaStr} 
                on:input={(e) => formRealHargaStr = formatNumberInput(e.target.value)} 
                placeholder="Harga sesuai struk kantin" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold" 
              />
            </div>
            <button on:click={completeCanteenPurchase} class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-100 focus:outline-none">
              Beli & Konfirmasi
            </button>
          </div>

        {:else if modalType === 'payOrTopup'}
          <!-- Form TopUp, Bayar Talangan, Potong Deposit -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Bayar / Top Up Saldo</h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Tipe Transaksi</label>
              <select bind:value={formPayType} class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none">
                <option value="TOPUP">Top Up Deposit Baru</option>
                <option value="BAYAR_HUTANG">Bayar Hutang Talangan</option>
                {#if selectedEmployee.deposit > 0 && selectedEmployee.hutang > 0}
                  <option value="POTONG_DEPOSIT">Potong Deposit untuk Hutang</option>
                {/if}
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Nominal Transaksi (Rp)</label>
              <input 
                type="text" 
                value={formPayNominalStr} 
                on:input={(e) => formPayNominalStr = formatNumberInput(e.target.value)} 
                placeholder="Masukkan nominal" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold" 
              />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Keterangan Tambahan</label>
              <input type="text" bind:value={formPayKeterangan} placeholder="Contoh: Bayar lunas Nasi Uduk" class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" />
            </div>
            <button on:click={submitPaymentOrTopup} class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 focus:outline-none">
              Simpan Transaksi
            </button>
          </div>
          
        {:else if modalType === 'editBudget'}
          <!-- Form Edit Budget Limit Belanja -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Ubah Limit Budget Belanja</h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Batas Budget Baru (Rp)</label>
              <input 
                type="text" 
                value={formBudgetStr} 
                on:input={(e) => formBudgetStr = formatNumberInput(e.target.value)} 
                placeholder="Contoh: 1.000.000" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold text-center text-lg" 
              />
            </div>
            <button 
              on:click={() => {
                const limit = parseFormattedNumber(formBudgetStr);
                if (limit > 0) {
                  localStorage.setItem('ob_budget', limit.toString());
                  shoppingBudget = limit;
                }
                closeModal();
              }} 
              class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 focus:outline-none"
            >
              Simpan Batas Limit
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
