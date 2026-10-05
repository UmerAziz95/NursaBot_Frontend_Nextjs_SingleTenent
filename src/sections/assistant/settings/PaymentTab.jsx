'use client'

import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { TabsContent } from '@/components/ui/tabs'
import { CreditCard as CreditCardIcon, Lock as LockIcon, Wallet as WalletIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { useSettings } from '@/sections/assistant/settings/SettingsContext'
import { PageHeader, Section } from '@/sections/assistant/settings/SettingsUI'
import { userFacingStripeError } from '@/lib/user-facing-error'
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
                toast.error(userFacingStripeError(stripeError, 'Could not save card. Please try again.'))
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
        <Section
            as="form"
            onSubmit={handleSubmit}
            icon={CreditCardIcon}
            title={onCancel ? 'Replace payment method' : 'Add payment method'}
            description="Enter your card number, expiry and CVC."
        >
            <div className="nbs-card-input">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <div className="nbs-secure-note">
                <LockIcon className="size-3.5" />
                Processed securely by Stripe. We only store the brand, last four digits and expiry.
            </div>
            <div className="nbs-actions">
                {onCancel ? (
                    <button type="button" onClick={onCancel} className="nbs-btn is-ghost">
                        Cancel
                    </button>
                ) : null}
                <button type="submit" disabled={!stripe || loading} className="nbs-btn is-primary">
                    {loading ? 'Saving…' : 'Save card'}
                </button>
            </div>
        </Section>
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
        <TabsContent value="payment" className="nbs-page m-0 outline-none">
            <PageHeader title="Payment" description="The card attached to your account for plan purchases." />

            {hasCard && !editing ? (
                <Section
                    icon={CreditCardIcon}
                    title="Saved card"
                    description="Used when you buy or reactivate a plan."
                    action={(
                        <button type="button" onClick={() => setEditing(true)} className="nbs-btn is-secondary">
                            Replace card
                        </button>
                    )}
                >
                    <div className="nbs-card-row">
                        <div className={`nbs-paycard bg-gradient-to-br ${brandGradient(pm.brand)}`}>
                            <div className="nbs-paycard-shine" aria-hidden="true" />
                            <div className="relative flex items-start justify-between gap-3">
                                <span className="nbs-paycard-chip" aria-hidden="true" />
                                <span className="nbs-paycard-brand">{brandLabel(pm.brand)}</span>
                            </div>
                            <div className="relative">
                                <div className="nbs-paycard-number">•••• •••• •••• {pm.last4}</div>
                                <div className="nbs-paycard-meta">
                                    <span>Expires</span>
                                    {String(pm.exp_month || '').padStart(2, '0')}/{pm.exp_year || '——'}
                                </div>
                            </div>
                        </div>
                        <div className="nbs-secure-note is-stacked">
                            <LockIcon className="size-4" />
                            <div>
                                <strong>Secured by Stripe</strong>
                                Your full card number is never stored on our servers.
                            </div>
                        </div>
                    </div>
                </Section>
            ) : null}

            {!hasCard && !editing ? (
                <div className="nbs-empty is-card">
                    <span className="nbs-empty-icon"><WalletIcon className="size-5" /></span>
                    <div className="nbs-empty-title">No payment method yet</div>
                    <div className="nbs-empty-desc">Add a card to buy or reactivate a plan in one click.</div>
                    <button type="button" onClick={() => setEditing(true)} className="nbs-btn is-primary mt-4">
                        <CreditCardIcon className="size-4" />
                        Add payment method
                    </button>
                </div>
            ) : null}

            {editing ? (
                !stripePromise ? (
                    <Section tone="warning" icon={CreditCardIcon} title="Card payments unavailable" description="Please try again later or contact support." />
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
