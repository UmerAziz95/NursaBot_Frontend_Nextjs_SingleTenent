'use client'

import { useEffect, useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { initialsFrom, useSettings } from '@/sections/assistant/settings/SettingsContext'
import { resolveDisplayName } from '@/sections/assistant/settings/displayName'
import { toast } from '@/lib/toast'

const fieldClass = 'user-portal-input'
const labelClass = 'user-portal-label'
const panelClass = 'user-portal-panel'

export default function ProfileTab() {
    const { profile, updateProfile, changePassword } = useSettings()
    const [displayName, setDisplayName] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)

    useEffect(() => {
        setDisplayName(resolveDisplayName(profile?.display_name))
    }, [profile?.display_name])

    if (!profile) return null

    const visibleName = resolveDisplayName(profile.display_name)
    const initials = initialsFrom(visibleName || profile.email, profile.email)
    const roleLabel = String(profile.role || 'user').replaceAll('_', ' ')

    const onSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const nextName = displayName.trim()
            await updateProfile(nextName || null)
            setDisplayName(resolveDisplayName(nextName))
            toast.success('Profile updated.')
        } catch (err) {
            toast.error(err.message || 'Could not update profile.')
        } finally {
            setSavingProfile(false)
        }
    }

    const onChangePassword = async (e) => {
        e.preventDefault()
        setSavingPassword(true)
        try {
            if (password !== passwordConfirmation) {
                throw new Error('New passwords do not match.')
            }
            await changePassword({ currentPassword, password, passwordConfirmation })
            toast.success('Password updated.')
            setCurrentPassword('')
            setPassword('')
            setPasswordConfirmation('')
        } catch (err) {
            toast.error(err.message || 'Could not change password.')
        } finally {
            setSavingPassword(false)
        }
    }

    return (
        <TabsContent value="profile" className="m-0 block w-full space-y-5 p-5 outline-none md:p-7">
            <header className="border-b border-slate-100 pb-4">
                <h2 className="user-portal-page-title">Profile</h2>
                <p className="user-portal-page-desc mt-1">Manage how you appear in NursingAI.</p>
            </header>

            <div className={`${panelClass} flex items-center gap-4`}>
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#053447] text-xl font-bold text-white">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="user-portal-section-title truncate">{profile.email}</p>
                    <span className="user-portal-badge mt-2 bg-slate-100 text-slate-600">
                        {roleLabel}
                    </span>
                </div>
            </div>

            <form onSubmit={onSaveProfile} className={`${panelClass} space-y-4 bg-slate-50/50`}>
                <h3 className="user-portal-section-title">Personal information</h3>
                <label className="block">
                    <span className={labelClass}>Display name</span>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={fieldClass}
                        maxLength={120}
                        placeholder="Add a display name"
                    />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <span className={labelClass}>Email</span>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                            {profile.email}
                        </div>
                    </div>
                    <div>
                        <span className={labelClass}>Role</span>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm capitalize text-slate-600">
                            {roleLabel}
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={savingProfile}
                    className="user-portal-btn-primary"
                >
                    {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
            </form>

            <div className={`${panelClass} space-y-3`}>
                <h3 className="user-portal-section-title">Workspace assignment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-3.5 py-3">
                        <span className="user-portal-kicker">Business</span>
                        <p className="mt-1 truncate text-sm font-medium text-slate-800">
                            {profile.business_name || profile.business_client_id || '—'}
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3.5 py-3">
                        <span className="user-portal-kicker">Workspace</span>
                        <p className="mt-1 truncate text-sm font-medium text-slate-800">
                            {profile.workspace_name || profile.workspace_id || '—'}
                        </p>
                    </div>
                </div>
                <p className="user-portal-caption leading-relaxed">
                    Business and workspace are assigned by your administrator and cannot be changed here.
                </p>
            </div>

            <form onSubmit={onChangePassword} className={`${panelClass} space-y-4`}>
                <h3 className="user-portal-section-title">Change password</h3>
                <label className="block">
                    <span className={labelClass}>Current password</span>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={fieldClass}
                        required
                        autoComplete="current-password"
                    />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                        <span className={labelClass}>New password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClass}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Confirm new password</span>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className={fieldClass}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={savingPassword}
                    className="user-portal-btn-dark"
                >
                    {savingPassword ? 'Updating…' : 'Update password'}
                </button>
            </form>
        </TabsContent>
    )
}
