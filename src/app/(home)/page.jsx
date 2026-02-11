import dynamic from "next/dynamic";
import HeroSection from "@/sections/home/HeroSection";
import ScrollProvider from "@/components/ScrollProvider";
import WorkSection from "@/sections/home/WorkSection";
import LearnSection from "@/sections/home/LearnSection";
import BenefitsSection from "@/sections/home/BenefitsSection";
import ProgressSection from "@/sections/home/ProgressSection";
import PricingSection from "@/sections/home/PricingSection";
import FAQSection from "@/sections/home/FAQSection";
import ContactSection from "@/sections/home/ContactSection";

// // Lazy load sections below the fold for better initial load performance
// const LearnSection = dynamic(() => import("@/sections/home/LearnSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });
// const BenefitsSection = dynamic(() => import("@/sections/home/BenefitsSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });
// const ProgressSection = dynamic(() => import("@/sections/home/ProgressSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });
// const PricingSection = dynamic(() => import("@/sections/home/PricingSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });
// const FAQSection = dynamic(() => import("@/sections/home/FAQSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });
// const ContactSection = dynamic(() => import("@/sections/home/ContactSection"), {
//   loading: () => <div className="min-h-[50vh]" />,
// });

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
