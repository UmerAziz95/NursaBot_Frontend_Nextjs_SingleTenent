import { TabsContent } from "@/components/ui/tabs";
import { PencilIcon } from '@heroicons/react/24/outline';


export default function NotificationsTab() {
    return (


<TabsContent value="appearance" className="m-0 p-8">
    <h1 className="text-3xl font-bold">Appearance</h1>
    <p className="text-gray-600 mt-4">Customize how the app looks</p>
</TabsContent>

    );
}