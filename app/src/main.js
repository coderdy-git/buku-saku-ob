import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { registerSW } from 'virtual:pwa-register'

// Registrasi Service Worker PWA secara otomatis saat aplikasi dibuka
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Konten baru tersedia, silakan refresh.');
  },
  onOfflineReady() {
    console.log('Aplikasi siap digunakan secara offline.');
  },
})

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
