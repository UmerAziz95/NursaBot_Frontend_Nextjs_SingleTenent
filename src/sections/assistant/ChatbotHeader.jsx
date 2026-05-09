"use client";

import { useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import SettingDialog from "@/sections/assistant/settings/Index";
import SubscriptionDialog from "@/sections/assistant/settings/SubscriptionTab";

import {
    ArrowRightOnRectangleIcon,
    LifebuoyIcon,
    SparklesIcon,
    UserCircleIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatbotHeader() {
    const [subscriptionOpen, setSubscriptionOpen] = useState(false);

    return (
        <div className="chatbot-header">
            <header className="bg-(--header-bg) px-6 py-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <div className="pl-10">
                        <h1 className="text-[20px]! font-semibold text-white mb-[2px]">
                            AI Study Companion
                        </h1>
                        <p className="text-[13px]! text-white/70">
                            AI-Powered NCLEX Prep
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Settings Button */}
                    <SettingDialog>
                        <button className="p-3 bg-white border-none rounded-[15px] flex items-center justify-center cursor-pointer">
                            <Cog6ToothIcon className="w-5 h-5 text-slate-600" />
                        </button>
                    </SettingDialog>

                    {/* User Avatar Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-3 bg-white rounded-[15px] flex items-center justify-center cursor-pointer">
                                <img
                                    src="https://i.pravatar.cc/40?img=12"
                                    alt="User"
                                    className="w-5 h-5 object-cover rounded-full"
                                />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-64 bg-white text-black border border-black/10 rounded-2xl p-3 shadow-2xl"
                        >
                            {/* User Info */}
                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-semibold text-white">
                                    HA
                                </div>
                                <div>
                                    <p className="text-sm font-medium">hasfghg</p>
                                    <p className="text-xs text-gray-400">@hasfghg</p>
                                </div>
                            </div>

                            <DropdownMenuSeparator className="bg-black/10 my-2" />

                            {/* Upgrade Plan */}
                            <DropdownMenuItem
                                onClick={() => setSubscriptionOpen(true)}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                Upgrade plan
                            </DropdownMenuItem>

                            <DropdownMenuItem className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer">
                                <UserCircleIcon className="w-4 h-4" />
                                Personalization
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-black/10 my-2" />

                            <DropdownMenuItem className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <LifebuoyIcon className="w-4 h-4" />
                                    Help
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-black/60" />
                            </DropdownMenuItem>

                            <DropdownMenuItem className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer text-red-500">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Controlled Subscription Dialog */}
                    <SubscriptionDialog
                        open={subscriptionOpen}
                        onOpenChange={setSubscriptionOpen}
                    />
                </div>
            </header>
        </div>
    );
}
