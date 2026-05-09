import { TabsContent } from "@/components/ui/tabs";
import { PencilIcon } from '@heroicons/react/24/outline';



export default function NotificationsTab() {
    return (
        <TabsContent value="profile" className="m-0 p-8 w-full! text-black">
            <div className="mb-8">
                <h1 className="text-xl! font-bold mb-6">Profile</h1>
                <hr className="border-gray-200" />
            </div>

            {/* Personal Information */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm! font-semibold">Personal Information</h2>
                    <button className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-8">
                    <div className="w-32 h-32 bg-teal-700 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                        JD
                    </div>
                    <div className="grid grid-cols-2 gap-x-16 gap-y-4 flex-1 text-gray-600">
                        <div>
                            <div className="text-sm mb-1">First Name:</div>
                            <div className="text-base">John</div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Last Name:</div>
                            <div className="text-base">Doe</div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Gender:</div>
                            <div className="text-base">Male</div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Age:</div>
                            <div className="text-base">27</div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* More Details */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm! font-semibold">More Details</h2>
                    <button className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between">
                        <div className="text-sm">Email:</div>
                        <div className="text-sm text-right">Johndoe12@gmail.com</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="text-sm">Address:</div>
                        <div className="text-sm text-right">plot no 7, abc street, xyz state,</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="text-sm">Phone Number:</div>
                        <div className="text-sm text-right">01 2345 6789012</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="text-sm">Postal Code:</div>
                        <div className="text-sm text-right">01234</div>
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}