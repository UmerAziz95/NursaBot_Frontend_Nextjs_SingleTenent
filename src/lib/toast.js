import { toast as sonnerToast } from 'sonner'

const DEFAULT_DURATION = 4500

/**
 * App-wide toast helpers. Prefer these over inline error/success banners.
 */
export const toast = {
    success(message, options = {}) {
        if (!message) return
        return sonnerToast.success(String(message), {
            duration: DEFAULT_DURATION,
            ...options,
        })
    },
    error(message, options = {}) {
        if (!message) return
        return sonnerToast.error(String(message), {
            duration: 5500,
            ...options,
        })
    },
    warning(message, options = {}) {
        if (!message) return
        return sonnerToast.warning(String(message), {
            duration: DEFAULT_DURATION,
            ...options,
        })
    },
    info(message, options = {}) {
        if (!message) return
        return sonnerToast.message(String(message), {
            duration: DEFAULT_DURATION,
            ...options,
        })
    },
    message(message, options = {}) {
        if (!message) return
        return sonnerToast(String(message), {
            duration: DEFAULT_DURATION,
            ...options,
        })
    },
    dismiss(id) {
        sonnerToast.dismiss(id)
    },
}

export default toast
