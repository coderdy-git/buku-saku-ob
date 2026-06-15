<script>
  import { createEventDispatcher } from 'svelte';
  // Import Icon resmi Lucide
  import { ShoppingBag, Trash2 } from '@lucide/svelte';
  
  const dispatch = createEventDispatcher();
  
  export let shoppingList = [];
  export let shoppingBudget = 500000;
  export let belanjaTabFilter = 'troli'; // troli | riwayat
  export let shoppingHistory = [];

  let itemName = '';
  let itemPriceStr = '';
  let itemQty = 1;
  let isAutocompleteOpen = false;
  let autocompleteSuggestions = [];

  // Hitung total harga troli saat ini
  $: totalTroli = shoppingList.reduce((acc, item) => acc + (item.price * item.qty), 0);
  $: percentBudget = Math.min((totalTroli / shoppingBudget) * 100, 100);

  // Cari item unik dari riwayat belanja untuk autocomplete
  $: allUniquePastItems = Array.from(
    new Map(
      shoppingHistory.flatMap(h => h.items || []).map(item => [item.name.toLowerCase(), item])
    ).values()
  );

  function handleItemNameInput(e) {
    const val = e.target.value;
    itemName = val;
    if (val.trim().length > 0) {
      autocompleteSuggestions = allUniquePastItems.filter(item => 
        item.name.toLowerCase().includes(val.toLowerCase())
      );
      isAutocompleteOpen = autocompleteSuggestions.length > 0;
    } else {
      isAutocompleteOpen = false;
    }
  }

  function selectSuggestion(item) {
    itemName = item.name;
    itemPriceStr = item.price.toLocaleString('id-ID');
    isAutocompleteOpen = false;
  }

  function handlePriceInput(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value) {
      itemPriceStr = parseInt(value, 10).toLocaleString('id-ID');
    } else {
      itemPriceStr = "";
    }
  }

  function parseFormattedNumber(valString) {
    if (!valString) return 0;
    return parseFloat(valString.replace(/\./g, "")) || 0;
  }

  function addToTrolley() {
    if (!itemName || !itemPriceStr) return;
    
    const price = parseFormattedNumber(itemPriceStr);
    const item = {
      id: 'item-' + Date.now(),
      name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
      price,
      qty: itemQty
    };

    dispatch('addToTrolley', item);

    // Reset input
    itemName = '';
    itemPriceStr = '';
    itemQty = 1;
  }
</script>

<!-- Tabs -->
<div class="flex bg-slate-200 p-0.5 rounded-xl text-xs font-bold text-slate-500 mb-4">
  <button 
    on:click={() => dispatch('filter', 'troli')} 
    class="flex-1 py-2 rounded-lg transition-all {belanjaTabFilter === 'troli' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-800'}"
  >
    Troli Aktif
  </button>
  <button 
    on:click={() => dispatch('filter', 'riwayat')} 
    class="flex-1 py-2 rounded-lg transition-all {belanjaTabFilter === 'riwayat' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-800'}"
  >
    Riwayat Belanja
  </button>
</div>

{#if belanjaTabFilter === 'troli'}
  <!-- TROLI BELANJA AKTIF -->
  <div class="space-y-4">
    <!-- Progress Budget Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
      <div class="flex justify-between items-center text-xs font-bold">
        <span class="text-slate-500">Total Pengeluaran:</span>
        <div class="text-slate-900 font-mono flex items-center gap-1">
          <span>Rp {totalTroli.toLocaleString('id-ID')} / </span>
          <button 
            on:click={() => dispatch('editBudget')} 
            class="text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
            title="Klik untuk ubah budget limit"
          >
            Rp {shoppingBudget.toLocaleString('id-ID')}
          </button>
        </div>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-indigo-600 transition-all duration-300" style="width: {percentBudget}%"></div>
      </div>
    </div>

    <!-- Input Add Item Form -->
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3 relative">
      <h4 class="text-xs font-bold text-slate-700">Tambah Barang Belanja</h4>
      <div class="grid grid-cols-12 gap-2 relative">
        <!-- Nama Barang (Autocomplete) -->
        <div class="col-span-12 relative">
          <input 
            type="text" 
            placeholder="Nama Barang (contoh: Kopi, Gula, Teh)" 
            value={itemName}
            on:input={handleItemNameInput}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-medium"
          />
          {#if isAutocompleteOpen}
            <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-36 overflow-y-auto">
              {#each autocompleteSuggestions as sug}
                <button 
                  on:click={() => selectSuggestion(sug)}
                  class="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors font-medium text-slate-800 border-b border-slate-100"
                >
                  {sug.name} <span class="text-[10px] text-slate-400 font-bold ml-1">(Terakhir: Rp {sug.price.toLocaleString('id-ID')})</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Harga Satuan -->
        <div class="col-span-8">
          <input 
            type="text" 
            placeholder="Harga Satuan (Rp)" 
            value={itemPriceStr}
            on:input={handlePriceInput}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold font-mono"
          />
        </div>

        <!-- Jumlah -->
        <div class="col-span-4">
          <input 
            type="number" 
            placeholder="Qty" 
            min="1"
            bind:value={itemQty}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-center font-bold"
          />
        </div>
      </div>
      
      <button 
        on:click={addToTrolley}
        class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition focus:outline-none"
      >
        Tambah ke Troli
      </button>
    </div>

    <!-- Trolley Items List -->
    <div class="space-y-2">
      <div class="flex justify-between items-center px-1">
        <h5 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">BARANG DI TROLI</h5>
        {#if shoppingList.length > 0}
          <button 
            on:click={() => dispatch('checkout')}
            class="text-[10px] text-emerald-600 font-bold hover:text-emerald-700 focus:outline-none"
          >
            Selesaikan & Simpan Struk
          </button>
        {/if}
      </div>

      {#if shoppingList.length === 0}
        <div class="bg-white p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
          <p class="text-xs">Troli belanja masih kosong. Tambahkan barang di atas.</p>
        </div>
      {:else}
        {#each shoppingList as tItem (tItem.id)}
          <div class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h4 class="text-xs font-bold text-slate-800 truncate">{tItem.name}</h4>
              <span class="text-[9px] text-slate-400 font-bold block mt-0.5">
                {tItem.qty} x Rp {tItem.price.toLocaleString('id-ID')}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold font-mono text-slate-900">
                Rp {(tItem.price * tItem.qty).toLocaleString('id-ID')}
              </span>
              <button 
                on:click={() => dispatch('removeItem', tItem.id)}
                class="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{:else}
  <!-- RIWAYAT BELANJA -->
  <div class="space-y-3">
    {#if shoppingHistory.length === 0}
      <div class="text-center py-16 text-slate-400">
        <p class="text-xs">Belum ada riwayat struk belanja yang disimpan.</p>
      </div>
    {:else}
      {#each shoppingHistory as hist (hist.id)}
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
          <div class="flex justify-between items-center text-xs font-bold">
            <span class="text-slate-800">
              {new Date(hist.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
            </span>
            <span class="text-indigo-600 font-mono">
              Rp {hist.total.toLocaleString('id-ID')}
            </span>
          </div>
          <div class="text-[10px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100">
            {hist.items.map(i => `${i.name} (${i.qty}x)`).join(', ')}
          </div>
        </div>
      {/each}
    {/if}
  </div>
{/if}
