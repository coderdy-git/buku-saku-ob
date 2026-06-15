<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let phone = '';
  let pin = '';
  let errorMsg = '';
  let loading = false;

  // Rate Limiter State
  let attemptCount = 0;
  let lockoutTimeLeft = 0;
  let timerInterval;

  // Cek status lockout saat komponen dimuat
  onMount(() => {
    const lockoutUntil = localStorage.getItem('ob_lockout_until');
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        startLockoutTimer(remaining);
      }
    }
  });

  function startLockoutTimer(seconds) {
    lockoutTimeLeft = seconds;
    timerInterval = setInterval(() => {
      lockoutTimeLeft -= 1;
      if (lockoutTimeLeft <= 0) {
        clearInterval(timerInterval);
        attemptCount = 0;
        localStorage.removeItem('ob_lockout_until');
      }
    }, 1000);
  }

  async function handleLogin() {
    if (lockoutTimeLeft > 0) return;

    // 1. Validasi Input
    if (!phone) {
      errorMsg = 'Nomor WhatsApp wajib diisi';
      return;
    }
    if (!/^\d{10,13}$/.test(phone)) {
      errorMsg = 'Nomor WhatsApp tidak valid (harus 10-13 digit angka)';
      return;
    }
    if (!pin) {
      errorMsg = 'PIN wajib diisi';
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      errorMsg = 'PIN harus tepat 6 digit angka';
      return;
    }
    
    loading = true;
    errorMsg = '';

    // Simulasi Login (Bypass verifikasi Supabase Auth untuk sementara)
    setTimeout(() => {
      loading = false;
      // Simulasi validasi PIN (misal: 123456)
      if (pin === '123456') {
        attemptCount = 0;
        localStorage.removeItem('ob_lockout_until');
        
        const userData = {
          nama: 'Office Boy Operator',
          telepon: '62' + phone,
          verified: false
        };
        localStorage.setItem('ob_session', JSON.stringify(userData));
        dispatch('success', userData);
      } else {
        attemptCount += 1;
        if (attemptCount >= 3) {
          const lockoutDuration = 60; // Kunci selama 60 detik
          const expireTime = Date.now() + (lockoutDuration * 1000);
          localStorage.setItem('ob_lockout_until', expireTime.toString());
          errorMsg = 'Terlalu banyak percobaan salah. Akun dikunci selama 60 detik.';
          startLockoutTimer(lockoutDuration);
        } else {
          errorMsg = `PIN salah. Sisa percobaan: ${3 - attemptCount}`;
        }
      }
    }, 1000);
  }
</script>

<div class="flex-grow flex flex-col justify-between p-8 bg-white h-full">
  <!-- Header back navigation -->
  <div>
    <button on:click={() => dispatch('back')} class="flex items-center text-slate-500 hover:text-slate-800 transition-colors py-2 mb-8 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm font-semibold">Kembali</span>
    </button>

    <h2 class="text-2xl font-bold tracking-tight text-slate-950">Masuk Akun</h2>
    <p class="text-sm text-slate-500 mt-2 leading-relaxed">Masukkan nomor WhatsApp dan 6-digit PIN keamanan Anda untuk mengakses Buku Saku OB.</p>

    <!-- Form Inputs -->
    <div class="mt-8 flex flex-col gap-4">
      <div>
        <label for="phone" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Nomor WhatsApp</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+62</span>
          <input 
            type="tel" 
            id="phone" 
            bind:value={phone}
            disabled={lockoutTimeLeft > 0}
            placeholder="812345678" 
            class="w-full pl-14 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label for="pin" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">6-Digit PIN</label>
        <input 
          type="password" 
          id="pin" 
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          bind:value={pin}
          disabled={lockoutTimeLeft > 0}
          placeholder="••••••" 
          class="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white tracking-[0.5em] text-center transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100 mt-1">
          {errorMsg}
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Button -->
  <div class="mt-8">
    <button 
      on:click={handleLogin}
      disabled={loading || lockoutTimeLeft > 0}
      class="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all text-sm focus:outline-none shadow-md shadow-brand-100 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
    >
      {#if lockoutTimeLeft > 0}
        <span>Terkunci ({lockoutTimeLeft}s)</span>
      {:else if loading}
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Memproses...</span>
      {:else}
        <span>Masuk</span>
      {/if}
    </button>
  </div>
</div>
