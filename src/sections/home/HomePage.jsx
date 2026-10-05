'use client'

import Header from '@/layout/Header'
import Footer from '@/layout/Footer'
import HeroSection from '@/sections/home/HeroSection'
import WorkSection from '@/sections/home/WorkSection'
import ProgressSection from '@/sections/home/ProgressSection'
import LearnSection from '@/sections/home/LearnSection'
import BenefitsSection from '@/sections/home/BenefitsSection'
import PricingSection from '@/sections/home/PricingSection'
import FAQSection from '@/sections/home/FAQSection'
import ContactSection from '@/sections/home/ContactSection'

export default function HomePage() {
    return (
        <main>
            <Header />
            <HeroSection />
            <WorkSection />
            <ProgressSection />
            <LearnSection />
            <BenefitsSection />
            <PricingSection />
            <FAQSection />
            <ContactSection />
            <Footer />
        </main>
    )
}
