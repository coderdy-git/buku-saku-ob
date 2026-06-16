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
  import { addToast, confirmAction } from '../uiStore.svelte.js';

  // Import Database Offline-First & Sync Engine
  import { db } from '../db';
  import { 
    dbAddEmployee, 
    dbAddOrder, 
    dbUpdateFinances, 
    runFullSync,
    isOnline
  } from '../dbHelper';
  import { capitalizeWords } from '../utils.js';

  let { user = { nama: 'Operator', telepon: '', verified: true }, showInstallBtn = false, oninstallpwa } = $props();
  
  let activeTab = $state('orders'); // orders | cashbook | calculator | attendance
  let orderTabFilter = $state('belum'); // belum | selesai
  let belanjaTabFilter = $state('troli'); // troli | riwayat
  let activeEmployeeId = $state(null);

  // Databases (Reactive state dari IndexedDB)
  let employees = $state([]);
  let orders = $state([]);
  let ledger = $state([]);
  let shoppingList = $state([]);
  let shoppingHistory = $state([]);
  let attendanceLogs = $state([]);
  let shoppingBudget = $state(500000);

  // Modal State
  let isModalOpen = $state(false);
  let modalType = $state(''); // addOrder | addEmployee | payOrTopup | completeOrder
  let selectedOrder = $state(null);
  let selectedEmployee = $state(null);

  // Modal Form Fields
  let formKaryawanId = $state('');
  let formBarang = $state('');
  let formTitipanStr = $state('');
  let formEmpNama = $state('');
  let formEmpTel = $state('');
  let formEmpDepositStr = $state('');
  let formRealHargaStr = $state('');
  let formPayNominalStr = $state('');
  let formPayKeterangan = $state('');
  let formBudgetStr = $state('');

  // Loading State for Buttons
  let isProcessing = $state(false);

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
    isProcessing = false;
    
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
    isProcessing = false;
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
    isProcessing = true;
    try {
      const titipan = parseFormattedNumber(formTitipanStr);
      
      const newOrd = {
        id: 'ord-' + Date.now(),
        karyawanId: formKaryawanId,
        barang: capitalizeWords(formBarang),
        titipan,
        realHarga: 0,
        kembalian: 0,
        status: 'BELUM_DIBELI',
        tanggal: new Date().toISOString()
      };

      await dbAddOrder(newOrd);
      await loadDataFromDexie();
      closeModal();
      addToast('Pesanan berhasil dibuat!', 'success');
    } finally {
      isProcessing = false;
    }
  }

  // Submit Daftar Karyawan Baru
  async function createNewEmployee() {
    if (!formEmpNama || !formEmpTel) return;
    isProcessing = true;
    try {
      const deposit = parseFormattedNumber(formEmpDepositStr);

      const empId = 'emp-' + Date.now();
      const newEmp = {
        id: empId,
        nama: capitalizeWords(formEmpNama),
        telepon: formEmpTel,
        deposit,
        hutang: 0
      };

      await dbAddEmployee(newEmp);

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
      addToast('Karyawan baru berhasil ditambahkan', 'success');
    } finally {
      isProcessing = false;
    }
  }

  // Selesaikan Transaksi Pembelian Kantin
  async function completeCanteenPurchase() {
    if (!selectedOrder) return;
    isProcessing = true;
    try {
      const realHarga = parseFormattedNumber(formRealHargaStr);
      
      selectedOrder.realHarga = realHarga;
      const emp = employees.find(e => e.id === selectedOrder.karyawanId);
      let newLed = null;

      if (selectedOrder.titipan === 0) {
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
        const kembalian = selectedOrder.titipan - realHarga;
        selectedOrder.kembalian = kembalian;

        if (kembalian > 0) {
          selectedOrder.status = 'MENUNGGU_KEMBALIAN';
        } else if (kembalian < 0) {
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

      await dbUpdateFinances(selectedOrder, emp, newLed);
      await loadDataFromDexie();
      closeModal();
      addToast('Pembelian berhasil diselesaikan', 'success');
    } finally {
      isProcessing = false;
    }
  }

  // Konfirmasi Kembalian Cash Diberikan ke Karyawan
  async function handleReturnChange(orderData) {
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

    isProcessing = true;
    try {
      let sisaUang = nominal;
      const hutangAwal = selectedEmployee.hutang;
      
      if (selectedEmployee.hutang > 0) {
        const bayarHutang = Math.min(selectedEmployee.hutang, sisaUang);
        selectedEmployee.hutang -= bayarHutang;
        sisaUang -= bayarHutang;
      }

      if (sisaUang > 0) {
        selectedEmployee.deposit += sisaUang;
      }

      let ket = formPayKeterangan;
      if (!ket) {
        if (hutangAwal > 0 && sisaUang > 0) {
          ket = 'Lunas Hutang + Deposit';
        } else if (hutangAwal > 0) {
          ket = 'Bayar Hutang';
        } else {
          ket = 'Isi Deposit';
        }
      }

      const newLed = {
        id: 'led-' + Date.now(),
        karyawanId: selectedEmployee.id,
        tipe: 'TOPUP',
        nominal,
        keterangan: ket,
        lunas: true,
        tanggal: new Date().toISOString()
      };

      await dbUpdateFinances(null, selectedEmployee, newLed);
      await loadDataFromDexie();
      closeModal();
      addToast('Transaksi berhasil disimpan', 'success');
    } finally {
      isProcessing = false;
    }
  }

  // Generate template WhatsApp Billing
  function handleShareWA(empData) {
    const emp = empData;
    // Hitung sisa kekurangan
    const netShortage = emp.hutang - emp.deposit;
    
    // Format item pesanan belum lunas
    const empOrders = orders.filter(o => o.karyawanId === emp.id && o.status === 'SELESAI');
    
    let itemsText = '';
    empOrders.forEach(o => {
      const cleanDate = new Date(o.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'});
      itemsText += `[${cleanDate}] Beli: ${o.barang} Rp${o.realHarga.toLocaleString('id-ID')}\n`;
    });

    const msg = `*Rincian Tagihan:*\n\n` +
                `${itemsText}` +
                `Total Hutang: Rp ${emp.hutang.toLocaleString('id-ID')}\n` +
                `Total Deposit: Rp ${emp.deposit.toLocaleString('id-ID')}\n` +
                `-----------------------------------\n` +
                `*Sisa Kekurangan Bersih: Rp ${netShortage > 0 ? netShortage.toLocaleString('id-ID') : '0'}*`;

    const waLink = `https://wa.me/${emp.telepon}?text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
  }

  // --- KALKULATOR TROLLEY MUTATORS ---
  async function handleAddToTrolley(itemData) {
    const item = JSON.parse(JSON.stringify(event.detail));
    await db.shoppingList.put(item);
    await loadDataFromDexie();
    addToast('Item ditambahkan ke Troli', 'success');
  }

  async function handleRemoveFromTrolley(itemId) {
    const id = itemId;
    await db.shoppingList.delete(id);
    await loadDataFromDexie();
    addToast('Item dihapus dari Troli', 'success');
  }

  function handleCheckoutTrolley() {
    if (shoppingList.length === 0) return;
    confirmAction('Selesaikan Belanja ATK?', 'Troli akan dikosongkan dan disimpan ke Riwayat.', async () => {
      const total = shoppingList.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const newHistory = {
        id: 'hist-' + Date.now(),
        tanggal: new Date().toISOString(),
        total,
        items: JSON.parse(JSON.stringify(shoppingList))
      };
      await db.shoppingHistory.put(newHistory);
      await db.shoppingList.clear();
      await loadDataFromDexie();
      addToast('Belanja selesai!', 'success');
    }, 'Ya, Selesai', 'Batal');
  }

  // --- ABSENSI MUTATORS ---
  async function handleCheckInOut(statusObj) {
    const { isCheckOut } = statusObj;
    const todayISO = new Date().toISOString().substring(0, 10);
    
    // Ambil log terakhir hari ini
    const todayLogs = attendanceLogs.filter(l => new Date(l.checkIn).toISOString().substring(0, 10) === todayISO);
    const activeLog = todayLogs.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))[0];
    
    if (isCheckOut) {
      // Proses Check Out
      if (activeLog) {
        activeLog.checkOut = new Date().toISOString();
        await db.attendanceLogs.put(JSON.parse(JSON.stringify(activeLog)));
      }
    } else {
      // Proses Check In - Validasi Hanya Boleh 1x Sehari (Bypass di Dev)
      if (activeLog && activeLog.checkOut && !import.meta.env.DEV) {
         addToast('Anda sudah melakukan absensi hari ini!', 'error');
         return;
      }

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
  import { supabase } from '../supabaseClient.js';

  async function handleDevWipe() {
    if (!import.meta.env.DEV) return;
    
    confirmAction('Reset Semua Data?', 'Ini hanya untuk DEV. Semua Karyawan, Pesanan, Buku Kas, dll akan dihapus dari Supabase.', async () => {
      // 1. Wipe Supabase (RLS automatically restricts it to this user's operator_id)
      await supabase.from('employees').delete().neq('id', 'dummy');
      await supabase.from('shopping_history').delete().neq('id', 'dummy');
      await supabase.from('attendance_logs').delete().neq('id', 'dummy');
      
      // 2. Wipe Local Dexie
      await db.employees.clear();
      await db.orders.clear();
      await db.ledger.clear();
      await db.shoppingHistory.clear();
      await db.attendanceLogs.clear();
      await db.shoppingList.clear();
      
      // 3. Reload Page
      window.location.reload();
    }, 'Ya, Hapus', 'Batal');
  }
</script>

<div class="flex flex-col min-h-screen bg-slate-50 w-full relative">
  <!-- Header -->
  <Header 
    userName={user.nama}
    showInstallBtn={showInstallBtn}
    oninstallpwa={() => oninstallpwa?.()}
    onlogout={handleLogout}
    ondevwipe={handleDevWipe}
  />

  <!-- Main Scrollable Dashboard Content -->
  <div class="flex-grow overflow-y-auto px-5 py-6 flex flex-col min-h-0 pb-24 relative">
    {#if activeTab === 'orders'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <PesananTab 
          orders={orders}
          employees={employees}
          orderTabFilter={orderTabFilter}
          onfilter={(val) => orderTabFilter = val}
          onaddorder={() => openModal('addOrder')}
          oncompleteorder={(val) => openModal('completeOrder', val)}
          onreturnchange={handleReturnChange}
        />
      </div>
    {:else if activeTab === 'cashbook'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <BukuKasTab 
          employees={employees}
          ledger={ledger}
          activeEmployeeId={activeEmployeeId}
          onback={() => activeEmployeeId = null}
          onselectemployee={(val) => activeEmployeeId = val}
          onaddemployee={() => openModal('addEmployee')}
          onsharewa={handleShareWA}
          onpayortopup={(val) => openModal('payOrTopup', val)}
        />
      </div>
    {:else if activeTab === 'calculator'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <KalkulatorTab 
          shoppingList={shoppingList}
          shoppingBudget={shoppingBudget}
          belanjaTabFilter={belanjaTabFilter}
          shoppingHistory={shoppingHistory}
          onfilter={(val) => belanjaTabFilter = val}
          onaddtotrolley={handleAddToTrolley}
          onremoveitem={handleRemoveFromTrolley}
          oncheckout={handleCheckoutTrolley}
          oneditbudget={() => openModal('editBudget')}
        />
      </div>
    {:else if activeTab === 'attendance'}
      <div in:fade={{ duration: 150 }} class="flex flex-col flex-grow">
        <AbsensiTab 
          attendanceLogs={attendanceLogs}
          oncheckinout={handleCheckInOut}
        />
      </div>
    {/if}
  </div>

  <!-- Floating Action Button (FAB) -->
  {#if activeTab === 'orders' || (activeTab === 'cashbook' && !activeEmployeeId)}
    <button 
      onclick={() => openModal(activeTab === 'orders' ? 'addOrder' : 'addEmployee')}
      class="absolute bottom-20 right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/30 active:scale-95 transition-all z-30 focus:outline-none"
    >
      <Plus class="w-7 h-7" />
    </button>
  {/if}

  <!-- Bottom Navigation Bar -->
  <BottomNav 
    activeTab={activeTab}
    onselect={(val) => { activeTab = val; activeEmployeeId = null; }}
  />

  <!-- MODAL DIALOGS OVERLAYS (Svelte Custom Sheet Modal) -->
  {#if isModalOpen}
    <div class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center backdrop-blur-sm" onclick={closeModal}>
      <!-- Sheet Content Container -->
      <div 
        class="bg-white rounded-t-3xl w-full max-w-[480px] p-6 space-y-4 pb-10 shadow-2xl transform translate-y-0 transition-transform duration-300"
        onclick={(e) => { e.stopPropagation(); }}
      >
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1"></div>
        
        {#if modalType === 'addOrder'}
          <!-- Form Buat Pesanan Baru -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Buat Pesanan Baru</h3>
            <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
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
                oninput={(e) => formTitipanStr = formatNumberInput(e.target.value)} 
                placeholder="Masukkan jika bayar tunai di depan" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" 
              />
            </div>
            <button onclick={createNewOrder} disabled={isProcessing} class="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 flex justify-center items-center gap-2 focus:outline-none">
              {#if isProcessing}
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              {:else}
                Buat Pesanan
              {/if}
            </button>
          </div>

        {:else if modalType === 'addEmployee'}
          <!-- Form Tambah Karyawan Baru -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Daftarkan Karyawan Baru</h3>
            <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
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
                oninput={(e) => formEmpDepositStr = formatNumberInput(e.target.value)}
                placeholder="Contoh: 100.000" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" 
              />
            </div>
            <button onclick={createNewEmployee} disabled={isProcessing} class="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 flex justify-center items-center gap-2 focus:outline-none">
              {#if isProcessing}
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              {:else}
                Daftarkan Karyawan
              {/if}
            </button>
          </div>

        {:else if modalType === 'completeOrder'}
          <!-- Form input harga asli pasca beli dari kantin -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Selesaikan Pembelian</h3>
            <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
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
                oninput={(e) => formRealHargaStr = formatNumberInput(e.target.value)} 
                placeholder="Harga sesuai struk kantin" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold" 
              />
            </div>
            <button onclick={completeCanteenPurchase} disabled={isProcessing} class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-100 flex justify-center items-center gap-2 focus:outline-none">
              {#if isProcessing}
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              {:else}
                Beli & Konfirmasi
              {/if}
            </button>
          </div>

        {:else if modalType === 'payOrTopup'}
          <!-- Form TopUp, Bayar Talangan, Potong Deposit -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Bayar / Top Up Saldo</h3>
            <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Nominal Transaksi (Rp)</label>
              <input 
                type="text" 
                value={formPayNominalStr} 
                oninput={(e) => formPayNominalStr = formatNumberInput(e.target.value)} 
                placeholder="Masukkan nominal" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold" 
              />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Keterangan Tambahan</label>
              <input type="text" bind:value={formPayKeterangan} placeholder="Contoh: Bayar lunas Nasi Uduk" class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none" />
            </div>
            <button onclick={submitPaymentOrTopup} disabled={isProcessing} class="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 flex justify-center items-center gap-2 focus:outline-none">
              {#if isProcessing}
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              {:else}
                Simpan Transaksi
              {/if}
            </button>
          </div>
          
        {:else if modalType === 'editBudget'}
          <!-- Form Edit Budget Limit Belanja -->
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-sm">Ubah Limit Budget Belanja</h3>
            <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-slate-400 block mb-1">Batas Budget Baru (Rp)</label>
              <input 
                type="text" 
                value={formBudgetStr} 
                oninput={(e) => formBudgetStr = formatNumberInput(e.target.value)} 
                placeholder="Contoh: 1.000.000" 
                class="w-full p-2.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none font-bold text-center text-lg" 
              />
            </div>
            <button 
              onclick={() => {
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
