'use client'

import { useEffect, useRef, useState } from 'react'
import {
    ArrowUp as ArrowUpIcon,
    ChevronDown as ChevronDownIcon,
    GraduationCap as GraduationCapIcon,
    ImagePlus as ImagePlusIcon,
    Mic as MicIcon,
    SquarePen as SquarePenIcon,
} from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import ChatMarkdown from '@/sections/assistant/ChatMarkdown'

const QUESTION = 'What are the priority nursing interventions for a patient in DKA?'

const ANSWER = `**Priority order (ABCs → fluids → insulin → potassium):**

1. **Restore fluid volume** — start 0.9% normal saline as ordered; monitor hourly I&O.
2. **Start an IV regular insulin infusion** — check glucose every hour.
3. **Watch potassium closely** — insulin shifts K⁺ into cells; *hold insulin if K⁺ < 3.3 mEq/L*.

> **NCLEX tip:** fluids come before insulin — insulin without fluids can worsen shock.`

const RECENT = ['Priority interventions for DKA', 'Cardiac meds practice quiz', 'Left vs right heart failure']

// A faithful, non-interactive replica of the real chat screen, built from the
// same components and styles the app uses (nb-* classes), so it never drifts.
export default function ChatPreview({ siteName = 'NursingAI' }) {
    const rootRef = useRef(null)
    const [step, setStep] = useState(0) // 0 empty · 1 question · 2 thinking · 3 answer

    useEffect(() => {
        const el = rootRef.current
        if (!el) return undefined
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        const timers = []
        let started = false

        const play = () => {
            if (started) return
            started = true
            if (reduced) {
                setStep(3)
                return
            }
            timers.push(setTimeout(() => setStep(1), 300))
            timers.push(setTimeout(() => setStep(2), 1100))
            timers.push(setTimeout(() => setStep(3), 2600))
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                play()
                observer.disconnect()
            }
        }, { threshold: 0.35 })
        observer.observe(el)

        return () => {
            observer.disconnect()
            timers.forEach(clearTimeout)
        }
    }, [])

    return (
        <div ref={rootRef} className="nbl-preview" role="img" aria-label={`Preview of the ${siteName} chat: a nursing question answered in Exam prep mode`}>
            <div className="nbl-preview-chrome" aria-hidden="true">
                <span /><span /><span />
                <div className="nbl-preview-url">{siteName.toLowerCase().replace(/\s+/g, '')} · Chat</div>
            </div>

            <div className="nbl-preview-app" aria-hidden="true">
                <aside className="nbl-preview-sidebar">
                    <div className="nbl-preview-brand">
                        <BrandMark size="sm" />
                        <span>{siteName}</span>
                    </div>
                    <div className="nbl-preview-newchat"><SquarePenIcon className="h-3.5 w-3.5" />New chat</div>
                    <div className="nbl-preview-label">Today</div>
                    {RECENT.map((title, index) => (
                        <div key={title} className={`nbl-preview-item ${index === 0 ? 'is-active' : ''}`}>{title}</div>
                    ))}
                </aside>

                <div className="nb-chat nbl-preview-chat">
                    <div className="nb-topbar nbl-preview-topbar">
                        <div className="nb-topbar-main">
                            <div className="nb-topbar-title">{step >= 1 ? 'Priority interventions for DKA' : 'New conversation'}</div>
                            <div className="nb-topbar-meta">
                                <span className={`nb-status-chip ${step === 2 ? 'is-busy' : ''}`}>
                                    <span className="nb-status-chip-dot" />
                                    {step === 2 ? 'Thinking' : 'Ready'}
                                </span>
                            </div>
                        </div>
                        <span className="nb-topbar-avatar">ST</span>
                    </div>

                    <div className="nbl-preview-thread">
                        {step >= 1 && (
                            <div className="nb-msg nb-msg-user">
                                <div className="nb-msg-user-bubble">{QUESTION}</div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="nb-msg nb-msg-ai">
                                <BrandMark size="sm" pulse />
                                <div className="nb-thinking">
                                    <span className="nb-thinking-dots"><span /><span /><span /></span>
                                    Thinking…
                                </div>
                            </div>
                        )}
                        {step >= 3 && (
                            <div className="nb-msg nb-msg-ai">
                                <BrandMark size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="nb-msg-head">
                                        <span className="nb-msg-author">{siteName}</span>
                                        <span className="nb-msg-mode">Exam prep</span>
                                    </div>
                                    <ChatMarkdown>{ANSWER}</ChatMarkdown>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="nbl-preview-dock">
                        <div className="nb-composer">
                            <div className="nb-composer-input nbl-preview-placeholder">Ask {siteName} anything about nursing…</div>
                            <div className="nb-composer-toolbar">
                                <div className="flex items-center gap-1">
                                    <span className="nb-mode-trigger is-custom">
                                        <GraduationCapIcon className="h-4 w-4" />
                                        <span className="nb-mode-trigger-label">Exam prep</span>
                                        <ChevronDownIcon className="nb-mode-trigger-chevron h-3.5 w-3.5" />
                                    </span>
                                    <span className="nb-composer-toolbar-sep" />
                                    <span className="nb-composer-tool"><ImagePlusIcon className="h-[18px] w-[18px]" /></span>
                                    <span className="nb-composer-tool"><MicIcon className="h-[18px] w-[18px]" /></span>
                                </div>
                                <span className="nb-composer-send"><ArrowUpIcon className="h-4 w-4" strokeWidth={2.5} /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
