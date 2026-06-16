export const uiState = $state({
    toasts: [],
    confirmDialog: null
});

let toastId = 0;

export function addToast(message, type = 'success', duration = 3000) {
    const id = ++toastId;
    uiState.toasts.push({ id, message, type });
    if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
    }
}

export function removeToast(id) {
    uiState.toasts = uiState.toasts.filter(t => t.id !== id);
}

export function confirmAction(title, message, onConfirm, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'warning') {
    uiState.confirmDialog = {
        title,
        message,
        onConfirm: async (setProcessing) => {
            if (setProcessing) setProcessing(true);
            try {
                await onConfirm();
            } finally {
                if (setProcessing) setProcessing(false);
                uiState.confirmDialog = null;
            }
        },
        onCancel: () => {
            uiState.confirmDialog = null;
        },
        confirmText,
        cancelText,
        type
    };
}
