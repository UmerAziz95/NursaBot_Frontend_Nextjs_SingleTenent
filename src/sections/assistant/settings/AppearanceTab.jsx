import { TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PencilIcon } from '@heroicons/react/24/outline';

export default function AppearanceTab() {
    return (
        <TabsContent value="appearance" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Appearance</h1>
                <hr className="border-gray-200" />
            </div>

            <div className="mb-6">
                <h2 className="text-lg! font-semibold mb-2">Appearance</h2>
                <p className="text-sm! text-gray-600">Change the appearance of the system as you want</p>
            </div>

            {/* Sections Header */}
            <div className="grid grid-cols-[2fr_1fr_auto] gap-4 pb-4 mb-6">
                <div className="text-sm font-semibold">Sections</div>
                <div className="text-sm font-semibold">Current Colour</div>
                <div className="text-sm font-semibold">Edit</div>
            </div>

            {/* Dropdown */}
            <div className="mb-8">
                <Select defaultValue="lorem">
                    <SelectTrigger className="w-[200px] bg-gray-100 border-none">
                        <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lorem">Lorem Ipsum</SelectItem>
                        <SelectItem value="section1">Section 1</SelectItem>
                        <SelectItem value="section2">Section 2</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Color Rows */}
            <div className="space-y-4">
                {/* Background Colour */}
                <div className="grid grid-cols-[2fr_1fr_auto] gap-4 items-center py-3">
                    <div className="text-base">Background Colour</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#1FB607] border border-gray-200"></div>
                        <span className="text-sm">#1FB607</span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Text Colour */}
                <div className="grid grid-cols-[2fr_1fr_auto] gap-4 items-center py-3">
                    <div className="text-base">Text Colour</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#000000] border border-gray-200"></div>
                        <span className="text-sm">#000000</span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Icon Colour */}
                <div className="grid grid-cols-[2fr_1fr_auto] gap-4 items-center py-3">
                    <div className="text-base">Icon Colour</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#DBDBDB] border border-gray-200"></div>
                        <span className="text-sm">#DBDBDB</span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </TabsContent>
    );
}