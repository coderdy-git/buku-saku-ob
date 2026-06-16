<script>
  // Import Icon resmi Lucide
  import { Share2, ChevronLeft, Users, Plus } from '@lucide/svelte';
  
  let { employees = [], activeEmployeeId = null, ledger = [], onback, onselectemployee, onaddemployee, onsharewa, onpayortopup } = $props();

  let selectedEmp = $derived(employees.find(e => e.id === activeEmployeeId));
  let empLedger = $derived(ledger.filter(l => l.karyawanId === activeEmployeeId).sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)));

  function getNetBalance(emp) {
    return emp.deposit - emp.hutang;
  }
</script>

{#if activeEmployeeId && selectedEmp}
  <!-- DETAIL VIEW LEDGER KARYAWAN -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <button onclick={() => onback?.()} class="flex items-center text-slate-500 hover:text-slate-800 transition-colors py-1.5 focus:outline-none">
        <ChevronLeft class="w-4.5 h-4.5 mr-0.5" />
        <span class="text-xs font-semibold">Kembali</span>
      </button>

      <button 
        onclick={() => onsharewa?.(selectedEmp)}
        class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 focus:outline-none"
      >
        <Share2 class="w-3.5 h-3.5" /> Kirim Tagihan WA
      </button>
    </div>

    <!-- Info Karyawan Detail Card -->
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div>
        <h4 class="font-extrabold text-slate-900 text-base">{selectedEmp.nama}</h4>
        <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedEmp.telepon}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/60">
        <div class="bg-emerald-50/40 p-3 rounded-xl border border-emerald-50 text-center">
          <span class="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">Deposit Aktif</span>
          <span class="text-sm font-extrabold text-emerald-700 block mt-1 font-mono">Rp {selectedEmp.deposit.toLocaleString('id-ID')}</span>
        </div>
        <div class="bg-red-50/40 p-3 rounded-xl border border-red-50 text-center">
          <span class="text-[9px] font-bold text-red-500 block uppercase tracking-wider">Hutang Talangan</span>
          <span class="text-sm font-extrabold text-red-700 block mt-1 font-mono">Rp {selectedEmp.hutang.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <!-- Defisit bersih -->
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-semibold">
        <span class="text-slate-500">Sisa Kekurangan Bersih:</span>
        <span class="font-bold font-mono {getNetBalance(selectedEmp) < 0 ? 'text-red-600' : 'text-emerald-700'}">
          Rp {Math.abs(getNetBalance(selectedEmp)).toLocaleString('id-ID')}
        </span>
      </div>

      <div class="flex gap-2">
        <button 
          onclick={() => onpayortopup?.(selectedEmp)}
          class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-100 transition-all focus:outline-none"
        >
          Bayar / Top Up
        </button>
      </div>
    </div>

    <!-- Riwayat Transaksi Ledger -->
    <div>
      <h5 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">MUTASI TRANSAKSI KAS</h5>
      <div class="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {#if empLedger.length === 0}
          <p class="text-xs text-slate-400 text-center py-6">Belum ada mutasi kas untuk karyawan ini.</p>
        {:else}
          {#each empLedger as item (item.id)}
            <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate">{item.keterangan}</p>
                <span class="text-[9px] text-slate-400 font-semibold block mt-0.5">
                  {new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).replace('.', ':')}
                </span>
              </div>
              <div class="text-right shrink-0 flex flex-col items-end gap-1">
                <span class="text-xs font-bold font-mono {item.nominal < 0 ? 'text-red-500' : 'text-emerald-600'}">
                  {item.nominal < 0 ? '-' : '+'}{Math.abs(item.nominal).toLocaleString('id-ID')}
                </span>
                {#if item.lunas}
                  <span class="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">✓ Lunas</span>
                {:else}
                  <span class="px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded">○ Belum Lunas</span>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- LIST DIRECTORY VIEW KARYAWAN -->
  <div class="flex flex-col gap-3">
    {#if employees.length === 0}
      <div class="flex flex-col items-center justify-center text-center py-16 px-4 space-y-3">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Users class="w-8 h-8" />
        </div>
        <div>
          <h4 class="font-extrabold text-slate-800 text-sm">Belum Ada Karyawan</h4>
          <p class="text-xs text-slate-400 max-w-[200px] mt-1">Daftarkan karyawan baru terlebih dahulu.</p>
        </div>
        <button 
          onclick={() => onaddemployee?.()}
          class="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-100 flex items-center gap-1.5 focus:outline-none"
        >
          <Plus class="w-4 h-4" /> Tambah Karyawan
        </button>
      </div>
    {:else}
      {#each employees as emp (emp.id)}
        <button 
          onclick={() => onselectemployee?.(emp.id)}
          class="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-brand-200 active:scale-[0.99] transition-all flex justify-between items-center gap-3 focus:outline-none"
        >
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-slate-900 truncate">{emp.nama}</h4>
            <div class="flex gap-2.5 mt-1 font-mono text-[9px] font-bold text-slate-400">
              <span class="text-emerald-600">Dep: Rp {emp.deposit.toLocaleString('id-ID')}</span>
              <span class="text-red-500">Hut: Rp {emp.hutang.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            {#if getNetBalance(emp) === 0}
              <span class="px-2 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100 rounded">Lunas</span>
            {:else if getNetBalance(emp) > 0}
              <span class="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded">Surplus</span>
            {:else}
              <span class="px-2 py-0.5 text-[9px] font-bold bg-red-50 text-red-800 border border-red-100 rounded">Kurang Rp {Math.abs(getNetBalance(emp)).toLocaleString('id-ID')}</span>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
{/if}
