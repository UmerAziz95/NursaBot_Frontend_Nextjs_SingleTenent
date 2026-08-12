'use client'

import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { TabsContent } from '@/components/ui/tabs'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { useSettings } from '@/sections/assistant/settings/SettingsContext'
import { toast } from '@/lib/toast'

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '14px',
            color: '#1e293b',
            fontFamily: 'inherit',
            '::placeholder': { color: '#94a3b8' },
        },
        invalid: { color: '#dc2626' },
    },
}

const brandLabel = (brand) => {
    if (!brand) return 'Card'
    return String(brand).charAt(0).toUpperCase() + String(brand).slice(1)
}

const brandGradient = (brand) => {
    const b = String(brand || '').toLowerCase()
    if (b === 'visa') return 'from-[#1A1F71] via-[#2B32B2] to-[#4A90E2]'
    if (b === 'mastercard') return 'from-[#1F2937] via-[#374151] to-[#EB001B]'
    if (b === 'amex') return 'from-[#006FCF] via-[#0077C8] to-[#00A3E0]'
    return 'from-[#053447] via-[#0a4a63] to-[#2EAADB]'
}

function ReplaceCardForm({ onSaved, onCancel }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)

        try {
            const setupRes = await fetchLaravel('/api/payments/setup-intent', { method: 'POST', body: '{}' })
            const setupData = await setupRes.json().catch(() => null)
            if (!setupRes.ok || !setupData?.client_secret) {
                toast.error('Card setup is temporarily unavailable. Please try again later.')
                setLoading(false)
                return
            }

            const cardElement = elements.getElement(CardElement)
            const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(setupData.client_secret, {
                payment_method: { card: cardElement },
            })

            if (stripeError) {
                toast.error(stripeError.message || 'Could not save card.')
                setLoading(false)
                return
            }

            if (setupIntent?.status !== 'succeeded') {
                toast.error('Card setup was not completed. Please try again.')
                setLoading(false)
                return
            }

            const confirmRes = await fetchLaravel('/api/payments/confirm-payment-method', {
                method: 'POST',
                body: JSON.stringify({ setup_intent_id: setupIntent.id || setupData.setup_intent_id }),
            })
            const confirmData = await confirmRes.json().catch(() => null)
            if (!confirmRes.ok) {
                toast.error('We could not save your card. Please try again.')
                setLoading(false)
                return
            }

            onSaved(confirmData.payment_method || null)
        } catch (err) {
            console.error('payments.replace_card_failed', err)
            toast.error('We could not save your card. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
                {onCancel ? 'Replace payment method' : 'Add payment method'}
            </h3>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="user-portal-btn-primary disabled:opacity-50"
                >
                    {loading ? 'Saving…' : 'Save card'}
                </button>
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                ) : null}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
                Card details are processed securely by Stripe. We only store brand, last four digits, and expiry.
            </p>
        </form>
    )
}

export default function PaymentTab() {
    const { profile, stripeKey, setPaymentMethod } = useSettings()
    const [editing, setEditing] = useState(false)

    const stripePromise = useMemo(
        () => (stripeKey ? loadStripe(stripeKey) : null),
        [stripeKey]
    )

    if (!profile) return null

    const pm = profile.payment_method
    const hasCard = Boolean(pm?.last4)

    const handleSaved = (paymentMethod) => {
        setPaymentMethod(paymentMethod)
        setEditing(false)
        toast.success('Payment method updated.')
    }

    return (
        <TabsContent value="payment" className="m-0 block w-full space-y-5 p-5 outline-none md:p-7">
            <header className="border-b border-slate-100 pb-4">
                <h2 className="user-portal-page-title">Payment method</h2>
                <p className="user-portal-page-desc mt-1">
                    The card attached to your account for plan purchases.
                </p>
            </header>

            {hasCard && !editing ? (
                <div className="space-y-4">
                    <div
                        className={`flex h-[168px] w-full max-w-[340px] flex-col justify-between rounded-2xl bg-gradient-to-br ${brandGradient(pm.brand)} p-5 text-white shadow-md`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-xs opacity-90">Saved card</span>
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                {brandLabel(pm.brand)}
                            </span>
                        </div>
                        <div>
                            <p className="text-lg tracking-[0.18em]">•••• •••• •••• {pm.last4}</p>
                            <p className="mt-2 text-xs opacity-90">
                                Expires {String(pm.exp_month || '').padStart(2, '0')}/{pm.exp_year || '——'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="user-portal-btn-primary gap-2"
                    >
                        <CreditCardIcon className="size-4" />
                        Replace card
                    </button>
                </div>
            ) : null}

            {!hasCard && !editing ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm text-slate-600">No payment method on file yet.</p>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#2EAADB] px-5 text-sm font-semibold text-white transition hover:bg-[#2596c0]"
                    >
                        <CreditCardIcon className="size-4" />
                        Add payment method
                    </button>
                </div>
            ) : null}

            {editing ? (
                !stripePromise ? (
                    <p className="text-sm text-slate-600">
                        Card payments are temporarily unavailable. Please try again later or contact support.
                    </p>
                ) : (
                    <Elements stripe={stripePromise}>
                        <ReplaceCardForm
                            onSaved={handleSaved}
                            onCancel={hasCard ? () => setEditing(false) : null}
                        />
                    </Elements>
                )
            ) : null}
        </TabsContent>
    )
}
