import Sidebar from "@/sections/assistant/Sidebar";
import ChatbotHeader from "@/sections/assistant/ChatbotHeader";
import ChatContent from "@/sections/assistant/ChatContent";

export default function AssistantPage() {
    return (
        <div className="assistant-page flex h-screen overflow-hidden">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-h-0">

                {/* Header (fixed height automatically) */}
                <ChatbotHeader />

                {/* Chat Content (scrollable only here) */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <ChatContent />
                </div>

            </div>
        </div>
    );
}
