import { toast as sonnerToast } from 'sonner'
import { userFacingError } from '@/lib/user-facing-error'

const DEFAULT_DURATION = 4500

/**
 * App-wide toast helpers. Prefer these over inline error/success banners.
 * Error and warning text is filtered so implementation details from the
 * server (API keys, config, "not found" internals) never reach the screen.
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
        return sonnerToast.error(userFacingError(message), {
            duration: 5500,
            ...options,
        })
    },
    warning(message, options = {}) {
        if (!message) return
        return sonnerToast.warning(userFacingError(message), {
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
