const workSteps = [
    {
        icon: "/work-2.svg",
        step: "STEP 01.",
        title: "Assess Your Knowledge",
        description: "Take a quick assessment to identify strengths and weak areas."
    },
    {
        icon: "/work-3.svg",
        step: "STEP 02.",
        title: "Get a Personalized Plan",
        description: "Receive a study plan tailored to your level and goals."
    },
    {
        icon: "/work-4.svg",
        step: "STEP 03.",
        title: "Practice and Learn",
        description: "Study with questions, flashcards, and clinical cases."
    },
    {
        icon: "/work-5.svg",
        step: "STEP 04.",
        title: "Track and Improve",
        description: "Monitor progress and refine focus with real-time insights."
    }
];

export default function WorkSection() {
    return (
        <section className="work-section">
            <div className="wrapper py-10 lg:py-[6vw] relative z-10">
                <div data-gsap-animate
                    data-gsap-variant="blur-in"
                    data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                    <img src="/work-1.svg" alt="work icon" />
                    <h6 className="font-bold">How Nursing AI Works</h6>
                </div>

                <div className="flex flex-col lg:flex-row items-end justify-between gap-4 lg:gap-[5vw]">
                    <h2 data-gsap-animate
                        data-gsap-variant="blur-in"
                        data-gsap-duration="1.2">
                        A Simple, Guided Path to <span>NCLEX</span> Success
                    </h2>
                    <p data-gsap-animate
                        data-gsap-variant="blur-in"
                        data-gsap-duration="1.2">
                        NursingAI makes NCLEX preparation easy by guiding you through a structured, AI-driven learning process.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-[2vw] lg:max-w-[60%] mt-10 lg:mt-[5vw]">
                    {workSteps.map((step, index) => (
                        <div key={index} data-gsap-animate
                            data-gsap-variant="blur-in"
                            data-gsap-duration="1.2" className="flex flex-col gap-2 lg:gap-[0.6vw] shadow-lg p-8 lg:p-[1.5vw] rounded-[10px]! lg:rounded-[1vw]! bg-white">
                            <img
                                src={step.icon}
                                className="w-10 lg:w-[3.6vw]"
                                alt={`${step.title} icon`}
                            />
                            <small className="bg-[#E2E8F0] py-1 px-2 lg:py-[0.3vw] lg:px-[0.9vw] rounded-[3px]! lg:rounded-[0.3vw]! w-fit">{step.step}</small>
                            <h6 className="mb-0">{step.title}</h6>
                            <small className="leading-[125%]!">{step.description}</small>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}