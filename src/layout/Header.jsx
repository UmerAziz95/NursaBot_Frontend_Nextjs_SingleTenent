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
            <nav aria-label="Global" className="wrapper bg-black/5 backdrop-blur-[10px] px-5 py-3 lg:px-[2vw] border border-gray-300 rounded-full mx-auto flex items-center justify-between lg:py-[1vw]">
                <div className="flex ">
                    <a href="#" className="">
                        <span className="text-sm lg:text-[1.5vw] font-bold">LOGO</span>
                    </a>
                </div>
               

                <div className=" flex gap-2 lg:gap-[0.5vw] lg:justify-end">
                    <Link href="/login" className="btn-secondary">Login</Link>
                    <Link href="/login" className="btn-primary">Start Free</Link>
                </div>
            </nav>
        </header>
    )
}
