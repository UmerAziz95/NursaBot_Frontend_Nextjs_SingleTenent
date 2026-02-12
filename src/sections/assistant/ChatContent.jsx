import { MagnifyingGlassIcon , ArrowUpRightIcon } from "@heroicons/react/24/outline"
import { CameraIcon, MicrophoneIcon } from "@heroicons/react/24/solid"

export default function ChatContent() {

    return (
        <div className="chat-content bg-gray-300 p-3 w-full h-full">
            <div className="chatbox w-full h-full bg-white rounded-2xl relative">

                {/* logo */}
                <div className="flex justify-center w-full pt-3">
                    <img
                        src="/assets/images/chatlogo.png"
                        alt="User"
                        className="object-cover"
                    />
                </div>

                {/* center Content */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-col justify-center items-center">
                    <div className="text-center">
                        <h1 className="text-[30px]! mb-2">Discover the information you need in a snap!</h1>
                        <p>Your Digital AI-Powered NCLEX Prep Awaits</p>
                    </div>

                    {/* input box */}
                    <div className="w-[578px] flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px]">
                        <MagnifyingGlassIcon className="w-8 h-8 text-(--primary-color)" />
                        <input
                            type="text"
                            placeholder="Discover the information you need in a snap!"
                            className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                        />
                        <MicrophoneIcon className="w-8 h-8 text-(--primary-color)" />
                        <CameraIcon className="w-8 h-8 text-(--primary-color)" />


                    </div>

                    {/* Suggestions */}
                    <div className="flex items-center gap-4">
                        <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl">
                            <p className="text-[10px]!">Lorem Ipsum Dolor Sit</p>
                            <ArrowUpRightIcon className="w-3 h-2 text-black" />

                        </div>
                        <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl">
                            <p className="text-[10px]!">Lorem Ipsum Dolor Sit</p>
                            <ArrowUpRightIcon className="w-3 h-2 text-black" />

                        </div>
                        <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl">
                            <p className="text-[10px]!">Lorem Ipsum Dolor Sit</p>
                            <ArrowUpRightIcon className="w-3 h-2 text-black" />

                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}