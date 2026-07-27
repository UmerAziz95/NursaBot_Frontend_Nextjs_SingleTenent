"use client";

import { useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles as SparklesIcon } from 'lucide-react';
import { fetchLaravel } from "@/lib/laravel-api";

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const decodeJwtPayload = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) return null
    try {
        const payloadPart = token.split('.')[1]
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
        return null
    }
}

const getStoredRole = () => {
    if (typeof window === 'undefined') return ''
    const storedUser = readStoredJson('user') || {}
    const storedSession = readStoredJson('session') || {}
    const token = storedSession.access_token || localStorage.getItem('token') || ''
    const tokenPayload = decodeJwtPayload(token)

    return String(
        storedUser.role ||
        storedSession.role ||
        localStorage.getItem('role') ||
        tokenPayload?.role ||
        ''
    ).trim().toLowerCase()
}

function OpenAiApiKeySection() {
    const [apiKey, setApiKey] = useState('')
    const [status, setStatus] = useState(null)
    const [loadingStatus, setLoadingStatus] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    const loadStatus = async () => {
        setLoadingStatus(true)
        try {
            const response = await fetchLaravel('/api/admin/system-config/openai-api-key')
            if (response.ok) {
                setStatus(await response.json())
            }
        } catch {
            // ignore, section still usable for saving a new key
        } finally {
            setLoadingStatus(false)
        }
    }

    useEffect(() => {
        loadStatus()
    }, [])

    const handleSave = async () => {
        if (!apiKey.trim()) return
        setSaving(true)
        setMessage(null)
        try {
            const response = await fetchLaravel('/api/admin/system-config/openai-api-key', {
                method: 'PUT',
                body: JSON.stringify({ value: apiKey.trim() }),
            })
            const data = await response.json().catch(() => ({}))
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'API key saved.' })
                setApiKey('')
                await loadStatus()
            } else {
                setMessage({ type: 'error', text: data.detail || 'Failed to save API key.' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to reach the server.' })
        } finally {
            setSaving(false)
        }
    }

    const handleClear = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const response = await fetchLaravel('/api/admin/system-config/openai-api-key', {
                method: 'DELETE',
            })
            const data = await response.json().catch(() => ({}))
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'API key override cleared.' })
                await loadStatus()
            } else {
                setMessage({ type: 'error', text: data.detail || 'Failed to clear API key.' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to reach the server.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl! font-semibold">OpenAI API Key</h2>
            </div>
            <p className="text-sm! text-gray-600 mb-4">
                {loadingStatus
                    ? 'Checking current key status...'
                    : status?.set
                        ? `Currently using key from ${status.source === 'database' ? 'this setting' : 'server environment'}: ${status.masked_key}`
                        : 'No OpenAI API key is currently configured.'}
            </p>

            <div className="flex items-center gap-3">
                <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="max-w-md"
                    autoComplete="off"
                />
                <Button
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                    className="bg-[#2CB5E8] hover:bg-[#25a0d1] text-white px-6 rounded-3xl"
                >
                    Save
                </Button>
                {status?.has_database_override && (
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={saving}
                        className="px-6 rounded-3xl"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {message && (
                <p className={`text-sm! mt-3 ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {message.text}
                </p>
            )}

            <p className="text-xs! text-gray-400 mt-3">
                Takes effect immediately on the next chat request — no server restart needed.
            </p>
        </div>
    )
}

export default function AccountTab() {
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const role = getStoredRole()
        setIsAdmin(['admin', 'super_admin'].includes(role))
    }, [])

    return (
        <TabsContent value="account" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Account</h1>
                <hr className="border-gray-200" />
            </div>

            {isAdmin && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                    <OpenAiApiKeySection />
                </div>
            )}

            {/* Get Olivia Pro Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl! font-semibold">Get Olivia Pro</h2>
                    <Button className="bg-[#2CB5E8] hover:bg-[#25a0d1] text-white px-6 rounded-3xl">
                        Upgrade
                    </Button>
                </div>

                <p className="text-sm! text-gray-600 mb-6">Get everything in Free. and more.</p>

                {/* Features List */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Go deep on harder questions</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur. Tincidunt.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs!">Lorem ipsum dolor sit amet consectetur. Justo quam.</span>
                    </div>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl! font-semibold mb-2">Delete Account</h2>
                        <p className="text-sm! text-gray-600">Lorem ipsum dolor sit amet consectetur.</p>
                    </div>
                    <Button
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-3xl"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}
