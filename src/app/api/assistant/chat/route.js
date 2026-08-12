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
        const payload = await request.json()

        const query = typeof payload?.query === "string" ? payload.query.trim() : ""
        if (!query) {
            return NextResponse.json(
                {
                    code: "validation_error",
                    message: "Query is required.",
                },
                { status: 422 }
            )
        }

        const upstreamUrl = `${normalizeBase()}/api/ai/chat`
        const authHeader = request.headers.get("authorization")

        const upstreamResponse = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify(payload),
            cache: "no-store",
        })

        const rawText = await upstreamResponse.text()
        let body = null
        try {
            body = JSON.parse(rawText)
        } catch (error) {
            body = {
                code: "invalid_upstream_response",
                message: "Unable to process your request right now. Please try again.",
            }
        }

        if (!upstreamResponse.ok && body && typeof body === "object") {
            const rawMessage = String(body.message || body.detail || "").trim()
            if (
                !rawMessage
                || /chat failed|voice chat failed|errno|invalid argument|traceback|exception|upstream/i.test(rawMessage)
            ) {
                body.message = "Unable to process your request right now. Please try again."
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
                code: "assistant_proxy_error",
                message: "Unable to process your request right now. Please try again.",
            },
            { status: 500 }
        )
    }
}
