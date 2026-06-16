<script>
    import { uiState, removeToast } from '../../uiStore.svelte.js';
    import { fade, fly } from 'svelte/transition';
    import { CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
    {#each uiState.toasts as toast (toast.id)}
        <div 
            in:fly={{ y: -20, duration: 300 }} 
            out:fade={{ duration: 200 }}
            class="flex items-center gap-3 p-3.5 rounded-xl shadow-lg border pointer-events-auto
                {toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : ''}
                {toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : ''}
                {toast.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : ''}
            "
        >
            <div class="shrink-0">
                {#if toast.type === 'success'}
                    <CheckCircle2 class="w-5 h-5 text-emerald-500" />
                {:else if toast.type === 'error'}
                    <AlertCircle class="w-5 h-5 text-red-500" />
                {:else}
                    <Info class="w-5 h-5 text-blue-500" />
                {/if}
            </div>
            <p class="text-sm font-semibold flex-grow">{toast.message}</p>
            <button onclick={() => removeToast(toast.id)} class="shrink-0 text-slate-400 hover:text-slate-600">
                <X class="w-4 h-4" />
            </button>
        </div>
    {/each}
</div>
