import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SettingsTab() {
    return (
        <TabsContent value="settings" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Settings</h1>
                <hr className="border-gray-200" />
            </div>

            {/* Settings Section */}
            <div className="mb-8">
                <h2 className="text-lg! font-semibold mb-2">Settings</h2>
                <p className="text-sm! text-gray-600 mb-6">Lorem ipsum dolor sit amet consectetur.</p>

                {/* Appearance */}
                <div className="mb-6">
                    <h3 className="text-base font-semibold mb-4">Appearance</h3>

                    {/* Light Mode */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="text-base">Light</div>
                        <Switch defaultChecked className="data-[state=checked]:bg-[#5B68DF]" />
                    </div>

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="text-base">Dark</div>
                        <Switch className="data-[state=checked]:bg-[#5B68DF]" />
                    </div>
                </div>

                {/* Language & Region */}
                <div className="mb-6 mt-8">
                    <h3 className="text-base font-semibold mb-4">Language & Region</h3>

                    {/* Choose Region */}
                    <div className="flex items-center justify-between py-3 mb-4">
                        <div className="text-base">Choose Region</div>
                        <Select defaultValue="newyork">
                            <SelectTrigger className="w-[200px] bg-gray-50 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newyork">New York, USA</SelectItem>
                                <SelectItem value="london">London, UK</SelectItem>
                                <SelectItem value="tokyo">Tokyo, Japan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Choose Language */}
                    <div className="flex items-center justify-between py-3">
                        <div className="text-base">Choose Language</div>
                        <Select defaultValue="english">
                            <SelectTrigger className="w-[200px] bg-gray-50 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                                <SelectItem value="german">German</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Security Alerts */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold mb-1">Security Alerts</h3>
                            <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet consectetur.</p>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-[#5B68DF]" />
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}