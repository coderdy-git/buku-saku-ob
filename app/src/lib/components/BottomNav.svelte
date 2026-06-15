<script>
  import { createEventDispatcher } from 'svelte';
  // Import Icon resmi dari Lucide Svelte
  import { ClipboardList, Users, ShoppingCart, Clock } from '@lucide/svelte';
  
  const dispatch = createEventDispatcher();
  
  export let activeTab = 'orders'; // orders | cashbook | calculator | attendance

  const tabs = [
    {
      id: 'orders',
      label: 'Pesanan',
      component: ClipboardList
    },
    {
      id: 'cashbook',
      label: 'Buku Kas',
      component: Users
    },
    {
      id: 'calculator',
      label: 'Kalkulator',
      component: ShoppingCart
    },
    {
      id: 'attendance',
      label: 'Absensi',
      component: Clock
    }
  ];
</script>

<nav class="w-full bg-white border-t border-slate-100 px-2 py-3 flex justify-around items-center sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
  {#each tabs as tab}
    <button 
      on:click={() => dispatch('select', tab.id)}
      class="flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all duration-200 focus:outline-none {activeTab === tab.id ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}"
    >
      <div class="transition-transform duration-200 {activeTab === tab.id ? 'scale-110' : ''}">
        <svelte:component this={tab.component} class="w-5.5 h-5.5" />
      </div>
      <span class="text-[9px] font-bold tracking-wide">{tab.label}</span>
    </button>
  {/each}
</nav>
