import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function HelpTab() {
    return (
        <TabsContent value="help" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-4">Help Center</h1>
                <hr className="border-gray-200" />
            </div>

            <div className="mb-8">
                <h2 className="text-xl! font-semibold mb-4">Contact Us</h2>

                {/* Email Field */}
                <div className="mb-4">
                    <Label htmlFor="email" className="text-base mb-2 block">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        defaultValue="johndoe089@gmail.com"
                        className="w-full bg-gray-50 border-gray-200 text-base py-6"
                    />
                </div>

                {/* Subject Field */}
                <div className="mb-4">
                    <Label htmlFor="subject" className="text-base mb-2 block">Subject</Label>
                    <Input
                        id="subject"
                        type="text"
                        defaultValue="AI Chat Problem"
                        className="w-full bg-gray-50 border-gray-200 text-base py-6"
                    />
                </div>

                {/* Message Field */}
                <div className="mb-4">
                    <Label htmlFor="message" className="text-base mb-2 block">Message</Label>
                    <Textarea
                        id="message"
                        placeholder="Type here"
                        className="w-full bg-gray-50 border-gray-200 text-base min-h-[200px] resize-none"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="bg-gray-100 border-none hover:bg-gray-200 text-base px-8 py-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-[#2CB5E8] hover:bg-[#25a0d1] text-white text-base px-8 py-6"
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}