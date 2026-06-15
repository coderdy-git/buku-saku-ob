<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let phone = '';

  let code = '';
  let errorMsg = '';
  let loading = false;

  async function handleVerify() {
    if (!code) {
      errorMsg = 'Kode verifikasi wajib diisi';
      return;
    }
    
    loading = true;
    errorMsg = '';

    // Simulasi Verifikasi (Metode A bypass: kode 1234 langsung valid)
    setTimeout(() => {
      loading = false;
      if (code === '1234') {
        dispatch('success');
      } else {
        errorMsg = 'Kode verifikasi tidak sesuai. Gunakan kode "1234" untuk bypass.';
      }
    }, 1000);
  }

  function maskPhoneNumber(num) {
    if (!num) return '';
    if (num.startsWith('0')) num = num.substring(1);
    return `+62 ${num.slice(0, 3)}-••••-${num.slice(-3)}`;
  }
</script>

<div class="flex-grow flex flex-col justify-between p-8 bg-white h-full">
  <!-- Header back navigation -->
  <div>
    <button on:click={() => dispatch('back')} class="flex items-center text-slate-500 hover:text-slate-800 transition-colors py-2 mb-8 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm">Kembali</span>
    </button>

    <h2 class="text-2xl font-bold tracking-tight text-slate-950">Verifikasi WhatsApp</h2>
    <p class="text-sm text-slate-500 mt-2 leading-relaxed">
      Kami telah mengirimkan 4-digit kode OTP ke nomor WhatsApp <span class="font-semibold text-slate-800">{maskPhoneNumber(phone)}</span>.
    </p>

    <!-- OTP Input Form -->
    <div class="mt-8">
      <label for="otp" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">Masukkan Kode Verifikasi</label>
      <input 
        type="text" 
        id="otp" 
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="4"
        bind:value={code}
        placeholder="••••" 
        class="w-full max-w-[200px] mx-auto block px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-lg focus:outline-none focus:border-brand-500 focus:bg-white tracking-[0.5em] text-center transition-all font-bold"
      />

      <p class="text-xs text-center text-slate-400 mt-4 leading-relaxed">
        Gunakan kode simulasi <span class="font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">1234</span> untuk verifikasi bypass lokal.
      </p>

      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 mt-4 text-center">
          {errorMsg}
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Button & Resend -->
  <div class="mt-8 flex flex-col gap-4">
    <button 
      on:click={handleVerify}
      disabled={loading}
      class="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all text-sm focus:outline-none shadow-md shadow-brand-100 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
    >
      {#if loading}
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Memverifikasi...</span>
      {:else}
        <span>Verifikasi</span>
      {/if}
    </button>

    <div class="text-center">
      <button class="text-xs text-slate-400 hover:text-brand-600 transition-colors font-medium">
        Tidak menerima kode? <span class="underline">Kirim ulang OTP</span>
      </button>
    </div>
  </div>
</div>
