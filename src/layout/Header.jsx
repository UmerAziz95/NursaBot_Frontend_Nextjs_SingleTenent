'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogPanel,
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
} from '@headlessui/react'
import {
    ArrowPathIcon,
    Bars3Icon,
    ChartPieIcon,
    CursorArrowRaysIcon,
    FingerPrintIcon,
    SquaresPlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'

import Link from 'next/link'

export default function Example() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 pt-[1vw]">
            <nav aria-label="Global" className="wrapper bg-black/5 backdrop-blur-[10px] px-[2vw] border border-gray-300 rounded-full mx-auto flex items-center justify-between py-[1vw]">
                <div className="flex lg:flex-1">
                    <a href="#" className="">
                        <span className="text-[1.5vw] font-bold">LOGO</span>
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-[3vw]">
                    <Link href="/" className="nav-link">
                        Home
                    </Link>
                    <Link href="/assistant" className="nav-link">
                        Assistant
                    </Link>
                    <a href="#" className="nav-link">
                        Study
                    </a>
                    <a href="#" className="nav-link">
                        Progress
                    </a>
                    <a href="#" className="nav-link">
                        FAQs
                    </a>
                </PopoverGroup>

                <div className="hidden lg:flex lg:flex-1 gap-2 lg:gap-[0.5vw] lg:justify-end">
                    <Link href="/login" className="btn-secondary">Login</Link>
                    <Link href="/login" className="btn-primary">Start Free</Link>
                </div>
            </nav>

            {/* mobile menu */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-white!" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto py-1 px-3">
                    <div className="flex items-center justify-between bg-white">
                        <a href="#">
                            <span className="sr-only">Your Company</span>
                            <img
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-auto"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                <a href="#" className="nav-link block">
                                    Home
                                </a>
                                <a href="#" className="nav-link block">
                                    Assistant
                                </a>
                                <a href="#" className="nav-link block">
                                    Study
                                </a>
                                <a href="#" className="nav-link block">
                                    Progress
                                </a>
                                <a href="#" className="nav-link block">
                                    FAQs
                                </a>
                            </div>
                            <div className="py-6">
                                <a
                                    href="#"
                                    className="block"
                                >
                                    Log in
                                </a>
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
