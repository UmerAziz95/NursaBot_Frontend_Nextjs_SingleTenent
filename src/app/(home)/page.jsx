import dynamic from "next/dynamic";
import HeroSection from "@/sections/home/HeroSection";
import ScrollProvider from "@/components/ScrollProvider";
import WorkSection from "@/sections/home/WorkSection";

// Lazy load sections below the fold for better initial load performance
const LearnSection = dynamic(() => import("@/sections/home/LearnSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});
const BenefitsSection = dynamic(() => import("@/sections/home/BenefitsSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});
const ProgressSection = dynamic(() => import("@/sections/home/ProgressSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});
const PricingSection = dynamic(() => import("@/sections/home/PricingSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});
const FAQSection = dynamic(() => import("@/sections/home/FAQSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});
const ContactSection = dynamic(() => import("@/sections/home/ContactSection"), {
  loading: () => <div className="min-h-[50vh]" />,
});

export default function Home() {
  return (
    <div>
      <ScrollProvider>
        <HeroSection />
        <WorkSection />
        <LearnSection />
        <BenefitsSection />
        <ProgressSection />
        <PricingSection />
        <FAQSection />
        <ContactSection />
      </ScrollProvider>
    </div>
  );
}
