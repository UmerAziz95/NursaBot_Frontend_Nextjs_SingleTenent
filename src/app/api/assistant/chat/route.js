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
                message: rawText || "Non-JSON response returned by Laravel.",
            }
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
                message: "Failed to process assistant request.",
                details: {
                    exception: error.message,
                },
            },
            { status: 500 }
        )
    }
}
