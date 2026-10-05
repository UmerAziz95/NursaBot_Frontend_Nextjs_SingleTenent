'use client'

import {
    BookOpenCheck as BookOpenCheckIcon,
    CreditCard as CreditCardIcon,
    History as HistoryIcon,
    ImagePlus as ImagePlusIcon,
    LifeBuoy as LifeBuoyIcon,
    MessagesSquare as MessagesIcon,
    Mic as MicIcon,
    SlidersHorizontal as SlidersIcon,
} from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'
import SectionHeading from '@/sections/home/SectionHeading'

// Every item here is a shipped feature; optional ones follow the admin settings.
const FEATURES = [
    {
        icon: BookOpenCheckIcon,
        title: 'Grounded in study material',
        text: 'Answers draw on documents curated for your program, so explanations stay consistent with what you are learning.',
    },
    {
        icon: SlidersIcon,
        title: 'Five answer modes',
        text: 'Balanced, Short, Detailed, Simple or Exam prep — get exactly the depth you need for each question.',
    },
    {
        icon: MessagesIcon,
        title: 'Real conversations',
        text: 'Ask follow-ups like "why?" or "and in children?" — the assistant remembers the topic you are on.',
    },
    {
        icon: ImagePlusIcon,
        title: 'Ask with images',
        text: 'Attach up to five images — an ECG strip, a medication label or your lecture notes — and ask about them.',
    },
    {
        icon: MicIcon,
        title: 'Voice notes',
        text: 'Record a question of up to two minutes while you study hands-free; it is transcribed and answered.',
        setting: 'voice_chat_enabled',
    },
    {
        icon: HistoryIcon,
        title: 'Your study history',
        text: 'Every conversation is saved, grouped by date and searchable, so you can pick up where you left off.',
    },
    {
        icon: LifeBuoyIcon,
        title: 'Human support',
        text: 'Open a support ticket from inside the app and chat with our team when you need a hand.',
        setting: 'help_tickets_enabled',
    },
    {
        icon: CreditCardIcon,
        title: 'Simple, fair billing',
        text: 'Monthly plans with a clear token allowance, paid securely through Stripe — and nothing renews without you.',
    },
]

export default function BenefitsSection() {
    const { settings } = useAppSettings()
    const features = FEATURES.filter((feature) => !feature.setting || settings[feature.setting] !== false)

    return (
        <section className="nbl-section" id="features">
            <div className="nbl-container">
                <SectionHeading
                    eyebrow="Features"
                    title="Everything you need to study smarter"
                    text="One focused assistant for nursing school — from first-semester fundamentals to final NCLEX review."
                />
                <div className="nbl-features">
                    {features.map(({ icon: Icon, title, text }) => (
                        <article key={title} className="nbl-feature nbl-reveal">
                            <span className="nbl-feature-icon"><Icon className="h-5 w-5" /></span>
                            <h3 className="nbl-feature-title">{title}</h3>
                            <p className="nbl-feature-text">{text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
