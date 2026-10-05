'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
    ArrowLeft as ArrowLeftIcon,
    ArrowRight as ArrowRightIcon,
    CalendarClock as CalendarIcon,
    Check as CheckIcon,
    ChevronDown as ChevronDownIcon,
    Coins as CoinsIcon,
    CreditCard as CreditCardIcon,
    Crown as CrownIcon,
    Gem as GemIcon,
    Loader2 as LoaderIcon,
    Lock as LockIcon,
    ShieldCheck as ShieldCheckIcon,
    Sparkles as SparklesIcon,
    TriangleAlert as AlertIcon,
    Zap as ZapIcon,
} from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import './plans.css'
import { useAppSettings } from '@/lib/app-settings'
import { toast } from '@/lib/toast'
import { userFacingError, userFacingStripeError } from '@/lib/user-facing-error'

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '15px',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#94a3b8' },
            iconColor: '#1f7fa8',
        },
        invalid: { color: '#dc2626', iconColor: '#dc2626' },
    },
}

const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

const formatDate = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const oneMonthFrom = (date) => {
    const next = new Date(date)
    next.setMonth(next.getMonth() + 1)
    return next
}

const PLAN_ICONS = [ZapIcon, CrownIcon, GemIcon]

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

const FAQS = [
    {
        q: 'Does my plan renew automatically?',
        a: 'No. Each payment covers one month. When the month ends, chat pauses until you choose to reactivate — you will never be charged without taking action.',
    },
    {
        q: 'What are tokens?',
        a: 'Tokens measure how much text the assistant reads and writes. Longer questions, detailed answers and images use more tokens. Your remaining balance is shown in Settings → Plan & usage.',
    },
    {
        q: 'Can I switch plans later?',
        a: 'Yes. Buying any plan starts a fresh one-month period right away with that plan’s token allowance.',
    },
    {
        q: 'Is my card information safe?',
        a: 'Payments are processed by Stripe. Your full card number never touches our servers — we only keep the card brand, last four digits and expiry.',
    },
]

function Stepper({ step }) {
    const steps = ['Choose plan', 'Payment', 'Start learning']
    return (
        <ol className="nbp-stepper" aria-label="Checkout progress">
            {steps.map((label, index) => {
                const number = index + 1
                const state = number < step ? 'is-done' : number === step ? 'is-current' : ''
                return (
                    <li key={label} className={`nbp-step ${state}`} aria-current={number === step ? 'step' : undefined}>
                        <span className="nbp-step-dot">
                            {number < step ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : number}
                        </span>
                        <span className="nbp-step-label">{label}</span>
                    </li>
                )
            })}
        </ol>
    )
}

function CheckoutForm({ plan, onSuccess, isReactivation }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [cardComplete, setCardComplete] = useState(false)
    const [cardError, setCardError] = useState('')
    const [formError, setFormError] = useState('')

    const fail = (message) => {
        const safeMessage = userFacingError(message, GENERIC_PAYMENT_ERROR)
        setFormError(safeMessage)
        toast.error(safeMessage)
        setLoading(false)
    }

    const handlePay = async (e) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)
        setFormError('')

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
                fail(friendlyPaymentError(intentData, intentRes.status))
                return
            }

            const clientSecret = intentData?.client_secret
            if (!clientSecret) {
                fail(GENERIC_PAYMENT_ERROR)
                return
            }

            const card = elements.getElement(CardElement)
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card },
            })

            if (result.error) {
                fail(userFacingStripeError(result.error, GENERIC_PAYMENT_ERROR))
                return
            }

            const payment_intent_id = result.paymentIntent?.id || intentData?.payment_intent_id
            if (!payment_intent_id) {
                fail(GENERIC_PAYMENT_ERROR)
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
                fail(friendlyPaymentError(confirmData, confirmRes.status))
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

            onSuccess(confirmData)
        } catch (err) {
            console.error('payments.checkout_failed', err)
            fail(GENERIC_PAYMENT_ERROR)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handlePay} className="nbp-pay-form">
            <label className="nbp-label" htmlFor="nbp-card">Card details</label>
            <div id="nbp-card" className={`nbp-card-field ${cardError ? 'is-invalid' : ''} ${cardComplete ? 'is-complete' : ''}`}>
                <CardElement
                    options={CARD_ELEMENT_OPTIONS}
                    onChange={(event) => {
                        setCardComplete(Boolean(event.complete))
                        setCardError(event.error ? userFacingStripeError(event.error, '') : '')
                        if (formError) setFormError('')
                    }}
                />
            </div>
            {cardError ? (
                <div className="nbp-field-error" role="alert">
                    <AlertIcon className="h-3.5 w-3.5" />
                    {cardError}
                </div>
            ) : (
                <div className="nbp-field-hint">Card number, expiry, CVC and ZIP / postal code.</div>
            )}

            {formError && (
                <div className="nbp-form-error" role="alert">
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || loading || !cardComplete}
                className="nbp-pay-btn"
            >
                {loading ? (
                    <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        Processing payment…
                    </>
                ) : (
                    <>
                        <LockIcon className="h-4 w-4" />
                        {isReactivation ? 'Reactivate' : 'Pay'} {plan.price_display}
                    </>
                )}
            </button>

            <div className="nbp-stripe-note">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Payments are securely processed by Stripe
            </div>
        </form>
    )
}

function PlanCard({ plan, index, isSelected, isReactivation, onChoose }) {
    const Icon = PLAN_ICONS[index % PLAN_ICONS.length]
    const featured = Boolean(plan.is_highlighted)

    return (
        <article className={`nbp-plan ${featured ? 'is-featured' : ''} ${isSelected ? 'is-selected' : ''}`}>
            {featured && (
                <span className="nbp-plan-ribbon">
                    <SparklesIcon className="h-3 w-3" />
                    Most popular
                </span>
            )}
            <div className="nbp-plan-head">
                <span className="nbp-plan-icon"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0">
                    <h3 className="nbp-plan-name">{plan.name}</h3>
                    {plan.description ? <div className="nbp-plan-desc">{plan.description}</div> : null}
                </div>
            </div>

            <div className="nbp-plan-price">
                <span className="nbp-plan-amount">{plan.price_display}</span>
                <span className="nbp-plan-period">/ month</span>
            </div>

            <div className="nbp-plan-tokens">
                <CoinsIcon className="h-4 w-4" />
                <span><strong>{formatTokens(plan.monthly_token_limit)}</strong> tokens every month</span>
            </div>

            <ul className="nbp-plan-features">
                {(plan.features || []).map((feature) => (
                    <li key={feature}>
                        <span className="nbp-check" aria-hidden="true"><CheckIcon className="h-3 w-3" strokeWidth={3} /></span>
                        {feature}
                    </li>
                ))}
            </ul>

            <button type="button" onClick={() => onChoose(plan)} className="nbp-plan-cta">
                {isReactivation ? `Reactivate ${plan.name}` : `Choose ${plan.name}`}
                <ArrowRightIcon className="h-4 w-4" />
            </button>
        </article>
    )
}

export default function PlansPage() {
    const [plans, setPlans] = useState([])
    const [selected, setSelected] = useState(null)
    const [stripeKey, setStripeKey] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadFailed, setLoadFailed] = useState(false)
    const [purchase, setPurchase] = useState(null)
    const [openFaq, setOpenFaq] = useState(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'NursingAI'
    const reason = searchParams.get('reason') || ''
    const preferredPlan = searchParams.get('plan') || ''
    const isReactivation = reason === 'expired'

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setLoadFailed(false)
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
            } catch (err) {
                console.error('plans.load_failed', err)
                if (!cancelled) {
                    setLoadFailed(true)
                    toast.error('We could not load plans right now. Please try again.')
                }
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

    const choosePlan = (plan) => {
        setSelected(plan)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSuccess = (confirmData) => {
        setPurchase({ plan: selected, subscription: confirmData?.subscription || null })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const step = purchase ? 3 : selected ? 2 : 1
    const periodStart = new Date()
    const periodEnd = oneMonthFrom(periodStart)

    return (
        <div className="user-portal nbp-page">
            <div className="nbp-bg" aria-hidden="true" />

            <header className="nbp-header">
                <div className="nbp-header-inner">
                    <Link href="/assistant" className="nbp-brand">
                        <BrandMark size="md" />
                        <span className="nbp-brand-name">{siteName}</span>
                    </Link>
                    <Stepper step={step} />
                    <Link href="/assistant" className="nbp-header-link">
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span>Back to chat</span>
                    </Link>
                </div>
            </header>

            <main className="nbp-main">
                {purchase ? (
                    <section className="nbp-success" aria-live="polite">
                        <div className="nbp-success-badge"><CheckIcon className="h-8 w-8" strokeWidth={3} /></div>
                        <h1 className="nbp-title">You&apos;re all set!</h1>
                        <div className="nbp-subtitle">
                            Your <strong>{purchase.plan?.name}</strong> plan is active. Chat is unlocked — let&apos;s get studying.
                        </div>
                        <div className="nbp-success-card">
                            <div><span>Plan</span><strong>{purchase.plan?.name}</strong></div>
                            <div><span>Tokens</span><strong>{formatTokens(purchase.plan?.monthly_token_limit)} / month</strong></div>
                            <div><span>Active until</span><strong>{formatDate(purchase.subscription?.current_period_end ? new Date(purchase.subscription.current_period_end) : periodEnd)}</strong></div>
                        </div>
                        <button type="button" onClick={() => router.push('/assistant')} className="nbp-pay-btn is-inline">
                            Start chatting
                            <ArrowRightIcon className="h-4 w-4" />
                        </button>
                        <div className="nbp-muted">You can review your plan and usage anytime in Settings → Plan &amp; usage.</div>
                    </section>
                ) : selected ? (
                    <section className="nbp-checkout">
                        <button type="button" onClick={() => setSelected(null)} className="nbp-back">
                            <ArrowLeftIcon className="h-4 w-4" />
                            All plans
                        </button>
                        <div className="nbp-checkout-head">
                            <h1 className="nbp-title is-left">{isReactivation ? 'Reactivate your plan' : 'Complete your purchase'}</h1>
                            <div className="nbp-subtitle is-left">One payment, one month of access. Nothing renews automatically.</div>
                        </div>

                        <div className="nbp-checkout-grid">
                            <aside className="nbp-summary">
                                <div className="nbp-summary-plan">
                                    <span className="nbp-plan-icon is-light"><CrownIcon className="h-5 w-5" /></span>
                                    <div className="min-w-0 flex-1">
                                        <div className="nbp-summary-kicker">Your plan</div>
                                        <div className="nbp-summary-name">{selected.name}</div>
                                    </div>
                                    <button type="button" className="nbp-summary-change" onClick={() => setSelected(null)}>Change</button>
                                </div>

                                <ul className="nbp-summary-list">
                                    <li><CoinsIcon className="h-4 w-4" /><span>Monthly tokens</span><strong>{formatTokens(selected.monthly_token_limit)}</strong></li>
                                    <li><CalendarIcon className="h-4 w-4" /><span>Access period</span><strong>{formatDate(periodStart)} – {formatDate(periodEnd)}</strong></li>
                                    <li><ShieldCheckIcon className="h-4 w-4" /><span>Auto-renew</span><strong>Off</strong></li>
                                </ul>

                                {(selected.features || []).length > 0 && (
                                    <ul className="nbp-summary-features">
                                        {selected.features.map((feature) => (
                                            <li key={feature}><CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />{feature}</li>
                                        ))}
                                    </ul>
                                )}

                                <div className="nbp-summary-total">
                                    <span>Total due today</span>
                                    <strong>{selected.price_display}</strong>
                                </div>
                            </aside>

                            <div className="nbp-payment">
                                <div className="nbp-payment-head">
                                    <span className="nbp-plan-icon"><CreditCardIcon className="h-5 w-5" /></span>
                                    <div>
                                        <h2 className="nbp-payment-title">Payment details</h2>
                                        <div className="nbp-muted">Pay securely with your credit or debit card.</div>
                                    </div>
                                </div>

                                {!stripePromise ? (
                                    <div className="nbp-form-error">
                                        <AlertIcon className="h-4 w-4 shrink-0" />
                                        <span>Card payments are temporarily unavailable. Please try again later or contact support.</span>
                                    </div>
                                ) : (
                                    <Elements stripe={stripePromise}>
                                        <CheckoutForm
                                            plan={selected}
                                            onSuccess={handleSuccess}
                                            isReactivation={isReactivation}
                                        />
                                    </Elements>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="nbp-hero">
                            <span className="nbp-kicker"><SparklesIcon className="h-3.5 w-3.5" />Pricing</span>
                            <h1 className="nbp-title">
                                {isReactivation ? 'Pick up right where you left off' : 'Study smarter for your NCLEX'}
                            </h1>
                            <div className="nbp-subtitle">
                                {isReactivation
                                    ? 'Your previous month has ended and chat is paused. Reactivate to start a fresh month — nothing renews automatically.'
                                    : `Choose a monthly plan to unlock ${siteName}. Simple pricing, no subscriptions that renew behind your back.`}
                            </div>
                        </section>

                        {(isReactivation || reason === 'required') && (
                            <div className={`nbp-banner ${isReactivation ? 'is-warning' : ''}`}>
                                <AlertIcon className="h-4 w-4 shrink-0" />
                                <span>
                                    {isReactivation
                                        ? 'Chat is locked until you reactivate. After payment, a fresh monthly period starts and chat unlocks immediately.'
                                        : 'A plan is required to start chatting. Choose one below to unlock the assistant.'}
                                </span>
                            </div>
                        )}

                        {loading ? (
                            <div className="nbp-plans" aria-busy="true">
                                {[0, 1, 2].map((i) => <div key={i} className="nbp-plan is-skeleton" />)}
                            </div>
                        ) : loadFailed || plans.length === 0 ? (
                            <div className="nbp-empty">
                                <AlertIcon className="h-5 w-5" />
                                <div>
                                    <strong>{loadFailed ? 'We couldn’t load plans' : 'No plans available right now'}</strong>
                                    <span>{loadFailed ? 'Check your connection and refresh the page.' : 'Please check back soon.'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="nbp-plans">
                                {plans.map((plan, index) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        index={index}
                                        isSelected={selected?.id === plan.id}
                                        isReactivation={isReactivation}
                                        onChoose={choosePlan}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="nbp-trust">
                            <div><LockIcon className="h-4 w-4" /><span><strong>Secure checkout</strong>Payments processed by Stripe</span></div>
                            <div><CalendarIcon className="h-4 w-4" /><span><strong>No auto-renew</strong>Pay month to month, only when you choose</span></div>
                            <div><ZapIcon className="h-4 w-4" /><span><strong>Instant access</strong>Chat unlocks the moment you pay</span></div>
                        </div>

                        <section className="nbp-faq">
                            <h2 className="nbp-faq-title">Frequently asked questions</h2>
                            {FAQS.map((item, index) => {
                                const open = openFaq === index
                                return (
                                    <div key={item.q} className={`nbp-faq-item ${open ? 'is-open' : ''}`}>
                                        <button
                                            type="button"
                                            className="nbp-faq-q"
                                            aria-expanded={open}
                                            onClick={() => setOpenFaq(open ? -1 : index)}
                                        >
                                            {item.q}
                                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                                        </button>
                                        {open && <div className="nbp-faq-a">{item.a}</div>}
                                    </div>
                                )
                            })}
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}
