import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    UserCircleIcon,
    BellIcon,
    PaintBrushIcon,
    CreditCardIcon,
    CircleStackIcon,
    QuestionMarkCircleIcon,
    Cog6ToothIcon,
    UserIcon,
    ArrowLeftIcon,
    PencilIcon
} from '@heroicons/react/24/outline';


// Import all tab components
import ProfileTab from '@/sections/assistant/settings/ProfileTab';
import NotificationTab from '@/sections/assistant/settings/NotificationTab';
import AppearanceTab from '@/sections/assistant/settings/AppearanceTab';
import PaymentTab from '@/sections/assistant/settings/PaymentTab';
import DataTab from '@/sections/assistant/settings/DataTab';
import HelpTab from '@/sections/assistant/settings/HelpTab';
import SettingTab from '@/sections/assistant/settings/SettingTab';
import AccountTab from '@/sections/assistant/settings/AccountTab';

export default function SettingDialog({ children }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[900px] p-0 gap-0">
                <Tabs defaultValue="profile" className="w-full flex! flex-row! h-[700px]">
                    {/* Left Sidebar */}
                    <div className="w-[280px] bg-gray-50 p-6 h-full flex flex-col border-r rounded-2xl">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 mb-8 hover:bg-gray-100">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>

                        <TabsList className="flex flex-col h-auto!  space-y-1 bg-transparent  w-full">
                            <TabsTrigger
                                value="profile"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <UserCircleIcon className="w-5 h-5 mr-3" />
                                Profile
                            </TabsTrigger>

                            <TabsTrigger
                                value="notifications"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <BellIcon className="w-5 h-5 mr-3" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger
                                value="appearance"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <PaintBrushIcon className="w-5 h-5 mr-3" />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger
                                value="payment"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <CreditCardIcon className="w-5 h-5 mr-3" />
                                Payment Method
                            </TabsTrigger>
                            <TabsTrigger
                                value="data"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <CircleStackIcon className="w-5 h-5 mr-3" />
                                Data Control
                            </TabsTrigger>
                            <TabsTrigger
                                value="help"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5 mr-3" />
                                Help Center
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <Cog6ToothIcon className="w-5 h-5 mr-3" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger
                                value="account"
                                className="w-full justify-start px-4 py-3 data-[state=active]:bg-gray-200 data-[state=active]:text-black rounded-lg"
                            >
                                <UserIcon className="w-5 h-5 mr-3" />
                                Account
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Right Content Area */}
                    <div className="overflow-y-auto w-full">
                        <ProfileTab/>
                        <NotificationTab />
                        <AppearanceTab />
                        <PaymentTab />
                        <DataTab />
                        <HelpTab />
                        <SettingTab />
                        <AccountTab />
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}