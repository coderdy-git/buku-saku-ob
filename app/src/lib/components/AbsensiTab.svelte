<script>
  import { createEventDispatcher } from 'svelte';
  // Import Icon resmi Lucide
  import { Fingerprint } from '@lucide/svelte';
  
  const dispatch = createEventDispatcher();
  
  export let attendanceLogs = [];

  let dateFilter = new Date().toISOString().substring(0, 7); // Default bulan aktif saat ini (YYYY-MM)
  let isCheckedIn = false;
  let loading = false;

  // Cek status hari ini
  $: todayStr = new Date().toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'});
  $: todayLog = attendanceLogs.find(log => {
    const logDate = new Date(log.checkIn).toISOString().substring(0, 10);
    const todayISO = new Date().toISOString().substring(0, 10);
    return logDate === todayISO;
  });
  
  $: {
    if (todayLog) {
      isCheckedIn = todayLog.checkIn && !todayLog.checkOut;
    } else {
      isCheckedIn = false;
    }
  }

  // Filter logs berdasarkan bulan terpilih
  $: filteredLogs = attendanceLogs.filter(log => {
    const logMonth = new Date(log.checkIn).toISOString().substring(0, 7);
    return logMonth === dateFilter;
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  function handleCheckInOut() {
    loading = true;
    setTimeout(() => {
      loading = false;
      dispatch('checkInOut', { isCheckOut: isCheckedIn });
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
      on:click={handleCheckInOut}
      disabled={loading}
      class="w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 relative focus:outline-none 
      {loading ? 'bg-slate-100' : isCheckedIn ? 'bg-amber-50 hover:bg-amber-100 text-amber-500 shadow-lg shadow-amber-50' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 shadow-lg shadow-indigo-50'}"
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
      {#if isCheckedIn}
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
    <div class="flex justify-between items-center px-1">
      <h5 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">RIWAYAT ABSENSI BULANAN</h5>
      <input 
        type="month" 
        bind:value={dateFilter}
        class="bg-white border border-slate-200 text-xs px-2 py-1 rounded-lg font-semibold text-slate-700 focus:outline-none font-sans"
      />
    </div>

    <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
      {#if filteredLogs.length === 0}
        <p class="text-xs text-slate-400 text-center py-8">Belum ada catatan absensi di bulan ini.</p>
      {:else}
        {#each filteredLogs as log (log.id)}
          <div class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-slate-800">
                {new Date(log.checkIn).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
              </span>
              <div class="flex gap-4 mt-1 text-[9px] text-slate-400 font-semibold font-mono">
                <span>In: {new Date(log.checkIn).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace('.', ':')}</span>
                <span>Out: {log.checkOut ? new Date(log.checkOut).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace('.', ':') : '--:--'}</span>
              </div>
            </div>
            
            <span class="px-2 py-0.5 text-[9px] font-bold rounded {log.checkOut ? 'bg-slate-50 text-slate-500' : 'bg-amber-50 text-amber-700'}">
              {log.checkOut ? 'Lengkap' : 'Aktif'}
            </span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
