'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from '@/lib/toast'

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

const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

const apiBase = () => '/backend'

const GENERIC_PAYMENT_ERROR = 'We could not process your payment right now. Please try again or contact support.'

const friendlyPaymentError = (data, status) => {
    const code = String(data?.code || '').toLowerCase()

    if (code === 'token_quota_exceeded' || code === 'subscription_required' || code === 'subscription_expired') {
        return String(data?.message || GENERIC_PAYMENT_ERROR)
    }

    if (status === 402 && data?.detail) {
        return String(data.detail)
    }

    return GENERIC_PAYMENT_ERROR
}

function CheckoutForm({ plan, onSuccess, isReactivation }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)

    const handlePay = async (e) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }

            const intentRes = await fetch(`${apiBase()}/api/payments/create-intent`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ plan: plan.slug, plan_id: plan.id }),
            })

            const intentData = await intentRes.json().catch(() => null)
            if (!intentRes.ok) {
                console.error('payments.create_intent_failed', intentRes.status, intentData)
                toast.error(friendlyPaymentError(intentData, intentRes.status))
                setLoading(false)
                return
            }

            const clientSecret = intentData?.client_secret
            if (!clientSecret) {
                toast.error(GENERIC_PAYMENT_ERROR)
                setLoading(false)
                return
            }

            const card = elements.getElement(CardElement)
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card },
            })

            if (result.error) {
                toast.error(result.error.message || GENERIC_PAYMENT_ERROR)
                setLoading(false)
                return
            }

            const payment_intent_id = result.paymentIntent?.id || intentData?.payment_intent_id
            if (!payment_intent_id) {
                toast.error(GENERIC_PAYMENT_ERROR)
                setLoading(false)
                return
            }

            const confirmRes = await fetch(`${apiBase()}/api/payments/confirm-plan`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    plan: plan.slug,
                    plan_id: plan.id,
                    payment_intent_id,
                }),
            })

            const confirmData = await confirmRes.json().catch(() => null)
            if (!confirmRes.ok) {
                console.error('payments.confirm_failed', confirmRes.status, confirmData)
                toast.error(friendlyPaymentError(confirmData, confirmRes.status))
                setLoading(false)
                return
            }

            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                localStorage.setItem('user', JSON.stringify({
                    ...user,
                    plan: confirmData.plan || plan.slug,
                }))
                if (confirmData.subscription) {
                    localStorage.setItem('subscription', JSON.stringify(confirmData.subscription))
                }
                if (confirmData.payment_method) {
                    localStorage.setItem('payment_method', JSON.stringify(confirmData.payment_method))
                }
            } catch (_) { /* ignore */ }

            onSuccess()
        } catch (err) {
            console.error('payments.checkout_failed', err)
            toast.error(GENERIC_PAYMENT_ERROR)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handlePay} className="space-y-4">
            <div className="border border-gray-300 rounded-lg px-4 py-3 bg-white">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>

            <button
                type="submit"
                disabled={!stripe || loading}
                className="btn-primary min-w-full! block py-3 text-center font-bold"
            >
                {loading
                    ? 'Processing…'
                    : isReactivation
                        ? `Reactivate · ${plan.price_display}/month`
                        : `Pay ${plan.price_display}/month`}
            </button>
            <p className="text-[11px] text-gray-500 text-center">
                Starts a new 1-month period. Subscriptions do not auto-renew — you&apos;ll reactivate manually next month.
            </p>
        </form>
    )
}

export default function PlansPage() {
    const [plans, setPlans] = useState([])
    const [selected, setSelected] = useState(null)
    const [stripeKey, setStripeKey] = useState('')
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason') || ''
    const preferredPlan = searchParams.get('plan') || ''
    const isReactivation = reason === 'expired'

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            try {
                const [plansRes, keyRes] = await Promise.all([
                    fetch(`${apiBase()}/api/plans`, { headers: { Accept: 'application/json' } }),
                    fetch(`${apiBase()}/api/payments/publishable-key`, { headers: { Accept: 'application/json' } }),
                ])
                const plansData = await plansRes.json().catch(() => null)
                const keyData = await keyRes.json().catch(() => null)
                if (cancelled) return

                const nextPlans = Array.isArray(plansData?.plans) ? plansData.plans : []
                setPlans(nextPlans)
                const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
                setStripeKey(keyData?.publishable_key || envKey || '')

                if (preferredPlan) {
                    const match = nextPlans.find((plan) => plan.slug === preferredPlan)
                    if (match) setSelected(match)
                }

                if (!nextPlans.length) {
                    toast.error('No plans are available right now. Please check back soon.')
                }
            } catch (err) {
                console.error('plans.load_failed', err)
                if (!cancelled) toast.error('We could not load plans right now. Please try again.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [preferredPlan])

    const stripePromise = useMemo(
        () => (stripeKey ? loadStripe(stripeKey) : null),
        [stripeKey]
    )

    const handleSuccess = () => {
        router.push('/assistant')
    }

    return (
        <div className="user-portal min-h-screen flex items-center py-10 px-4 bg-[#F4F7FA]">
            <div className="w-full max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <h2 className="user-portal-plans-title mb-2">
                        {isReactivation ? 'Reactivate Your Monthly Plan' : 'Choose Your Monthly Plan'}
                    </h2>
                    <p className="user-portal-page-desc">
                        {isReactivation
                            ? 'Your previous period ended and chat is paused. Pay to start a new month — nothing renews automatically.'
                            : 'Plans are priced monthly by token quota. Pay securely on this site, then start chatting.'}
                    </p>
                </div>

                {isReactivation && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Chat stays locked until you reactivate. After payment, a fresh monthly period starts and chatting unlocks immediately.
                    </div>
                )}

                {loading && <p className="text-center text-sm text-gray-500">Loading plans…</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelected(plan)}
                            className={`login-form rounded-2xl shadow-2xl p-6 cursor-pointer transition-all border-2 ${
                                selected?.id === plan.id
                                    ? 'border-[#053447]'
                                    : plan.is_highlighted
                                        ? 'border-[#2EAADB]'
                                        : 'border-transparent'
                            }`}
                        >
                            {plan.is_highlighted && (
                                <span className="inline-block mb-3 text-[11px] font-bold uppercase tracking-widest text-[#2EAADB]">
                                    Most Popular
                                </span>
                            )}
                            <h3 className="user-portal-plans-card-title mb-1">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-2">
                                <span className="user-portal-plans-price">{plan.price_display}</span>
                                <span className="user-portal-page-desc mb-1">/month</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
                                {formatTokens(plan.monthly_token_limit)} tokens / month
                                {' · '}
                                {plan.markup_multiplier}× OpenAI rate
                            </p>
                            <ul className="space-y-2 mb-6">
                                {(plan.features || []).map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                                        <svg className="w-4 h-4 text-[#2EAADB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelected(plan) }}
                                className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                                    selected?.id === plan.id
                                        ? 'btn-primary'
                                        : 'border border-[#053447] text-[#053447] hover:bg-[#053447] hover:text-white'
                                }`}
                            >
                                {selected?.id === plan.id
                                    ? 'Selected'
                                    : isReactivation
                                        ? 'Reactivate'
                                        : 'Choose Plan'}
                            </button>
                        </div>
                    ))}
                </div>

                {selected && (
                    <div className="max-w-md mx-auto">
                        <div className="login-form rounded-2xl shadow-2xl p-6">
                            <h4 className="user-portal-section-title mb-1">
                                {isReactivation ? `Reactivate ${selected.name}` : `Pay for ${selected.name}`}
                            </h4>
                            <p className="text-gray-500 text-xs mb-5">
                                {selected.price_display}/month · {formatTokens(selected.monthly_token_limit)} tokens included
                            </p>

                            {!stripePromise ? (
                                <p className="text-sm text-slate-600">
                                    Card payments are temporarily unavailable. Please try again later or contact support.
                                </p>
                            ) : (
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm
                                        plan={selected}
                                        onSuccess={handleSuccess}
                                        isReactivation={isReactivation}
                                    />
                                </Elements>
                            )}

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="mt-3 w-full text-center text-xs text-gray-500 hover:text-[#053447]"
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
