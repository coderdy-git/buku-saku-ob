<script>
  // Import Icon resmi Lucide
  import { Fingerprint, Calendar } from '@lucide/svelte';
  import { generateId } from '../utils.js';
  
  let { attendanceLogs = [], oncheckinout } = $props();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let startDate = $state(firstDay.toISOString().substring(0, 10)); // YYYY-MM-DD
  let endDate = $state(today.toISOString().substring(0, 10)); // YYYY-MM-DD
  let showFilterModal = $state(false);

  let isCheckedIn = $state(false);
  let loading = $state(false);

  // Cek status hari ini
  let todayStr = $derived(new Date().toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'}));
  let todayLog = $derived(
    attendanceLogs
      .filter(log => new Date(log.checkIn).toISOString().substring(0, 10) === new Date().toISOString().substring(0, 10))
      .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))[0]
  );
  
  let isCompletedToday = $derived(!!(todayLog && todayLog.checkOut));
  
  $effect(() => {
    if (todayLog) {
      isCheckedIn = todayLog.checkIn && !todayLog.checkOut;
    } else {
      isCheckedIn = false;
    }
  });

  // Filter logs berdasarkan rentang tanggal
  let filteredLogs = $derived(attendanceLogs.filter(log => {
    const logDate = new Date(log.checkIn).toISOString().substring(0, 10);
    return logDate >= startDate && logDate <= endDate;
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn)));

  function handleCheckInOut() {
    loading = true;
    setTimeout(() => {
      loading = false;
      oncheckinout?.({ isCheckOut: isCheckedIn });
    }, 1500); // Simulasi verifikasi sidik jari/sensor 1.5 detik
  }
</script>

<div class="space-y-6">
  <!-- Interactive Fingerprint Button Card -->
  <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
    <div>
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{todayStr}</span>
      <h4 class="text-sm font-extrabold text-slate-800 mt-0.5">Absen Fingerprint Mandiri</h4>
    </div>

    <!-- Scanner Trigger -->
    <button 
      onclick={handleCheckInOut}
      disabled={loading || (isCompletedToday && !import.meta.env.DEV)}
      class="w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 relative focus:outline-none 
      {loading ? 'bg-slate-100' : isCompletedToday ? 'bg-emerald-50 text-emerald-500 shadow-lg shadow-emerald-50' : isCheckedIn ? 'bg-amber-50 hover:bg-amber-100 text-amber-500 shadow-lg shadow-amber-50' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 shadow-lg shadow-indigo-50'}"
    >
      {#if loading}
        <!-- Loading Spinner -->
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else}
        <!-- Fingerprint Icon -->
        <Fingerprint class="w-10 h-10" />
      {/if}
    </button>

    <div class="text-xs">
      {#if isCompletedToday}
        <span class="text-emerald-600 font-bold">Status: Tugas Selesai</span>
        <p class="text-[10px] text-slate-400 mt-1">Anda sudah menyelesaikan absen hari ini.</p>
      {:else if isCheckedIn}
        <span class="text-amber-600 font-bold">Status: Aktif Bekerja (Check In)</span>
        <p class="text-[10px] text-slate-400 mt-1">Tekan untuk melakukan Check Out</p>
      {:else}
        <span class="text-indigo-600 font-bold font-sans">Status: Belum Check In</span>
        <p class="text-[10px] text-slate-400 mt-1">Tekan untuk melakukan kehadiran pagi.</p>
      {/if}
    </div>
  </div>

  <!-- History Logs Card -->
  <div class="space-y-3">
    <div class="flex justify-between items-center px-1 mb-1">
      <div class="flex flex-col gap-0.5">
        <h5 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">RIWAYAT ABSENSI</h5>
        <span class="text-[9px] font-bold text-indigo-500">
          {new Date(startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} 
          - 
          {new Date(endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
        </span>
      </div>
      <button 
        onclick={() => showFilterModal = true}
        class="flex items-center gap-1.5 bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm focus:outline-none"
      >
        <Calendar class="w-3.5 h-3.5" />
        Filter Tgl
      </button>
    </div>

    <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
      {#if filteredLogs.length === 0}
        <p class="text-xs text-slate-400 text-center py-8">Belum ada catatan absensi di bulan ini.</p>
      {:else}
        {#each filteredLogs as log (log.id)}
          <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <!-- Calendar Box -->
              <div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                <span class="text-lg font-extrabold text-indigo-700 leading-none">
                  {new Date(log.checkIn).toLocaleDateString('id-ID', {day: 'numeric'})}
                </span>
                <span class="text-[9px] font-bold text-indigo-500 uppercase mt-0.5">
                  {new Date(log.checkIn).toLocaleDateString('id-ID', {month: 'short'})}
                </span>
              </div>
              
              <!-- Info Hari & Status -->
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-bold text-slate-800">
                  {new Date(log.checkIn).toLocaleDateString('id-ID', {weekday: 'long'})}
                </span>
                <span class="text-[9px] font-bold {log.checkOut ? 'text-slate-400' : 'text-amber-600'}">
                  {log.checkOut ? 'Selesai' : 'Sedang Aktif'}
                </span>
              </div>
            </div>
            
            <!-- IN / OUT Inline Badges -->
            <div class="flex gap-1.5 shrink-0">
              <div class="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                <span class="text-[9px] font-extrabold text-slate-400">IN</span>
                <span class="text-xs font-bold font-mono text-indigo-600 tracking-tight">{new Date(log.checkIn).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace('.', ':')}</span>
              </div>
              <div class="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                <span class="text-[9px] font-extrabold text-slate-400">OUT</span>
                <span class="text-xs font-bold font-mono text-rose-500 tracking-tight">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace('.', ':') : '--:--'}</span>
              </div>


            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<!-- MODAL FILTER RENTANG TANGGAL -->
{#if showFilterModal}
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center" onclick={() => showFilterModal = false}>
    <div 
      class="bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-10 shadow-2xl transform translate-y-0 transition-transform duration-300 space-y-4"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1"></div>
      <div class="flex justify-between items-center">
        <h3 class="font-extrabold text-slate-900 text-sm">Filter Rentang Absensi</h3>
        <button onclick={() => showFilterModal = false} class="text-slate-400 hover:text-slate-600 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div class="space-y-3 pt-2">
        <div>
          <label class="text-[10px] font-bold text-slate-400 block mb-1">Dari Tanggal</label>
          <input type="date" bind:value={startDate} class="w-full p-3 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none font-sans font-bold text-slate-700" />
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 block mb-1">Sampai Tanggal</label>
          <input type="date" bind:value={endDate} class="w-full p-3 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none font-sans font-bold text-slate-700" />
        </div>
        
        <button 
          onclick={() => showFilterModal = false} 
          class="w-full py-3.5 mt-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-100 focus:outline-none"
        >
          Terapkan Filter
        </button>
      </div>
    </div>
  </div>
{/if}
