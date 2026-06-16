<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Import Komponen Halaman
  import Login from './lib/components/Login.svelte';
  import Register from './lib/components/Register.svelte';
  import Otp from './lib/components/Otp.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import ToastContainer from './lib/components/ui/ToastContainer.svelte';
  import ConfirmDialog from './lib/components/ui/ConfirmDialog.svelte';
  import { addToast, confirmAction } from './lib/uiStore.svelte.js';

  // State router halaman global
  let currentPage = $state('splash'); // splash | landing | login | register | otp | dashboard
  
  // Data sesi user sementara
  let user = $state({
    nama: '',
    telepon: '',
    verified: false
  });

  // State PWA Install Prompt
  let deferredPrompt = $state(null);
  let showInstallBtn = $state(false);

  // Pemicu perpindahan halaman
  function navigate(page) {
    currentPage = page;
  }

  // Menangani kesuksesan autentikasi (Login/Register)
  function handleAuthSuccess(userData) {
    user = userData;
    navigate('otp');
    addToast('Silakan verifikasi OTP Anda', 'info');
  }

  // Menangani kesuksesan verifikasi OTP
  function handleOtpSuccess() {
    user.verified = true;
    localStorage.setItem('ob_session', JSON.stringify(user));
    navigate('dashboard');
    addToast('Login Berhasil!', 'success');
  }

  // Menangani Logout Global
  function handleLogout() {
    confirmAction('Keluar Akun', 'Apakah Anda yakin ingin keluar?', () => {
      localStorage.removeItem('ob_session');
      user = { nama: '', telepon: '', verified: false };
      navigate('landing');
      addToast('Berhasil keluar akun', 'info');
    });
  }

  // Menjalankan instalasi PWA
  async function triggerPwaInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      showInstallBtn = false;
    }
  }

  // Splash Screen Timeout & Listeners
  onMount(() => {
    // Daftarkan listener logout global
    window.addEventListener('logout', handleLogout);

    // Tangkap event instalasi PWA
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBtn = true;
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Cek jika app sudah diinstall / berjalan standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      showInstallBtn = false;
    }

    // Memeriksa sesi lokal jika sudah ada
    const savedUser = localStorage.getItem('ob_session');
    
    setTimeout(() => {
      if (savedUser) {
        user = JSON.parse(savedUser);
        if (user.verified) {
          currentPage = 'dashboard';
        } else {
          currentPage = 'otp';
        }
      } else {
        currentPage = 'landing';
      }
    }, 2500); // 2.5 detik animasi splash

    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  });
</script>

<ToastContainer />
<ConfirmDialog />
<main class="w-full min-h-screen flex flex-col relative bg-white">
  {#if currentPage === 'splash'}
    <!-- SPLASH SCREEN VIEW -->
    <div out:fade={{ duration: 300 }} class="flex-grow flex flex-col justify-center items-center px-8 bg-slate-50">
      <div class="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Buku Saku OB</h1>
      <p class="text-sm text-slate-500 mt-2">Pencatatan Cerdas Operasional OB</p>
      
      <!-- Progress Bar Loading -->
      <div class="w-48 h-1 bg-slate-200 rounded-full mt-12 overflow-hidden">
        <div class="h-full bg-brand-600 rounded-full animate-[shimmer_1.5s_infinite]" style="width: 70%; transform: translateX(-30%); animation: loading 2.5s ease-in-out infinite;"></div>
      </div>
    </div>
  {:else if currentPage === 'landing'}
    <!-- LANDING PAGE VIEW -->
    <div in:fade={{ duration: 200 }} class="flex-grow flex flex-col justify-between p-8 bg-white">
      <div class="flex-grow flex flex-col justify-center text-center">
        <div class="mx-auto w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16.005h.01" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-950">Selamat Datang di Buku Saku OB</h2>
        <p class="text-sm text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
          Kelola pesanan makanan kantin, kas bailout talangan, keranjang belanja ATK kantor, dan absensi harian dalam satu genggaman.
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <button 
          onclick={() => navigate('login')} 
          class="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all text-sm focus:outline-none shadow-md shadow-brand-100"
        >
          Masuk Sekarang
        </button>
        <button 
          onclick={() => navigate('register')} 
          class="w-full py-3 bg-slate-50 text-slate-700 font-medium rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all text-sm focus:outline-none border border-slate-200"
        >
          Daftar Akun Baru
        </button>
      </div>
    </div>
  {:else if currentPage === 'login'}
    <!-- LOGIN VIEW -->
    <div in:fade={{ duration: 200 }} class="flex-grow">
      <Login 
        onback={() => navigate('landing')} 
        onsuccess={handleAuthSuccess}
      />
    </div>
  {:else if currentPage === 'register'}
    <!-- REGISTER VIEW -->
    <div in:fade={{ duration: 200 }} class="flex-grow">
      <Register 
        onback={() => navigate('landing')} 
        onsuccess={handleAuthSuccess}
      />
    </div>
  {:else if currentPage === 'otp'}
    <!-- OTP VIEW -->
    <div in:fade={{ duration: 200 }} class="flex-grow">
      <Otp 
        phone={user.telepon} 
        onback={() => navigate('landing')} 
        onsuccess={handleOtpSuccess}
      />
    </div>
  {:else if currentPage === 'dashboard'}
    <!-- DASHBOARD VIEW -->
    <div in:fade={{ duration: 200 }} class="flex-grow flex flex-col">
      <Dashboard 
        user={user}
        showInstallBtn={showInstallBtn}
        oninstallpwa={triggerPwaInstall}
      />
    </div>
  {/if}
</main>

<style>
  @keyframes loading {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(20%); }
    100% { transform: translateX(100%); }
  }
</style>
