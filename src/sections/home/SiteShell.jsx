'use client'

import { useEffect } from 'react'
import Header from '@/layout/Header'
import Footer from '@/layout/Footer'
import CookieNotice from '@/sections/home/CookieNotice'
import '@/sections/home/landing.css'

// Shared frame for public pages (home + legal): header, footer, cookie notice,
// and a light scroll-reveal for elements marked `.nbl-reveal`.
export default function SiteShell({ children }) {
    useEffect(() => {
        const elements = Array.from(document.querySelectorAll('.nbl-reveal'))
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (reduced || typeof IntersectionObserver === 'undefined') {
            elements.forEach((el) => el.classList.add('is-visible'))
            return undefined
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible')
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
        elements.forEach((el) => observer.observe(el))
        // Content that loads later (e.g. pricing cards) is picked up by a mutation observer.
        const mutations = new MutationObserver(() => {
            document.querySelectorAll('.nbl-reveal:not(.is-visible):not([data-observed])').forEach((el) => {
                el.setAttribute('data-observed', '1')
                observer.observe(el)
            })
        })
        mutations.observe(document.body, { childList: true, subtree: true })
        return () => {
            observer.disconnect()
            mutations.disconnect()
        }
    }, [])

    return (
        <div className="user-portal nbl-page">
            <a href="#main" className="nbl-skip">Skip to content</a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <CookieNotice />
        </div>
    )
}
