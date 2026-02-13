import { MagnifyingGlassIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon , Cog6ToothIcon } from "@heroicons/react/24/solid"
import SettingDialog from "@/sections/assistant/settings/Index"


export default function Sidebar() {
    return (
        <div className="h-screen bg-purple-500">
            <aside className="w-[230px] h-full bg-white flex flex-col justify-between p-5 shadow-[2px_0_10px_rgba(0,0,0,0.05)] overflow-y-auto">
                <div className="flex flex-col gap-4">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-10">
                        <span className="font-semibold text-[20px] text-slate-800">
                            Logo ipsum
                        </span>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px]">
                        <MagnifyingGlassIcon className="w-8 h-8 text-(--primary-color)" />
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                        />
                    </div>

                    {/* New Chat */}
                    <button className="flex items-center justify-center gap-1 px-4 py-3 text-white rounded-[30px] font-medium bg-(--primary-color)">
                        <span className="text-[1vw]" >New Chat</span>
                        <span className="text-[1.2vw]"  >+</span>
                    </button>

                    {/* Library */}
                    <div className="flex-1">
                        <h3 className="text-[16px] font-semibold text-black tracking-wide mb-2">
                            LIBRARY
                        </h3>

                        <ul className="space-y-1 text-[14px] text-[#918b8b]">
                            {/* Active Item */}
                            <li className="px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                Topic number 1
                            </li>

                            {/* Other Topics */}
                            <li className="px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                Topic number 4
                            </li>

                            <li className="px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                Topic number 5
                            </li>
                        </ul>
                    </div>
                </div>


                {/* Account */}
                <div className="">
                    <h3 className="text-[15px] font-semibold tracking-wide ">
                        ACCOUNT
                    </h3>

                    <button className="w-full flex items-center gap-2 text-left py-2.5 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50 ">
                        <InformationCircleIcon className="w-6 h-6 " />
                        Help
                    </button>

                    <SettingDialog>
                        
                    <button className="w-full flex items-center gap-2 mb-4 text-left py-2.5 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50 ">
                        <Cog6ToothIcon className="w-6 h-6 " />
                        Settings
                    </button>
                    </SettingDialog>

                    {/* Logout */}
                    <button className="flex items-center justify-center gap-3 py-3 px-5 w-full bg-red-600 text-white rounded-[30px] ">
                        <ArrowLeftOnRectangleIcon className="w-6 h-6 text-white" />
                        <span className="text-sm">logout</span>
                    </button>
                </div>

            </aside>
                        <span className="text-[14px]"> Log Out</span>
        </div>
    );
}
