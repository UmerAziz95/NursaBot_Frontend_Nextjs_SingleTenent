import Sidebar from "@/sections/assistant/Sidebar";
import ChatbotHeader from "@/sections/assistant/ChatbotHeader";
import ChatContent from "@/sections/assistant/ChatContent";

export default function AssistantPage() {
    return (
        <>
            <div className="assistant-page flex items-start">
                <Sidebar />
                <div className="chatbot-content w-full h-screen">
                    <ChatbotHeader />
                    <ChatContent />
                </div>
            </div>
        </>
    )
}