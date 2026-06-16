<script>
  import { onMount, onDestroy } from 'svelte';
  import { addToast } from '../uiStore.svelte.js';
  import { maskPhone } from '../utils.js';
  
  let { phone = '', onsuccess, onback } = $props();

  let code = $state('');
  let errorMsg = $state('');
  let loading = $state(false);

  // OTP countdown timer (5 minutes = 300 seconds)
  let countdownLeft = $state(300);
  let countdownInterval;
  let canResend = $derived(countdownLeft <= 0);

  onMount(() => {
    requestOtp();
    startCountdown();
  });

  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });


  async function requestOtp() {
    loading = true;
    try {
      const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
      const res = await fetch(`${gatewayUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        addToast('Kode OTP telah dikirim ke WhatsApp Anda', 'success');
      } else {
        errorMsg = 'Gagal mengirim OTP, pastikan WA Gateway menyala';
      }
    } catch (err) {
      errorMsg = 'Koneksi ke WA Gateway gagal';
    } finally {
      loading = false;
    }
  }

  function startCountdown() {
    countdownLeft = 300;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      countdownLeft -= 1;
      if (countdownLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function handleVerify() {
    if (!code) {
      errorMsg = 'Kode verifikasi wajib diisi';
      return;
    }
    if (code.length !== 4) {
      errorMsg = 'Masukkan 4 digit OTP';
      return;
    }
    
    loading = true;
    errorMsg = '';

    try {
      const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
      const res = await fetch(`${gatewayUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code })
      });
      
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onsuccess?.();
      } else {
        errorMsg = 'Kode OTP salah atau sudah kadaluarsa';
      }
    } catch (err) {
      errorMsg = 'Koneksi ke WA Gateway gagal';
    } finally {
      loading = false;
    }
  }

  function handleResend() {
    if (!canResend) return;
    addToast('OTP simulasi: gunakan kode 1234', 'info');
    requestOtp();
    startCountdown();
  }

  function maskedPhone(num) {
    return maskPhone(num);
  }
</script>

<div class="flex-grow flex flex-col justify-between p-8 bg-white h-full">
  <!-- Header back navigation -->
  <div>
    <button onclick={() => onback?.()} class="flex items-center text-slate-500 hover:text-slate-800 transition-colors py-2 mb-8 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm">Kembali</span>
    </button>

    <h2 class="text-2xl font-bold tracking-tight text-slate-950">Verifikasi WhatsApp</h2>
    <p class="text-sm text-slate-500 mt-2 leading-relaxed">
      Kami telah mengirimkan 4-digit kode OTP ke nomor WhatsApp <span class="font-semibold text-slate-800">{maskedPhone(phone)}</span>.
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



      {#if !canResend}
        <p class="text-xs text-center text-slate-400 mt-2">
          Kode berlaku selama <span class="font-semibold text-slate-600">{formatCountdown(countdownLeft)}</span>
        </p>
      {/if}

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
      onclick={handleVerify}
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
      <button 
        onclick={handleResend}
        disabled={!canResend}
        class="text-xs text-slate-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        class:hover:text-brand-600={canResend}
      >
        {#if canResend}
          Tidak menerima kode? <span class="underline">Kirim ulang OTP</span>
        {:else}
          Kirim ulang OTP dalam {formatCountdown(countdownLeft)}
        {/if}
      </button>
    </div>
  </div>
</div>
