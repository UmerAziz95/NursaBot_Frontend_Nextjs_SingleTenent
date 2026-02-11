'use client'

import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

const faqs = [
    {
        question: "What is NursingAI and how does it help with NCLEX preparation?",
        answer: "NursingAI is an AI-powered study companion designed specifically for nursing students preparing for the NCLEX exam. It provides personalized learning paths, practice questions, flashcards, and comprehensive analytics to help you identify strengths and weaknesses, track your progress, and maximize your chances of passing the NCLEX."
    },
    {
        question: "How accurate are the practice questions compared to the actual NCLEX exam?",
        answer: "Our practice questions are carefully crafted to mirror the format, difficulty, and content areas of the actual NCLEX exam. They are based on the latest NCLEX test plans and reviewed by experienced nursing educators to ensure accuracy and relevance."
    },
    {
        question: "Can I use NursingAI on my mobile device?",
        answer: "Yes! NursingAI is fully responsive and works seamlessly on desktop, tablet, and mobile devices. You can study on-the-go and access your progress, practice questions, and AI companion from anywhere."
    },
    {
        question: "What makes NursingAI different from other NCLEX prep platforms?",
        answer: "NursingAI combines AI-powered personalized learning with comprehensive analytics. Our platform adapts to your learning style, identifies weak areas, and provides targeted practice. Plus, you get access to Olivia, your AI study companion, who can answer questions and provide explanations 24/7."
    },
    {
        question: "How do I track my progress and see my improvement?",
        answer: "NursingAI provides detailed analytics including your NCLEX readiness score, average performance, study streak, and weekly goals. You can view comprehensive progress reports that show your improvement over time and identify areas that need more focus."
    },
    {
        question: "Is there a free trial available?",
        answer: "Yes! We offer a free trial so you can experience all the features of NursingAI before committing to a subscription. Start your free trial today and see how NursingAI can help you pass the NCLEX."
    },
    {
        question: "Can I cancel my subscription at any time?",
        answer: "Absolutely. You can cancel your subscription at any time with no penalties or fees. Your access will continue until the end of your current billing period."
    },
    {
        question: "Do you offer support if I have questions about using the platform?",
        answer: "Yes, we provide comprehensive support through our Discord community with 250+ members, email support, and in-app help resources. Our team is here to help you succeed."
    }
];

export default function FAQSection() {
    return (
        <section className="faq-section py-10 lg:py-[6vw] relative overflow-hidden">
            <div className="wrapper relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start md:items-end justify-between gap-4 lg:gap-[5vw] mb-8 lg:mb-[4vw]">
                    <div className="flex-1">
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="head flex items-center gap-2 lg:gap-[0.3vw] mb-4 lg:mb-[1.5vw]">
                            <img src="/faq-icon.svg" alt="FAQ icon" />
                            <h6>Frequently Asked Questions</h6>
                        </div>
                        <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2">
                            Got <span>Questions?</span> We've Got Answers
                        </h2>
                    </div>
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:max-w-[40%]">
                        <p className="text-end">
                            Everything you need to know about NursingAI and how it can help you pass the NCLEX exam.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 lg:gap-[5vw]">
                    {/* FAQ Accordion */}
                    <div className="lg:w-[60%]">
                        <div className="">
                            {faqs.map((faq, index) => (
                                <Disclosure key={index} data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" as="div" className="faq-item overflow-hidden rounded-2xl lg:rounded-[0.7vw]">
                                    {({ open }) => (
                                        <>
                                            <DisclosureButton className=" p-2 flex w-full items-center justify-between py-4 lg:px-[1.5vw] lg:py-[1vw] text-left transition-colors">
                                                <h6 className="font-bold pr-4 lg:pr-[2vw] text-[13px]! lg:text-[1vw]!">
                                                    {faq.question}
                                                </h6>
                                                <ChevronDownIcon
                                                    className={`${open ? 'rotate-180 transform' : ''
                                                        } h-5 w-5 lg:w-[1.5vw] lg:h-[1.5vw] shrink-0 transition-transform duration-300 ease-in-out`}
                                                />
                                            </DisclosureButton>

                                            <Transition
                                                show={open}
                                                enter="transition ease-out duration-200"
                                                enterFrom="opacity-0 -translate-y-1"
                                                enterTo="opacity-100 translate-y-0"
                                                leave="transition ease-in duration-150"
                                                leaveFrom="opacity-100 translate-y-0"
                                                leaveTo="opacity-0 -translate-y-1"
                                            >
                                                <DisclosurePanel
                                                    className="faq-panel px-3 lg:px-[1.5vw] pb-3 lg:pb-[1.5vw] text-[13px]! lg:text-[0.8vw]! text-gray-500"
                                                >
                                                    {faq.answer}
                                                </DisclosurePanel>
                                            </Transition>
                                        </>
                                    )}
                                </Disclosure>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="absolute bottom-0 right-0 w-[40%] hidden lg:block">
                <Image src="/faq.svg" alt="faq" width={1000} height={1000} />
            </div>
        </section>
    );
}

