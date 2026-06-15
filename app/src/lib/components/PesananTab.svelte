<script>
  import { createEventDispatcher } from 'svelte';
  // Import Icon resmi Lucide
  import { ClipboardX, Plus, Check } from '@lucide/svelte';
  
  const dispatch = createEventDispatcher();
  
  export let orders = [];
  export let employees = [];
  export let orderTabFilter = 'belum'; // belum | selesai

  $: listData = orderTabFilter === 'belum' 
    ? orders.filter(o => o.status === 'BELUM_DIBELI' || o.status === 'MENUNGGU_KEMBALIAN')
    : orders.filter(o => o.status === 'SELESAI');

  function getEmployeeName(karyawanId) {
    const emp = employees.find(e => e.id === karyawanId);
    return emp ? emp.nama : 'Unknown';
  }
</script>

<!-- Filter Tabs -->
<div class="flex bg-slate-200 p-0.5 rounded-xl text-xs font-bold text-slate-500 mb-4">
  <button 
    on:click={() => dispatch('filter', 'belum')} 
    class="flex-1 py-2 rounded-lg transition-all {orderTabFilter === 'belum' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-800'}"
  >
    Belum Dibeli ({orders.filter(o => o.status === 'BELUM_DIBELI' || o.status === 'MENUNGGU_KEMBALIAN').length})
  </button>
  <button 
    on:click={() => dispatch('filter', 'selesai')} 
    class="flex-1 py-2 rounded-lg transition-all {orderTabFilter === 'selesai' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-800'}"
  >
    Selesai ({orders.filter(o => o.status === 'SELESAI').length})
  </button>
</div>

<!-- Order List -->
<div class="flex flex-col gap-3">
  {#if listData.length === 0}
    <!-- Empty State -->
    <div class="flex flex-col items-center justify-center text-center py-16 px-4 space-y-3">
      <div class="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
        <ClipboardX class="w-8 h-8" />
      </div>
      <div>
        <h4 class="font-extrabold text-slate-800 text-sm">Belum Ada Pesanan</h4>
        <p class="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
          Daftar pesanan dengan status "{orderTabFilter === 'belum' ? 'Belum Dibeli / Selesai Belum Lunas' : 'Selesai'}" masih kosong.
        </p>
      </div>
      {#if orderTabFilter === 'belum'}
        <button 
          on:click={() => dispatch('addOrder')}
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold transition shadow-md shadow-indigo-100 flex items-center gap-1.5 focus:outline-none hover:bg-indigo-700"
        >
          <Plus class="w-4 h-4" /> Buat Pesanan
        </button>
      {/if}
    </div>
  {:else}
    {#each listData as ord (ord.id)}
      {#if ord.status === 'BELUM_DIBELI'}
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-sm text-slate-900">{ord.barang}</h4>
              <p class="text-[10px] text-slate-500 mt-0.5 font-medium">Pemesan: <span class="font-semibold text-slate-700">{getEmployeeName(ord.karyawanId)}</span></p>
            </div>
            <span class="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-md">Belum Dibeli</span>
          </div>
          {#if ord.titipan > 0}
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-semibold flex justify-between">
              <span>Titipan Uang Cash:</span>
              <span>Rp {ord.titipan.toLocaleString('id-ID')}</span>
            </div>
          {/if}
          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button 
              on:click={() => dispatch('completeOrder', ord)} 
              class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all focus:outline-none"
            >
              Beli & Selesai
            </button>
          </div>
        </div>
      {:else if ord.status === 'MENUNGGU_KEMBALIAN'}
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex flex-col gap-2.5">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-sm text-slate-900">{ord.barang}</h4>
              <p class="text-[10px] text-slate-500 mt-0.5 font-medium">Pemesan: <span class="font-semibold text-slate-700">{getEmployeeName(ord.karyawanId)}</span></p>
            </div>
            <span class="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md">Uang Kembalian</span>
          </div>
          <div class="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-[10px] text-indigo-900 flex justify-between items-center font-semibold font-sans">
            <span>Titip: Rp {ord.titipan.toLocaleString('id-ID')} • Beli: Rp {ord.realHarga.toLocaleString('id-ID')}</span>
            <span class="text-xs text-indigo-600 font-bold font-mono">Kembalian: Rp {ord.kembalian.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-end pt-1.5 border-t border-slate-100">
            <button 
              on:click={() => dispatch('returnChange', ord)} 
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 focus:outline-none"
            >
              <Check class="w-3.5 h-3.5" /> Kembalian Sudah Diberikan
            </button>
          </div>
        </div>
      {:else}
        <!-- Status SELESAI -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 opacity-70 flex flex-col gap-1.5">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-sm text-slate-700 line-through">{ord.barang}</h4>
            <span class="px-2.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md">Selesai</span>
          </div>
          <div class="text-[10px] text-slate-500 flex justify-between items-center">
            <span>Pemesan: {getEmployeeName(ord.karyawanId)}</span>
            <span class="font-bold font-mono text-slate-800">Beli: Rp {ord.realHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>
      {/if}
    {/each}
  {/if}
</div>
