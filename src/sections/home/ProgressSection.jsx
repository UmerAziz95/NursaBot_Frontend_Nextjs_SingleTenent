import Link from "next/link";
import Image from "next/image";

const achievements = [
    { icon: "/achievement-lightning.svg", text: "Quick Learner" },
    { icon: "/achievement-checklist.svg", text: "Consistent" },
    { icon: "/achievement-trophy.svg", text: "High Scorer" }
];

export default function ProgressSection() {
    return (
        <section className="progress-section py-10 lg:py-[6vw]">
            <div className="wrapper relative z-10">
                {/* Header */}
                <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                    <img src="/stat-1.svg" alt="work icon" />
                    <h6 className="font-bold">Track Your Growth</h6>
                </div>

                <div className="flex flex-col lg:flex-row items-end justify-between gap-4 lg:gap-[5vw]">
                    <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:max-w-[40%]">
                        Your <span>Learning</span> Progress
                    </h2>
                    <p data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="text-end lg:max-w-[40%]">
                        Comprehensive analytics to monitor your improvement and identify areas for growth.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-[2vw] my-6 lg:my-[3vw]">
                    {/* Overall Progress Card - Top Left (spans 2 columns) */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:col-span-2 backdrop-blur rounded-2xl shadow-lg p-6 lg:p-8">
                        <h6 className="font-bold mb-3 lg:mb-[1vw]">Overall Progress</h6>

                        {/* NCLEX Readiness Progress Bar */}
                        <div className="mb-6 lg:mb-[2vw]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm lg:text-base text-gray-700 font-medium">NCLEX Readiness</span>
                                <span className="text-lg lg:text-xl font-bold text-[#2EAADB]">78%</span>
                            </div>
                            <div className="relative w-full h-3 lg:h-2 bg-gray-200 rounded-full">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#053447] rounded-full transition-all duration-500"
                                    style={{ width: '78%' }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-2 lg:w-5 lg:h-5 bg-[#053447] rounded-full border-2 border-white"></div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="grid grid-cols-3 gap-4 lg:gap-[2vw]">
                            <div className="text-center">
                                <h6 className="font-bold text-(--primary-color)">485</h6>
                                <small className="">Questions Answered</small>
                            </div>
                            <div className="text-center">
                                <h6 className="font-bold text-(--primary-color) mb-1">87%</h6>
                                <small className="">Average Score</small>
                            </div>
                            <div className="text-center">
                                <h6 className="font-bold text-(--primary-color) mb-1">24</h6>
                                <small className="">Study Days</small>
                            </div>
                        </div>
                    </div>

                    {/* Achievements Card - Top Right */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="backdrop-blur rounded-2xl shadow-lg p-6 lg:p-8">
                        <h6 className="font-bold text-gray-700 mb-6 lg:mb-[2vw]">Achievements</h6>
                        <div className="flex flex-col gap-3 lg:gap-[1vw">
                            {achievements.map((achievement, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="bg-[#E2E8F0] p-1 rounded-[4px] lg:rounded-[0.5vw]">
                                        <Image
                                            src={achievement.icon}
                                            alt={achievement.text}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 lg:w-[1.5vw] lg:h-[1.5vw]"
                                        />
                                    </div>
                                    <small className="">{achievement.text}</small>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Goals Card - Bottom Left (spans 2 columns) */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:col-span-2 backdrop-blur rounded-2xl shadow-lg p-6 lg:p-8">
                        <h6 className="font-bold text-gray-700 mb-6 lg:mb-[2vw]">Weekly Goals</h6>
                        <div className="space-y-4 lg:space-y-[1vw]">
                            {/* Practice Questions */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="">Practice Questions</span>
                                    <span className="">47/50</span>
                                </div>
                                <div className="relative w-full h-3 lg:h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#053447] rounded-full transition-all duration-500"
                                        style={{ width: '94%' }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-2 lg:w-5 lg:h-5 bg-[#053447] rounded-full border-2 border-white"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Study Hours */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="">Study Hours</span>
                                    <span className="">8/10</span>
                                </div>
                                <div className="relative w-full h-3 lg:h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#053447] rounded-full transition-all duration-500"
                                        style={{ width: '80%' }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-2 lg:w-5 lg:h-5 bg-[#053447] rounded-full border-2 border-white"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Flashcard Reviews */}
                            <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="">Flashcard Reviews</span>
                                    <span className="">120/150</span>
                                </div>
                                <div className="relative w-full h-3 lg:h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#053447] rounded-full transition-all duration-500"
                                        style={{ width: '80%' }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-2 lg:w-5 lg:h-5 bg-[#053447] rounded-full border-2 border-white"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Study Streak Card - Bottom Right */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="backdrop-blur rounded-2xl shadow-lg p-6 lg:p-8 flex flex-col items-start h-fit">
                        <h6 className="">Study Streak</h6>
                        <h2 className="mt-3 lg:mb-2 mb-[1vw] lg:mt-[2vw]">7</h2>
                        <div className="flex items-center justify-between w-full gap-2">
                            <span className="">Days in a row</span>
                            <svg className="w-5 h-5 lg:w-[1.2vw] lg:h-[1.2vw] text-[#2EAADB]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Call to Action Button */}
                <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="flex justify-center">
                    <Link
                        href="/analytics"
                        className="bg-[#053447] text-white font-bold px-8 lg:px-[3vw] py-3 lg:py-[1vw] rounded-lg hover:bg-[#042a38] transition-colors text-sm lg:text-base"
                    >
                        View Detailed Analytics
                    </Link>
                </div>
            </div>
        </section>
    );
}

