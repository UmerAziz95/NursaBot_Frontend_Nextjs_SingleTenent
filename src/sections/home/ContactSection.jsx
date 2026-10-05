'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ContactSection() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
        agree: false
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle form submission here
        console.log('Form submitted:', formData)
    }

    return (
        <section id="contact" className="contact-section py-10 lg:py-[6vw] relative overflow-hidden">
            <div className="wrapper relative z-10">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-[5vw]">
                    {/* Left Side - Heading and Image */}
                    <div className="lg:w-[45%]">
                        <h2 data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="mb-6 lg:mb-[2vw]">
                            <span>Not sure</span> if it’s right for you?
                        </h2>
                        <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="w-[90%]">
                            <Image 
                                src="/contact-image.svg" 
                                alt="contact illustration" 
                                width={400} 
                                height={400}
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div data-gsap-animate data-gsap-variant="blur-in" data-gsap-duration="1.2" className="lg:w-[50%] w-full">
                        <div className="bg-white rounded-2xl lg:rounded-[1.5vw] shadow-sm p-6 lg:p-[2vw]">
                            <h6 className="font-bold mb-6 lg:mb-[2vw]">Send us a message</h6>
                            
                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                {/* Name Input */}
                                <div>
                                    <label htmlFor="name" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="Your name"
                                    />
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                {/* Message Textarea */}
                                <div>
                                    <label htmlFor="message" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all resize-none"
                                        placeholder="Your message here..."
                                    />
                                </div>

                                {/* Checkbox */}
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="agree"
                                        name="agree"
                                        checked={formData.agree}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 w-4 h-4 lg:w-[1vw] lg:h-[1vw] text-[#053447] border-gray-300 rounded focus:ring-[#053447] cursor-pointer"
                                    />
                                    <label htmlFor="agree" className="cursor-pointer text-[12px] lg:text-[0.75vw]">
                                        I agree to the terms and conditions
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

