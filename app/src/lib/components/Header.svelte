<script>
  // Import Icon resmi dari Lucide
  import { LogOut, Download } from '@lucide/svelte';
  
  let { userName = 'Operator', showInstallBtn = false, oninstallpwa, onlogout, ondevwipe } = $props();
</script>

<!-- Header Aplikasi -->
<header class="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center shrink-0 z-20 sticky top-0">
  <div class="flex items-center gap-2.5">
    <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
      <!-- Menggunakan SVG Pocket asli dari prototipe untuk menghindari error module export -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4.5 h-4.5">
        <path d="M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z"></path>
        <polyline points="8 10 12 14 16 10"></polyline>
      </svg>
    </div>
    <div>
      <h1 class="font-bold text-slate-900 text-sm tracking-tight leading-none">Buku Saku OB</h1>
      <p class="text-[9px] text-slate-400 font-medium mt-1 leading-none">Operator: {userName}</p>
    </div>
  </div>

  <div class="flex items-center gap-2">
    {#if import.meta.env.DEV}
      <button 
        onclick={() => ondevwipe?.()} 
        title="Reset Data (Dev Only)"
        class="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200 rounded-lg text-[10px] font-bold transition focus:outline-none"
      >
        Wipe Data
      </button>
    {/if}

    {#if showInstallBtn}
      <button 
        onclick={() => oninstallpwa?.()} 
        title="Instal Aplikasi ke HP"
        class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-bold flex items-center gap-1 transition focus:outline-none"
      >
        <Download class="w-3.5 h-3.5" /> Instal App
      </button>
    {/if}

    <button 
      onclick={() => onlogout?.()} 
      title="Keluar Akun"
      class="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition border border-red-200/50 shadow-sm focus:outline-none"
    >
      <LogOut class="w-3.5 h-3.5" />
    </button>
  </div>
</header>
