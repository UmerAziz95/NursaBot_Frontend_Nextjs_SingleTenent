import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function AccountTab() {
    return (
        <TabsContent value="account" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Account</h1>
                <hr className="border-gray-200" />
            </div>

            {/* Get Olivia Pro Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl! font-semibold">Get Olivia Pro</h2>
                    <Button className="bg-[#2CB5E8] hover:bg-[#25a0d1] text-white px-6 rounded-3xl">
                        Upgrade
                    </Button>
                </div>

                <p className="text-sm! text-gray-600 mb-6">Get everything in Free. and more.</p>

                {/* Features List */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Go deep on harder questions</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur. Tincidunt.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur. Justo quam.</span>
                    </div>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl! font-semibold mb-2">Delete Account</h2>
                        <p className="text-sm! text-gray-600">Lorem ipsum dolor sit amet consectetur.</p>
                    </div>
                    <Button
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-3xl"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}