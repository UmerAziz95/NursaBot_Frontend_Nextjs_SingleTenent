import { NextResponse } from "next/server"

const normalizeBase = () => {
    const configured =
        process.env.NEXT_PUBLIC_LARAVEL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.LARAVEL_URL ||
        "http://127.0.0.1:8001"

    return configured.replace(/\/$/, "")
}

export async function POST(request) {
    try {
        const incomingFormData = await request.formData()
        const audioFile = incomingFormData.get("audio_file")

        if (!audioFile) {
            return NextResponse.json(
                {
                    code: "validation_error",
                    message: "audio_file is required.",
                },
                { status: 422 }
            )
        }

        const outgoingFormData = new FormData()
        const businessClientId = incomingFormData.get("business_client_id")
        const workspaceId = incomingFormData.get("workspace_id")
        const userId = incomingFormData.get("user_id")
        const chatId = incomingFormData.get("chat_id")
        const chatTitle = incomingFormData.get("chat_title")
        const promptEngineering = incomingFormData.get("prompt_engineering")

        if (businessClientId) outgoingFormData.append("business_client_id", String(businessClientId))
        if (workspaceId) outgoingFormData.append("workspace_id", String(workspaceId))
        if (userId) outgoingFormData.append("user_id", String(userId))
        if (chatId) outgoingFormData.append("chat_id", String(chatId))
        if (chatTitle) outgoingFormData.append("chat_title", String(chatTitle))
        if (promptEngineering) outgoingFormData.append("prompt_engineering", String(promptEngineering))

        const normalizedMime = String(audioFile.type || "audio/webm")
            .toLowerCase()
            .split(";", 1)[0]
            .trim()

        const safeMime = normalizedMime && normalizedMime !== "application/octet-stream"
            ? normalizedMime
            : "audio/webm"

        const originalName = String(audioFile.name || "").trim()
        const safeName = originalName.includes(".")
            ? originalName
            : `voice-note-${Date.now()}.webm`

        const audioBytes = await audioFile.arrayBuffer()
        const normalizedFile = new File([audioBytes], safeName, { type: safeMime })
        outgoingFormData.append("audio_file", normalizedFile, safeName)

        const upstreamUrl = `${normalizeBase()}/api/ai/chat/voice`
        const authHeader = request.headers.get("authorization")

        const upstreamResponse = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: outgoingFormData,
            cache: "no-store",
        })

        const rawText = await upstreamResponse.text()
        let body = null
        try {
            body = JSON.parse(rawText)
        } catch (error) {
            body = {
                code: "invalid_upstream_response",
                message: "Unable to process your voice message right now. Please try again.",
            }
        }

        if (!upstreamResponse.ok && body && typeof body === "object") {
            const rawMessage = String(body.message || body.detail || "").trim()
            if (
                !rawMessage
                || /chat failed|voice chat failed|errno|invalid argument|traceback|exception|upstream/i.test(rawMessage)
            ) {
                body.message = "Unable to process your voice message right now. Please try again."
            }
            delete body.details
        }

        return NextResponse.json(body, {
            status: upstreamResponse.status,
            headers: {
                "x-correlation-id": upstreamResponse.headers.get("x-correlation-id") || "",
            },
        })
    } catch (error) {
        return NextResponse.json(
            {
                code: "assistant_voice_proxy_error",
                message: "Unable to process your voice message right now. Please try again.",
            },
            { status: 500 }
        )
    }
}
