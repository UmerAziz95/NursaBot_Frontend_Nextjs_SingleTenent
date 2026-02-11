import Link from "next/link";
import Image from "next/image";

const pricingPlans = [
    {
        name: "Pro",
        description: "Perfect for individual learners",
        price: "49",
        currency: "$",
        period: "/year",
        features: [
            "50 practice questions per month",
            "Basic AI study companion access",
            "Progress tracking & analytics",
            "Access to community Discord (250+ members)"
        ],
        buttonText: "Get Pro",
        buttonClass: "bg-[#053447] hover:bg-[#042a38]",
        highlighted: false
    },
    {
        name: "Standard",
        description: "Most popular choice for serious students",
        price: "19",
        currency: "$",
        period: "/year",
        features: [
            "100 practice questions per month",
            "Full AI study companion access",
            "Advanced progress tracking & analytics",
            "Priority access to community Discord (250+ members)"
        ],
        buttonText: "Get Standard",
        buttonClass: "bg-gradient-to-r from-[#2EAADB] to-[#4BB9AE] hover:from-[#2599c4] hover:to-[#42a89d]",
        highlighted: true,
        badge: "Chosen by 70% of users"
    },
    {
        name: "Exclusive",
        description: "For dedicated nursing students",
        price: "99",
        currency: "$",
        period: "/year",
        features: [
            "250 practice questions per month",
            "Premium AI study companion access",
            "Comprehensive progress tracking & analytics",
            "VIP access to community Discord (250+ members)"
        ],
        buttonText: "Get Exclusive",
        buttonClass: "bg-[#053447] hover:bg-[#042a38]",
        highlighted: false
    }
];

export default function PricingSection() {
    return (
        <section className="pricing-section py-10 lg:py-[6vw] relative overflow-hidden">
            <div className="wrapper relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-end justify-between gap-4 lg:gap-[5vw] mb-8 lg:mb-[4vw]">
                    <div className="flex-1">
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                            <img src="/shopping-cart-icon.svg" alt="shopping cart" />
                            <h6>Best Packages</h6>
                        </div>
                        <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2">
                            Our <span>Subscription</span> Plans
                        </h2>
                    </div>
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:max-w-[40%]">
                        <p className="text-end">
                            Everything you need to know about booking exam places for the Permit.
                        </p>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-[2vw] ">
                    {pricingPlans.map((plan, index) => (
                        <div
                            data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2"
                            key={index}
                            className={`pricing-card rounded-2xl lg:rounded-[2vw]! shadow-sm p-6 lg:p-[2vw] relative ${
                                plan.highlighted
                                    ? "bg-[#053447] text-white transform lg:scale-105"
                                    : "bg-white"
                            }`}
                        >
                            {/* Badge for highlighted plan */}
                            {plan.highlighted && plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="btn-primary rounded-full! text-[0.8vw]! uppercase whitespace-nowrap">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan Name */}
                            <h3 className={`text-2xl lg:text-[2.2vw] font-bold mb-2 text-center ${plan.highlighted ? "text-white" : "text-[#053447]"}`}>
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <p className={`text-center mb-6 ${plan.highlighted ? "text-gray-300" : "text-gray-600"}`}>
                                {plan.description}
                            </p>

                            <hr className="opacity-20 my-6 lg:my-[2vw] border" />

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className={`text-4xl lg:text-[3vw] font-bold ${plan.highlighted ? "text-white" : "text-[#053447]"}`}>
                                        {plan.currency}{plan.price}
                                    </span>
                                    <span className={`text-sm lg:text-base ${plan.highlighted ? "text-gray-300" : "text-gray-600"}`}>
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-4 lg:space-y-[0.8vw] mb-8 lg:mb-[2vw]">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center gap-2 lg:gap-[0.5vw]">
                                        <div className={`bg-gray-300 rounded-full! p-1! ${plan.highlighted ? "text-[#053447]" : "text-[#053447]"}`}>
                                            <svg className="w-3 h-3 lg:w-[1.2vw] lg:h-[1.2vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className={`text-[13px]! lg:text-[0.9vw]! ${plan.highlighted ? "text-gray-200" : "text-gray-700"}`}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Link
                                href="/pricing"
                                className={`block w-full text-center font-bold py-3 lg:py-4 rounded-lg transition-colors text-white ${plan.buttonClass}`}
                            >
                                {plan.buttonText}
                            </Link>
                        </div>
                    ))}

                    <Image data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" src="/plan.svg" alt="pricing bg" className="absolute -bottom-[10%] -right-[20%] z-0 w-1/3 hidden lg:block" width={1000} height={1000} />
                </div>
            </div>
        </section>
    );
}