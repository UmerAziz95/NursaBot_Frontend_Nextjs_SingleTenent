import {
    AlignLeft as AlignLeftIcon,
    BookOpenText as BookOpenTextIcon,
    GraduationCap as GraduationCapIcon,
    Scale as ScaleIcon,
    Smile as SmileIcon,
} from "lucide-react"

// Keys must match the backend (`answer_mode`): FastAPI app/services/answer_modes.py
// and Laravel's AiChatRequest validation.
export const DEFAULT_ANSWER_MODE = "balanced"

export const ANSWER_MODES = [
    { key: "balanced", label: "Balanced", description: "Clear answer with the key points", icon: ScaleIcon },
    { key: "short", label: "Short", description: "Quick 2–4 sentence answer", icon: AlignLeftIcon },
    { key: "detailed", label: "Detailed", description: "In-depth with rationale & nursing care", icon: BookOpenTextIcon },
    { key: "simple", label: "Simple", description: "Plain language, beginner friendly", icon: SmileIcon },
    { key: "exam", label: "Exam prep", description: "NCLEX focus with a practice question", icon: GraduationCapIcon },
]

export const answerModeByKey = (key) =>
    ANSWER_MODES.find((mode) => mode.key === key) || ANSWER_MODES[0]

// Remembers a non-default mode per chat in this browser, so reopening a chat restores it.
const STORAGE_KEY = "nb_answer_modes"

const readAll = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
        return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
        return {}
    }
}

export const loadChatAnswerMode = (chatId) => {
    if (!chatId) return DEFAULT_ANSWER_MODE
    const saved = readAll()[chatId]
    return ANSWER_MODES.some((mode) => mode.key === saved) ? saved : DEFAULT_ANSWER_MODE
}

export const saveChatAnswerMode = (chatId, modeKey) => {
    if (!chatId) return
    try {
        const all = readAll()
        if (!modeKey || modeKey === DEFAULT_ANSWER_MODE) {
            delete all[chatId]
        } else {
            all[chatId] = modeKey
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch {
        // Storage can be unavailable (private mode); the mode still applies for this session.
    }
}
