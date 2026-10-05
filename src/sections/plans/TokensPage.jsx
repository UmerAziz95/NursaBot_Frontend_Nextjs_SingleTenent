'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import {
    ArrowLeft as ArrowLeftIcon,
    ArrowRight as ArrowRightIcon,
    Check as CheckIcon,
    Coins as CoinsIcon,
    CreditCard as CreditCardIcon,
    Crown as CrownIcon,
    Infinity as InfinityIcon,
    Loader2 as LoaderIcon,
    Lock as LockIcon,
    PlusCircle as PlusCircleIcon,
    Receipt as ReceiptIcon,
    ShieldCheck as ShieldCheckIcon,
    TriangleAlert as AlertIcon,
} from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import './plans.css'
import './tokens.css'
import { useAppSettings } from '@/lib/app-settings'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import { userFacingError, userFacingStripeError } from '@/lib/user-facing-error'

const GENERIC_PAYMENT_ERROR = 'We could not process your payment right now. Please try again or contact support.'
const PRESETS = [250_000, 500_000, 1_000_000, 2_000_000, 5_000_000]

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

const fullNumber = (value) => Number(value || 0).toLocaleString()

const shortTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
    return String(n)
}

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`

const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Client-side estimate; the server re-prices every order before charging. */
const estimateCents = (tokens, pricing) =>
    pricing ? Math.ceil((Number(tokens || 0) * Number(pricing.price_per_million_cents || 0)) / 1_000_000) : 0

const quantityError = (tokens, pricing) => {
    if (!pricing) return ''
    if (!Number.isFinite(tokens) || tokens <= 0) return 'Enter how many tokens you want.'
    if (tokens < pricing.min_tokens) return `The minimum purchase is ${fullNumber(pricing.min_tokens)} tokens.`
    if (tokens > pricing.max_tokens) return `The maximum purchase is ${fullNumber(pricing.max_tokens)} tokens.`
    if (tokens % 1000 !== 0) return 'Tokens are sold in multiples of 1,000.'
    return ''
}

async function readJson(res, fallback) {
    const data = await res.json().catch(() => null)
    if (!res.ok) {
        const error = new Error(userFacingError(data?.detail, fallback))
        error.code = data?.code
        throw error
    }
    return data
}

function TokenCheckoutForm({ tokens, amountCents, disabled, onSuccess }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [cardComplete, setCardComplete] = useState(false)
    const [cardError, setCardError] = useState('')
    const [formError, setFormError] = useState('')

    const fail = (message) => {
        setFormError(message)
        toast.error(message)
        setLoading(false)
    }

    const handlePay = async (event) => {
        event.preventDefault()
        if (!stripe || !elements || disabled) return
        setLoading(true)
        setFormError('')

        try {
            const intent = await readJson(
                await fetchLaravel('/api/payments/tokens/create-intent', { method: 'POST', body: JSON.stringify({ tokens }) }),
                GENERIC_PAYMENT_ERROR,
            )
            if (!intent?.client_secret || !intent?.order?.id) return fail(GENERIC_PAYMENT_ERROR)

            const result = await stripe.confirmCardPayment(intent.client_secret, {
                payment_method: { card: elements.getElement(CardElement) },
            })
            if (result.error) return fail(userFacingStripeError(result.error, GENERIC_PAYMENT_ERROR))

            const confirmed = await readJson(
                await fetchLaravel('/api/payments/tokens/confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        order_id: intent.order.id,
                        payment_intent_id: result.paymentIntent?.id || intent.payment_intent_id,
                    }),
                }),
                GENERIC_PAYMENT_ERROR,
            )
            onSuccess(confirmed)
        } catch (err) {
            console.error('payments.tokens.checkout_failed', err)
            fail(err?.message || GENERIC_PAYMENT_ERROR)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handlePay} className="nbp-pay-form">
            <label className="nbp-label" htmlFor="nbt-card">Card details</label>
            <div id="nbt-card" className={`nbp-card-field ${cardError ? 'is-invalid' : ''} ${cardComplete ? 'is-complete' : ''}`}>
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
                <div className="nbp-field-error" role="alert"><AlertIcon className="h-3.5 w-3.5" />{cardError}</div>
            ) : (
                <div className="nbp-field-hint">Card number, expiry, CVC and ZIP / postal code.</div>
            )}

            {formError && (
                <div className="nbp-form-error" role="alert">
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                </div>
            )}

            <button type="submit" disabled={!stripe || loading || !cardComplete || disabled} className="nbp-pay-btn">
                {loading ? (
                    <><LoaderIcon className="h-4 w-4 animate-spin" />Processing payment…</>
                ) : (
                    <><LockIcon className="h-4 w-4" />Pay {money(amountCents)}</>
                )}
            </button>

            <div className="nbp-stripe-note">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Payments are securely processed by Stripe
            </div>
        </form>
    )
}

function BalanceStrip({ subscription }) {
    const planLeft = subscription?.is_active ? Number(subscription?.tokens_remaining || 0) : 0
    const extraLeft = Number(subscription?.extra_tokens_remaining || 0)
    return (
        <div className="nbt-balances">
            <div className="nbt-balance">
                <span className="nbt-balance-icon"><CrownIcon className="h-4 w-4" /></span>
                <div>
                    <div className="nbt-balance-label">Plan tokens left</div>
                    <div className="nbt-balance-value">{fullNumber(planLeft)}</div>
                    <div className="nbt-balance-hint">of {fullNumber(subscription?.tokens_included)} this month</div>
                </div>
            </div>
            <div className="nbt-balance">
                <span className="nbt-balance-icon is-extra"><PlusCircleIcon className="h-4 w-4" /></span>
                <div>
                    <div className="nbt-balance-label">Extra tokens left</div>
                    <div className="nbt-balance-value">{fullNumber(extraLeft)}</div>
                    <div className="nbt-balance-hint">of {fullNumber(subscription?.extra_tokens_total)} purchased</div>
                </div>
            </div>
            <div className="nbt-balance is-total">
                <span className="nbt-balance-icon is-total"><CoinsIcon className="h-4 w-4" /></span>
                <div>
                    <div className="nbt-balance-label">Total available</div>
                    <div className="nbt-balance-value">{fullNumber(planLeft + extraLeft)}</div>
                    <div className="nbt-balance-hint">Plan tokens are used first</div>
                </div>
            </div>
        </div>
    )
}

export default function TokensPage() {
    const router = useRouter()
    const outOfTokens = useSearchParams().get('reason') === 'quota'
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'nclexium'

    const [overview, setOverview] = useState(null)
    const [loadFailed, setLoadFailed] = useState(false)
    const [stripeKey, setStripeKey] = useState('')
    const [tokens, setTokens] = useState(0)
    const [input, setInput] = useState('')
    const [quote, setQuote] = useState(null)
    const [receipt, setReceipt] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        Promise.all([
            fetchLaravel('/api/payments/tokens').then((res) => readJson(res, 'We could not load token pricing.')),
            fetch('/backend/api/payments/publishable-key', { headers: { Accept: 'application/json' } }).then((res) => res.json()).catch(() => null),
        ])
            .then(([data, keyData]) => {
                if (cancelled) return
                setOverview(data)
                setLoadFailed(false)
                setStripeKey(keyData?.publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
                const pricing = data?.pricing
                if (pricing) {
                    setTokens((current) => {
                        if (current) return current
                        const start = Math.max(pricing.min_tokens, 500_000)
                        setInput(String(start))
                        return start
                    })
                }
            })
            .catch((err) => {
                if (cancelled) return
                console.error('tokens.load_failed', err)
                setLoadFailed(true)
            })
        return () => { cancelled = true }
    }, [reloadKey])

    const pricing = overview?.pricing || null
    const error = quantityError(tokens, pricing)

    // Ask the server for the exact price (debounced) so the button matches the charge.
    useEffect(() => {
        if (!pricing || error) return undefined
        let cancelled = false
        const timer = window.setTimeout(() => {
            fetchLaravel(`/api/payments/tokens/quote?tokens=${tokens}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => { if (!cancelled && data) setQuote(data) })
                .catch(() => {})
        }, 250)
        return () => { cancelled = true; window.clearTimeout(timer) }
    }, [tokens, pricing, error])

    const amountCents = quote && quote.tokens === tokens ? quote.amount_cents : estimateCents(tokens, pricing)
    const presets = useMemo(
        () => (pricing ? [pricing.min_tokens, ...PRESETS.filter((n) => n > pricing.min_tokens)].slice(0, 5) : []),
        [pricing],
    )
    const stripePromise = useMemo(() => (stripeKey ? loadStripe(stripeKey) : null), [stripeKey])

    const choose = (value) => {
        setTokens(value)
        setInput(String(value))
    }

    const handleSuccess = (data) => {
        setReceipt(data)
        setReloadKey((n) => n + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        toast.success(`${fullNumber(data?.order?.tokens)} tokens added to your account.`)
    }

    const subscription = receipt?.subscription || overview?.subscription
    const orders = overview?.orders || []

    return (
        <div className="user-portal nbp-page">
            <div className="nbp-bg" aria-hidden="true" />

            <header className="nbp-header">
                <div className="nbp-header-inner">
                    <Link href="/assistant" className="nbp-brand">
                        <BrandMark size="md" />
                        <span className="nbp-brand-name">{siteName}</span>
                    </Link>
                    <span className="nbt-header-title"><CoinsIcon className="h-4 w-4" />Buy tokens</span>
                    <Link href="/assistant" className="nbp-header-link">
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span>Back to chat</span>
                    </Link>
                </div>
            </header>

            <main className="nbp-main">
                {!overview && !loadFailed ? (
                    <div className="nbt-loading"><LoaderIcon className="h-5 w-5 animate-spin" />Loading token pricing…</div>
                ) : loadFailed ? (
                    <div className="nbp-empty">
                        <AlertIcon className="h-5 w-5" />
                        <div>
                            <strong>We couldn’t load token pricing</strong>
                            <span>Check your connection and try again.</span>
                        </div>
                        <button type="button" className="nbp-plan-cta" onClick={() => { setLoadFailed(false); setReloadKey((n) => n + 1) }}>Retry</button>
                    </div>
                ) : receipt ? (
                    <section className="nbp-success" aria-live="polite">
                        <div className="nbp-success-badge"><CheckIcon className="h-8 w-8" strokeWidth={3} /></div>
                        <h1 className="nbp-title">Tokens added!</h1>
                        <div className="nbp-subtitle">
                            <strong>{fullNumber(receipt.order?.tokens)}</strong> extra tokens are ready to use. They’re spent after your plan tokens.
                        </div>
                        <div className="nbp-success-card">
                            <div><span>Order</span><strong>{receipt.order?.order_number}</strong></div>
                            <div><span>Paid</span><strong>{receipt.order?.amount_display}</strong></div>
                            <div><span>Total available now</span><strong>{fullNumber(receipt.subscription?.total_tokens_available)}</strong></div>
                        </div>
                        <div className="nbt-success-actions">
                            <button type="button" onClick={() => router.push('/assistant')} className="nbp-pay-btn is-inline">
                                Back to chat
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setReceipt(null)} className="nbt-link-btn">Buy more tokens</button>
                        </div>
                    </section>
                ) : !overview.can_buy ? (
                    <section className="nbp-success">
                        <div className="nbp-success-badge is-muted"><CrownIcon className="h-8 w-8" /></div>
                        <h1 className="nbp-title">Choose a plan first</h1>
                        <div className="nbp-subtitle">
                            Extra tokens top up an active plan. Pick a monthly plan, and you can add tokens any time it runs low.
                        </div>
                        <Link href="/plans" className="nbp-pay-btn is-inline">
                            View plans
                            <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </section>
                ) : (
                    <section className="nbp-checkout">
                        <div className="nbp-checkout-head">
                            <h1 className="nbp-title is-left">Top up your tokens</h1>
                            <div className="nbp-subtitle is-left">
                                Ran low before the month ends? Add tokens at your <strong>{pricing.plan_name}</strong> plan rate of{' '}
                                <strong>{money(pricing.price_per_million_cents)}</strong> per 1M tokens. No subscription change.
                            </div>
                        </div>

                        {outOfTokens && (
                            <div className="nbp-banner is-warning nbt-banner">
                                <AlertIcon className="h-4 w-4 shrink-0" />
                                <span>You’ve used all of your tokens, so chat is paused. Top up below and you can keep chatting right away.</span>
                            </div>
                        )}

                        <BalanceStrip subscription={subscription} />

                        <div className="nbp-checkout-grid">
                            <aside className="nbp-summary">
                                <div className="nbp-summary-plan">
                                    <span className="nbp-plan-icon is-light"><CoinsIcon className="h-5 w-5" /></span>
                                    <div className="min-w-0 flex-1">
                                        <div className="nbp-summary-kicker">How many tokens?</div>
                                        <div className="nbp-summary-name">{shortTokens(tokens)} tokens</div>
                                    </div>
                                </div>

                                <div className="nbt-presets" role="group" aria-label="Token amount">
                                    {presets.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`nbt-preset ${tokens === value ? 'is-active' : ''}`}
                                            onClick={() => choose(value)}
                                        >
                                            <strong>{shortTokens(value)}</strong>
                                            <span>{money(estimateCents(value, pricing))}</span>
                                        </button>
                                    ))}
                                </div>

                                <label className="nbp-label" htmlFor="nbt-amount">Or enter an amount</label>
                                <div className={`nbt-input ${error ? 'is-invalid' : ''}`}>
                                    <input
                                        id="nbt-amount"
                                        type="number"
                                        inputMode="numeric"
                                        min={pricing.min_tokens}
                                        max={pricing.max_tokens}
                                        step={1000}
                                        value={input}
                                        onChange={(event) => {
                                            setInput(event.target.value)
                                            setTokens(Math.floor(Number(event.target.value) || 0))
                                        }}
                                    />
                                    <span>tokens</span>
                                </div>
                                {error ? (
                                    <div className="nbp-field-error" role="alert"><AlertIcon className="h-3.5 w-3.5" />{error}</div>
                                ) : (
                                    <div className="nbp-field-hint">Minimum {fullNumber(pricing.min_tokens)} tokens, in steps of 1,000.</div>
                                )}

                                <ul className="nbp-summary-list">
                                    <li><CrownIcon className="h-4 w-4" /><span>Rate ({pricing.plan_name} plan)</span><strong>{money(pricing.price_per_million_cents)} / 1M</strong></li>
                                    <li><CoinsIcon className="h-4 w-4" /><span>Tokens</span><strong>{error ? '—' : fullNumber(tokens)}</strong></li>
                                    <li><InfinityIcon className="h-4 w-4" /><span>Expiry</span><strong>Never*</strong></li>
                                </ul>

                                <div className="nbp-summary-total">
                                    <span>Total due today</span>
                                    <strong>{error ? '—' : money(amountCents)}</strong>
                                </div>
                                <div className="nbt-footnote">* Extra tokens carry over between months and are used while you have an active plan.</div>
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
                                        <TokenCheckoutForm
                                            tokens={tokens}
                                            amountCents={amountCents}
                                            disabled={Boolean(error)}
                                            onSuccess={handleSuccess}
                                        />
                                    </Elements>
                                )}
                            </div>
                        </div>

                        {orders.length > 0 && (
                            <section className="nbt-orders">
                                <h2 className="nbt-orders-title"><ReceiptIcon className="h-4 w-4" />Your token orders</h2>
                                <div className="nbt-orders-table">
                                    <div className="nbt-orders-row is-head">
                                        <span>Order</span><span>Date</span><span>Tokens</span><span>Left</span><span>Paid</span>
                                    </div>
                                    {orders.map((order) => (
                                        <div key={order.id} className="nbt-orders-row">
                                            <span className="nbt-order-no">{order.order_number}</span>
                                            <span>{formatDate(order.paid_at)}</span>
                                            <span>{fullNumber(order.tokens)}</span>
                                            <span>{fullNumber(order.tokens_remaining)}</span>
                                            <span>{order.amount_display}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </section>
                )}
            </main>
        </div>
    )
}
