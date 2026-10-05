'use client'

import { CalendarX2 as CalendarIcon, GraduationCap as GraduationIcon, Lock as LockIcon, ShieldCheck as ShieldIcon } from 'lucide-react'
import SectionHeading from '@/sections/home/SectionHeading'

const POINTS = [
    {
        icon: GraduationIcon,
        title: 'A study aid, not a clinician',
        text: 'Use it to learn and review. It does not diagnose or replace your instructors, preceptors or current clinical guidelines.',
    },
    {
        icon: ShieldIcon,
        title: 'Focused on healthcare',
        text: 'The assistant only answers medical and nursing questions, and it tells you when information may be incomplete.',
    },
    {
        icon: LockIcon,
        title: 'Secure payments',
        text: 'Card details go straight to Stripe. We never see or store your full card number.',
    },
    {
        icon: CalendarIcon,
        title: 'No surprise renewals',
        text: 'Every plan covers one month. When it ends, you decide whether to buy another — nothing is charged automatically.',
    },
]

export default function SafetySection() {
    return (
        <section className="nbl-section is-dark">
            <div className="nbl-container">
                <SectionHeading
                    light
                    eyebrow="Built responsibly"
                    title="Designed for learning you can trust"
                />
                <div className="nbl-safety">
                    {POINTS.map(({ icon: Icon, title, text }) => (
                        <div key={title} className="nbl-safety-item nbl-reveal">
                            <span className="nbl-safety-icon"><Icon className="h-5 w-5" /></span>
                            <h3 className="nbl-safety-title">{title}</h3>
                            <p className="nbl-safety-text">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
