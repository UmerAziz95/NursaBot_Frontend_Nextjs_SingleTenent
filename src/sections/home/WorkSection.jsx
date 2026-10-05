'use client'

import { CreditCard as CreditCardIcon, MessageCircleQuestion as AskIcon, UserPlus as UserPlusIcon } from 'lucide-react'
import SectionHeading from '@/sections/home/SectionHeading'

const STEPS = [
    {
        icon: UserPlusIcon,
        title: 'Create your account',
        text: 'Sign up with your email in under a minute — no card needed to create an account.',
    },
    {
        icon: CreditCardIcon,
        title: 'Choose a monthly plan',
        text: 'Pick the token allowance that fits how much you study. Pay once for the month; it never renews on its own.',
    },
    {
        icon: AskIcon,
        title: 'Ask anything nursing',
        text: 'Type, talk or attach an image. Pick an answer mode and get clear, structured explanations instantly.',
    },
]

export default function WorkSection() {
    return (
        <section className="nbl-section is-tinted" id="how-it-works">
            <div className="nbl-container">
                <SectionHeading
                    eyebrow="How it works"
                    title="From sign-up to your first answer in minutes"
                />
                <ol className="nbl-steps">
                    {STEPS.map(({ icon: Icon, title, text }, index) => (
                        <li key={title} className="nbl-step nbl-reveal">
                            <div className="nbl-step-top">
                                <span className="nbl-step-icon"><Icon className="h-5 w-5" /></span>
                                <span className="nbl-step-number">0{index + 1}</span>
                            </div>
                            <h3 className="nbl-step-title">{title}</h3>
                            <p className="nbl-step-text">{text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}
