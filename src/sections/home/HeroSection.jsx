import Image from "next/image";
import cpu from "../../../public/cpu.svg";
import Link from "next/link";

export default function HeroSection() {
    return (
        <>
            <section className="hero-section flex items-center h-[70vh] lg:h-screen w-full relative overflow-hidden">
                <div className="wrapper flex items-center justify-between h-full w-full z-10">
                    <div className="lg:w-1/2">
                        <div className="flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                            <Image src={cpu} alt="cpu" width={20} height={20} className="size-4 lg:size-[1.2vw]" />
                            <small>AI-Powered NCLEX Prep</small>
                        </div>

                        <h1 className="leading-none lg:leading-[4vw] mb-4 lg:mb-[1.5vw]">
                            Master <span>NCLEX</span> with Your <i className="font-light"><span>AI</span> Study Companion</i>
                        </h1>

                        <p className="mb-4 lg:mb-[1.5vw]">
                            Meet Olivia - your comprehensive AI tutor designed to help nursing students excel. Adaptive learning, practice tests, and clinical insights all in one powerful assistant.
                        </p>

                        <div className="flex items-center gap-2 lg:gap-[0.3vw]">
                            <Link className="btn-primary" href="/assistant">
                                Start Learning Now
                            </Link>
                            <Link className="btn-secondary" href="/assistant">
                                Watch Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <Image 
                    src="/assets/images/hero-dashboard.png" 
                    alt="hero-shape" 
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover"
                    priority
                    loading="eager"
                />
            </section>
        </>
    )
}