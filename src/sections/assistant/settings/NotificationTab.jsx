import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function NotificationsTab() {
    return (
        <TabsContent value="notifications" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Notifications</h1>
                <hr className="border-gray-200" />
            </div>

            <div className="mb-6">
                <h2 className="text-lg! font-semibold mb-2">Notifications</h2>
                <p className="text-sm! text-gray-600">Select the notifications you want to receive</p>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 pb-4 border-b border-gray-200 mb-4">
                <div className="text-sm font-medium">Notification</div>
                <div className="text-sm font-medium text-center">Push</div>
                <div className="text-sm font-medium text-center">Email</div>
            </div>

            {/* Notification Rows */}
            <div className="space-y-4">
                {/* Responses */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 border-b border-gray-100">
                    <div className="text-base">Responses</div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked/>
                    </div>
                    <div className="flex justify-center">
                        <Switch />
                    </div>
                </div>

                {/* Group Chat */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 border-b border-gray-100">
                    <div className="text-base">Group Chat</div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                    <div className="flex justify-center">
                        <Switch />
                    </div>
                </div>

                {/* Tasks */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 border-b border-gray-100">
                    <div className="text-base">Tasks</div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                </div>

                {/* Project */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 border-b border-gray-100">
                    <div className="text-base">Project</div>
                    <div className="flex justify-center">
                        <Switch />
                    </div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                </div>

                {/* Recommendations */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 border-b border-gray-100">
                    <div className="text-base">Recommendations</div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                    <div className="flex justify-center">
                        <Switch className="bg-purple-500!" defaultChecked />
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}