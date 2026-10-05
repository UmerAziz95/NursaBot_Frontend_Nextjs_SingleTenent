import Image from "next/image";
import Link from "next/link";

const features = [
    "Instant Q&A on nursing concepts",
    "Custom study schedules & quizzes",
    "Progress tracking & analytics",
    "Pharmacology guidance",
    "Clinical case explanations",
    "Practice test generation",
    "Evidence-based references",
    "Weak area identification"
];

export default function LearnSection() {
    return (
        <section id="learn" className="learn-section">
            <div className="wrapper py-10 lg:py-[6vw] relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-[2vw]">

                    <div className="lg:w-[45%]">
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                            <img src="/learn-1.svg" alt="learn icon" />
                            <h6 className="font-bold">AI-Powered Learning</h6>
                        </div>
                        <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="mb-3 lg:mb-[1vw]">
                            Meet Your <span>AI Study</span> Companion
                        </h2>
                        <p data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2">
                            NursingAI makes NCLEX preparation easy by guiding you through a structured, AI-driven learning process.
                        </p>

                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="w-full flex items-center justify-center">
                            <img src="/learn-main.svg" alt="learn image" className="w-[50%] mt-5 lg:mt-[3vw] object-cover" />
                        </div>
                    </div>

                    {/* Olivia Card */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="olivia-card bg-white rounded-2xl shadow-sm p-6 lg:p-[2vw] lg:max-w-[40%]">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <Image
                                src="/olivia-icon.svg"
                                alt="Olivia icon"
                                width={80}
                                height={80}
                                className="w-16 h-16 lg:w-20 lg:h-20"
                            />
                        </div>

                        {/* Name and Subtitle */}
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-center mb-4">
                            <h3 className="text-2xl lg:text-3xl font-bold text-black mb-1">Olivia</h3>
                            <p className="text-sm lg:text-base text-gray-700">AI Study Companion</p>
                        </div>

                        {/* Description */}
                        <p data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-sm lg:text-base text-black mb-6 text-center leading-relaxed">
                            Your comprehensive NCLEX companion combining expert knowledge, structured learning, and personalized study plans to maximize your success.
                        </p>

                        {/* Divider */}
                        <div className="border-t border-gray-200 mb-6"></div>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
                            {features.map((feature, index) => (
                                <ul key={index} className="flex items-start gap-2 list-disc">
                                    <li data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-sm lg:text-[0.75vw] text-black leading-relaxed">
                                        {feature}
                                    </li>
                                </ul>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <Link
                            data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2"
                            href="/signup"
                            className="block w-full bg-(--primary-color) text-white font-bold text-center py-3 lg:py-4 rounded-lg hover:bg-[#2599c4] transition-colors"
                        >
                            Chat with Olivia
                        </Link>
                    </div>
                </div>

                <div className="lg:w-full mt-4 lg:mt-[6vw]">
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                        <img src="/stat-1.svg" alt="stat icon" />
                        <h6 className="font-bold">Statistics</h6>
                    </div>
                    <div className="flex flex-col lg:flex-row items-end justify-between">
                        <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="mb-3 lg:mb-0 lg:w-1/2">
                            You’re <span>losing</span> more than you think.
                        </h2>
                        <p data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-end lg:w-1/2">
                            An intelligent platform combininAdaptive, expert-led learning designed for NCLEX preparation.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 lg:gap-[2vw] mt-8 lg:mt-[3vw]">
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="bg-white flex flex-col items-center justify-center p-8 lg:p-[2vw] rounded-2xl lg:rounded-[1vw] shadow-md">
                        <h2>15k+</h2>
                        <small>Questions</small>
                    </div>

                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="flex flex-col items-center justify-center p-8 lg:p-[2vw] rounded-2xl lg:rounded-[1vw] shadow-md bg-(--primary-color) text-white">
                        <h2>98%</h2>
                        <small>Accuracy</small>
                    </div>

                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="bg-white flex flex-col items-center justify-center p-8 lg:p-[2vw] rounded-2xl lg:rounded-[1vw] shadow-md">
                        <h2>500+</h2>
                        <small>Plans</small>
                    </div>
                </div>
            </div>
        </section>
    );
}