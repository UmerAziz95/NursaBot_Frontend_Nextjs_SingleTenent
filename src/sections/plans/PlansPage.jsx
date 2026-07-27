'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { AlertCircle as AlertCircleIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        price: '$9',
        period: '/month',
        features: ['1 user', '100 messages / day', 'Standard support'],
        highlight: false,
    },
    {
        id: 'plus',
        name: 'Plus',
        price: '$19',
        period: '/month',
        features: ['5 users', '500 messages / day', 'Priority support', 'Document uploads'],
        highlight: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$49',
        period: '/month',
        features: ['Unlimited users', 'Unlimited messages', '24/7 support', 'Document uploads', 'Custom workspace'],
        highlight: false,
    },
]

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '14px',
            color: '#1a1a1a',
            fontFamily: 'inherit',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#dc2626' },
    },
}

function CheckoutForm({ plan, onSuccess }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handlePay = async (e) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)
        setError(null)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const BASE = (process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            }

            // 1. Create PaymentIntent on server
            const intentRes = await fetch(`${BASE}/api/payments/create-intent`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ plan: plan.id }),
            })

            let intentData = null
            try { intentData = await intentRes.json() } catch (_) { /* ignore */ }

            if (!intentRes.ok) {
                setError((intentData && (intentData.detail || intentData.message)) || 'Failed to initialise payment')
                setLoading(false)
                return
            }

            const { client_secret, payment_intent_id } = intentData

            // 2. Confirm card payment using Stripe.js (stays on our site)
            const cardElement = elements.getElement(CardElement)
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
                payment_method: { card: cardElement },
            })

            if (stripeError) {
                setError(stripeError.message || 'Payment failed')
                setLoading(false)
                return
            }

            if (paymentIntent.status !== 'succeeded') {
                setError('Payment not completed. Please try again.')
                setLoading(false)
                return
            }

            // 3. Confirm plan on server
            const confirmRes = await fetch(`${BASE}/api/payments/confirm-plan`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ plan: plan.id, payment_intent_id }),
            })

            let confirmData = null
            try { confirmData = await confirmRes.json() } catch (_) { /* ignore */ }

            if (!confirmRes.ok) {
                setError((confirmData && (confirmData.detail || confirmData.message)) || 'Failed to activate plan')
                setLoading(false)
                return
            }

            onSuccess()
        } catch (err) {
            setError(err.message || 'Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <form onSubmit={handlePay} className="space-y-4 lg:space-y-[1.2vw]">
                <div className="border border-gray-400 rounded-lg lg:rounded-[0.8vw] px-4 lg:px-[1.2vw] py-3 lg:py-[0.9vw] bg-white">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>

                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold"
                >
                    {loading ? 'Processing…' : `Pay ${plan.price}/month`}
                </button>
            </form>

            <Dialog open={Boolean(error)} onOpenChange={(open) => { if (!open) setError(null) }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
                            <DialogTitle>Payment failed</DialogTitle>
                        </div>
                        <DialogDescription>{error}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="btn-primary px-5 py-2 rounded-lg font-bold text-sm"
                        >
                            Try again
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default function PlansPage() {
    const [selected, setSelected] = useState(null)
    const router = useRouter()

    const handleSuccess = () => {
        router.push('/assistant')
    }

    return (
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="mb-10 lg:mb-[3vw] text-center">
                    <h2 className="text-[22px] lg:text-[2.5vw] font-bold mb-2 lg:mb-[0.5vw]">Choose Your Plan</h2>
                    <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                        Select a plan to activate your account and start chatting
                    </p>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-[2vw] mb-10 lg:mb-[3vw]">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelected(plan)}
                            className={`login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw] cursor-pointer transition-all border-2 ${
                                selected?.id === plan.id
                                    ? 'border-[#053447]'
                                    : plan.highlight
                                    ? 'border-[#2EAADB]'
                                    : 'border-transparent'
                            }`}
                        >
                            {plan.highlight && (
                                <span className="inline-block mb-3 lg:mb-[0.8vw] text-[11px] lg:text-[0.65vw] font-bold uppercase tracking-widest text-[#2EAADB]">
                                    Most Popular
                                </span>
                            )}
                            <h3 className="text-[18px] lg:text-[1.5vw] font-bold mb-1 lg:mb-[0.3vw]">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-4 lg:mb-[1.2vw]">
                                <span className="text-[28px] lg:text-[2.2vw] font-extrabold">{plan.price}</span>
                                <span className="text-gray-500 text-[13px] lg:text-[0.8vw] mb-1">{plan.period}</span>
                            </div>
                            <ul className="space-y-2 lg:space-y-[0.6vw] mb-6 lg:mb-[1.5vw]">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-[13px] lg:text-[0.8vw] text-gray-700">
                                        <svg className="w-4 h-4 lg:w-[1vw] lg:h-[1vw] text-[#2EAADB] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelected(plan) }}
                                className={`w-full py-2 lg:py-[0.7vw] rounded-lg lg:rounded-[0.8vw] font-bold text-[13px] lg:text-[0.8vw] transition-all ${
                                    selected?.id === plan.id
                                        ? 'btn-primary'
                                        : 'border border-[#053447] text-[#053447] hover:bg-[#053447] hover:text-white'
                                }`}
                            >
                                {selected?.id === plan.id ? 'Selected' : 'Choose Plan'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Payment form – shown once a plan is selected */}
                {selected && (
                    <div className="max-w-md mx-auto">
                        <div className="login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw]">
                            <h4 className="text-[16px] lg:text-[1.1vw] font-bold mb-1 lg:mb-[0.3vw]">
                                Pay for {selected.name} Plan
                            </h4>
                            <p className="text-gray-500 text-[12px] lg:text-[0.75vw] mb-5 lg:mb-[1.5vw]">
                                Enter your card details below. Your payment is processed securely by Stripe.
                            </p>

                            <Elements stripe={stripePromise}>
                                <CheckoutForm plan={selected} onSuccess={handleSuccess} />
                            </Elements>

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="mt-3 lg:mt-[0.8vw] w-full text-center text-[12px] lg:text-[0.75vw] text-gray-500 hover:text-[#053447] transition-colors"
                            >
                                ← Back to plans
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
