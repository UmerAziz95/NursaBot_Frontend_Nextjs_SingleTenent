'use client'

import SiteShell from '@/sections/home/SiteShell'
import HeroSection from '@/sections/home/HeroSection'
import BenefitsSection from '@/sections/home/BenefitsSection'
import WorkSection from '@/sections/home/WorkSection'
import LearnSection from '@/sections/home/LearnSection'
import SafetySection from '@/sections/home/SafetySection'
import PricingSection from '@/sections/home/PricingSection'
import FAQSection from '@/sections/home/FAQSection'
import ContactSection from '@/sections/home/ContactSection'
import CtaSection from '@/sections/home/CtaSection'

export default function HomePage() {
    return (
        <SiteShell>
            <HeroSection />
            <BenefitsSection />
            <WorkSection />
            <LearnSection />
            <SafetySection />
            <PricingSection />
            <FAQSection />
            <ContactSection />
            <CtaSection />
        </SiteShell>
    )
}
