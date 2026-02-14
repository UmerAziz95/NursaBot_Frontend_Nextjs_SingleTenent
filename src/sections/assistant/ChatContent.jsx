"use client"

import { MagnifyingGlassIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline"
import { CameraIcon, MicrophoneIcon } from "@heroicons/react/24/solid"
import { HandThumbUpIcon, HandThumbDownIcon, ClipboardIcon } from "@heroicons/react/24/outline"
import { PencilIcon } from "@heroicons/react/24/solid"
import { useState, useRef, useEffect } from "react"

export default function ChatContent() {
    const [isChatActive, setIsChatActive] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (inputValue.trim()) {
            setMessages([...messages, { text: inputValue, sender: "user", time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) }])
            setInputValue("")

            // Simulate AI response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ut enim sed enim egestas accumsan a eu dolor.",
                    sender: "ai",
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                }])
            }, 1000)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(e)
        }
    }

    return (
        <div className="chat-content bg-gray-300 p-3 w-full h-full">
            <div className="chatbox w-full h-full bg-white rounded-2xl relative flex flex-col">

                {/* logo */}
                <div className="flex justify-center w-full pt-3">
                    <img
                        src="/assets/images/chatlogo.png"
                        alt="User"
                        className="object-cover"
                    />
                </div>

                {/* center Content - only shows when chat is not active */}
                {!isChatActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-col justify-center items-center w-full px-4">
                        <div className="text-center">
                            <h1 className="text-[30px]! md:text-[30px]! text-xl! mb-2">Discover the information you need in a snap!</h1>
                            <p className="text-sm md:text-base">Your Digital AI-Powered NCLEX Prep Awaits</p>
                        </div>

                        {/* input box */}
                        <div
                            className="w-full max-w-[578px] flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px] cursor-text"
                            onClick={() => setIsChatActive(true)}
                        >
                            <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Discover the information you need in a snap!"
                                className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                                onFocus={() => setIsChatActive(true)}
                            />
                            <MicrophoneIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                            <CameraIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                        </div>

                        {/* Suggestions */}
                        <div className="flex flex-wrap justify-center items-center gap-4">
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat messages area - shows when chat is active */}
                {isChatActive && (
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        {messages.map((message, index) => (
                            <div key={index}>
                                {message.sender === 'user' ? (
                                    // User message
                                    <div className="flex justify-end items-start gap-3 mb-6">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">You</span>
                                                <span className="text-xs text-gray-400">{message.time}</span>
                                            </div>
                                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[600px] shadow-sm">
                                                <p className="text-sm text-gray-800">{message.text}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ClipboardIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <PencilIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-pink-300 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm">👤</span>
                                        </div>
                                    </div>
                                ) : (
                                    // AI message
                                    <div className="flex justify-start items-start gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg">N</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">Sohpia</span>
                                                <span className="text-xs text-gray-400">{message.time}</span>
                                            </div>
                                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[600px]">
                                                <p className="text-sm text-teal-400">{message.text}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ClipboardIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <HandThumbUpIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <HandThumbDownIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <PencilIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Bottom input box - shows when chat is active */}
                {isChatActive && (
                    <div className="w-full px-4 pb-4">
                        <div className="w-full flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px]">
                            <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Discover the information you need in a snap!"
                                className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoFocus
                            />
                            <MicrophoneIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0 cursor-pointer" />
                            <CameraIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0 cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}