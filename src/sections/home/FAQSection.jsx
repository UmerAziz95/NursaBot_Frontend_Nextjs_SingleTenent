'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown as ChevronDownIcon } from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'
import SectionHeading from '@/sections/home/SectionHeading'

// Answers describe how the product actually works (billing, limits, data).
const buildFaqs = (siteName, settings) => [
    {
        q: `What is ${siteName}?`,
        a: `${siteName} is an AI study assistant for nursing students. Ask about nursing concepts, pharmacology, lab values, clinical reasoning or NCLEX topics and get clear, structured explanations grounded in curated study material.`,
    },
    {
        q: 'Is it medical advice?',
        a: 'No. It is an educational tool. It can make mistakes, so always verify important clinical information with your instructors, preceptors and current guidelines, and never use it to make decisions about real patients.',
    },
    {
        q: 'What can I ask?',
        a: 'Anything related to medicine, nursing and healthcare — from fundamentals to complex care plans. Follow-up questions work naturally. Questions outside healthcare are politely declined so the assistant stays focused.',
    },
    {
        q: 'What are answer modes?',
        a: 'Before you send a question, choose Balanced, Short, Detailed, Simple or Exam prep. Each mode changes the length and style of the answer. Exam prep adds an NCLEX-style practice question with rationales.',
    },
    ...(settings.voice_chat_enabled !== false ? [{
        q: 'Can I ask by voice or with pictures?',
        a: 'Yes. Record voice notes of up to 2 minutes, or attach up to 5 images (5 MB each) — for example an ECG strip or a medication label. Messages can be up to 5,000 characters.',
    }] : [{
        q: 'Can I ask with pictures?',
        a: 'Yes. Attach up to 5 images (5 MB each), such as an ECG strip or a medication label. Messages can be up to 5,000 characters.',
    }]),
    {
        q: 'Does my plan renew automatically?',
        a: 'No. Each payment covers one month. When the month ends, chat pauses until you choose to buy another month. You are never charged without taking action.',
    },
    {
        q: 'What are tokens, and what if I run out?',
        a: 'Tokens measure how much text the assistant reads and writes; longer and more detailed answers use more. You can see your remaining balance in Settings → Plan & usage. If you run out, you can upgrade or start a new month at any time.',
    },
    {
        q: 'Can I cancel?',
        a: 'Yes, from Settings → Plan & usage. Because plans never auto-renew, you can also simply let your month run out.',
    },
    {
        q: 'Is my data private?',
        a: 'Your conversations are saved to your account so you can revisit them, and you can remove any conversation from your history. Card payments are handled by Stripe — we never store your full card number. See our Privacy Policy for details.',
    },
    ...(settings.help_tickets_enabled !== false ? [{
        q: 'How do I get help?',
        a: 'Signed-in users can open a support ticket from Settings → Help & support and chat with our team. Anyone can also reach us through the contact form below.',
    }] : []),
]

export default function FAQSection() {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'nclexium'
    const faqs = buildFaqs(siteName, settings)
    const [open, setOpen] = useState(0)

    return (
        <section className="nbl-section" id="faq">
            <div className="nbl-container nbl-faq-grid">
                <div>
                    <SectionHeading
                        align="left"
                        eyebrow="FAQ"
                        title="Questions, answered"
                        text="Can't find what you're looking for?"
                    />
                    <Link href="/#contact" className="nbl-btn is-secondary is-sm nbl-faq-cta">Contact us</Link>
                </div>
                <div className="nbl-faq">
                    {faqs.map((item, index) => {
                        const isOpen = open === index
                        return (
                            <div key={item.q} className={`nbl-faq-item ${isOpen ? 'is-open' : ''}`}>
                                <button
                                    type="button"
                                    className="nbl-faq-q"
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-${index}`}
                                    onClick={() => setOpen(isOpen ? -1 : index)}
                                >
                                    <span>{item.q}</span>
                                    <ChevronDownIcon className="h-4 w-4 shrink-0" />
                                </button>
                                {isOpen && <div id={`faq-${index}`} className="nbl-faq-a">{item.a}</div>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
