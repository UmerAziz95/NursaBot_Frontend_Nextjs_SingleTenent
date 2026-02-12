import { ChevronDoubleLeftIcon , BellIcon , Cog6ToothIcon } from "@heroicons/react/24/solid";

export default function ChatbotHeader() {
    return (
        <div className="chatbot-header">
            <header className="bg-(--header-bg) px-6 py-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative">

                {/* Left Section */}
                <div className="flex items-center gap-4">

                    {/* Back Button */}
                    <div className=" p-3 bg-(--primary-color) border-2 border-white rounded-full flex items-center justify-center cursor-pointer absolute -left-[1.5%] top-[20%] ">
                        <ChevronDoubleLeftIcon className="w-5 h-5 text-white font-extrabold!" />
                    </div>

                    {/* Title */}
                    <div className="pl-10">
                        <h1 className="text-[24px]! font-semibold text-white mb-[2px]">
                            AI Study Companion
                        </h1>
                        <p className="text-[13px]! text-white/70">
                            AI-Powered NCLEX Prep
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">

                    {/* Icon Button 1 */}
                    <button className="p-3 bg-white border-none rounded-[15px] flex items-center justify-center cursor-pointer">
                        <BellIcon className="w-5 h-5 text-slate-600" />
                    </button>

                    {/* Icon Button 2 */}
                    <button className="p-3 bg-white border-none rounded-[15px] flex items-center justify-center cursor-pointer">
                        <Cog6ToothIcon className="w-5 h-5 text-slate-600" />
                    </button>

                    {/* User Avatar */}
                    <div className="p-3 bg-white rounded-[15px] flex items-center justify-center cursor-pointer">
                        <img
                            src="https://i.pravatar.cc/40?img=12"
                            alt="User"
                            className="w-5 h-5 object-cover rounded-full"
                        />
                    </div>
                </div>

            </header>
        </div>
    );
}
