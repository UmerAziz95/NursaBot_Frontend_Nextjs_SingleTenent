'use client'

import { Toaster } from 'sonner'

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            gap={10}
            toastOptions={{
                classNames: {
                    toast: 'border shadow-lg font-sans',
                    title: 'text-sm font-medium',
                    description: 'text-xs',
                    closeButton: 'border border-slate-200 bg-white',
                },
            }}
        />
    )
}
