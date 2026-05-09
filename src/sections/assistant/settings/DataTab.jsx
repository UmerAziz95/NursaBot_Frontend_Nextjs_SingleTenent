import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function DataTab() {
    return (
        <TabsContent value="data" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Data Control</h1>
                <hr className="border-gray-200" />
            </div>

            {/* Data Control Options */}
            <div className="space-y-6">
                {/* Improve the model for everyone */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Improve the model for everyone</div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#5B68DF]" />
                </div>

                {/* Shared links */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Shared links</div>
                    <Button variant="outline" className="bg-gray-100 border-none hover:bg-gray-200">
                        Manage
                    </Button>
                </div>

                {/* Archived chats */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Archived chats</div>
                    <Button variant="outline" className="bg-gray-100 border-none hover:bg-gray-200">
                        Manage
                    </Button>
                </div>

                {/* Archive all chats */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Archive all chats</div>
                    <Button variant="outline" className="bg-gray-100 border-none hover:bg-gray-200">
                        Archive all
                    </Button>
                </div>

                {/* Delete all chats */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Delete all chats</div>
                    <Button variant="outline" className="bg-gray-100 border-none hover:bg-gray-200">
                        Delete all
                    </Button>
                </div>

                {/* Export data */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="text-base">Export data</div>
                    <Button variant="outline" className="bg-gray-100 border-none hover:bg-gray-200">
                        Export
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}