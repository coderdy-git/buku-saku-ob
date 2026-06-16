<script>
    import { uiState } from '../../uiStore.svelte.js';
    import { fade, fly } from 'svelte/transition';
    import { AlertTriangle, Info, Trash2 } from '@lucide/svelte';
    let isProcessing = $state(false);
</script>

{#if uiState.confirmDialog}
    <div 
        in:fade={{ duration: 150 }} 
        out:fade={{ duration: 150 }}
        class="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
        <div 
            in:fly={{ y: 20, duration: 200 }}
            class="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5 flex flex-col gap-4 pointer-events-auto"
        >
            <div class="flex items-start gap-3">
                <div class="p-2 rounded-full shrink-0 
                    {uiState.confirmDialog.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}
                ">
                    {#if uiState.confirmDialog.type === 'danger'}
                        <Trash2 class="w-6 h-6" />
                    {:else}
                        <AlertTriangle class="w-6 h-6" />
                    {/if}
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 text-base">{uiState.confirmDialog.title}</h3>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">{uiState.confirmDialog.message}</p>
                </div>
            </div>

            <div class="flex gap-2 mt-2">
                <button 
                    onclick={uiState.confirmDialog.onCancel}
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                    {uiState.confirmDialog.cancelText}
                </button>
                <button 
                    disabled={isProcessing}
                    onclick={() => uiState.confirmDialog.onConfirm((val) => isProcessing = val)}
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-md flex justify-center items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed
                        {uiState.confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'}
                    "
                >
                    {#if isProcessing}
                        <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {:else}
                        {uiState.confirmDialog.confirmText}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
