import Link from "next/link";
const workSteps = [
    {
        icon: "/work-2.svg",
        title: "Flashcards",
        description: "Spaced repetition system with AI-generated cards",
        feature: "1000+ Cards",
    },
    {
        icon: "/work-3.svg",
        title: "Practice Tests",
        description: "NCLEX-style questions with detailed explanations",
        feature: "500+ Questions",
    },
    {
        icon: "/work-4.svg",
        title: "Clinical Cases",
        description: "Real-world scenarios with critical thinking",
        feature: "200+ Cases",
    },
    {
        icon: "/work-5.svg",
        title: "Progress Analytics",
        description: "Comprehensive learning insights and trends",
        feature: "Real-time Data",
    }
];

export default function BenefitsSection() {
    return (
        <section className="benefits-section">
            <div className="wrapper py-10 lg:py-[6vw] relative z-10">
                <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                    <img src="/stat-1.svg" alt="stat icon" />
                    <h6 className="font-bold mb-0">Why Choose NursingAI</h6>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:tems-end justify-between gap-5 lg:gap-[5vw]">
                    <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="mb-3 lg:mb-0 lg:w-1/2">
                        More Than <span>Studying—Built</span> to Help You Pass
                    </h2>
                    <p data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-end lg:w-1/2">
                        One intelligent study companion designed to help nursing students pass the NCLEX with confidence.
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-0 lg:gap-[2vw] lg:max-w-[60%]">
                        {workSteps.map((step, index) => (
                            <div key={index} data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="flex flex-col mb-3 lg:mb-0 gap-2 lg:gap-[0.8vw] p-3 lg:p-[1.5vw] rounded-[10px]! lg:rounded-[1vw]!">
                                <img
                                    src={step.icon}
                                    className="w-10 lg:w-[3.6vw]"
                                    alt={`${step.title} icon`}
                                />
                                <h6 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="mb-0">{step.title}</h6>
                                <small data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="leading-[125%]!">{step.description}</small>
                                <small data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="border border-gray-900 px-2 py-1 lg:px-[0.4vw] lg:py-[0.2vw] rounded-full w-fit">{step.feature}</small>
                            </div>
                        ))}

                        <div className="flex items-center gap-2 lg:gap-[0.8vw] w-full">
                            <Link data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="btn-primary text-nowrap" href="/assistant">
                                Quick Assessment

                            </Link>
                            <Link data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="btn-secondary text-nowrap" href="/assistant">
                                Start Practice Mode
                            </Link>
                        </div>
                    </div>

                    <img data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" src="/benefit.svg" alt="benefit image" className="w-full lg:w-[40%] mt-10 lg:mt-[5vw] hidden lg:block" />
                </div>
            </div>
        </section>
    );
}