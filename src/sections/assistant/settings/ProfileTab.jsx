'use client'

import { useEffect, useState } from 'react'
import {
    Building2 as BuildingIcon,
    Check as CheckIcon,
    Eye as EyeIcon,
    EyeOff as EyeOffIcon,
    FolderOpen as FolderIcon,
    KeyRound as KeyIcon,
    Lock as LockIcon,
    Mail as MailIcon,
    UserRound as UserIcon,
    X as XIcon,
} from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { initialsFrom, useSettings } from '@/sections/assistant/settings/SettingsContext'
import { resolveDisplayName } from '@/sections/assistant/settings/displayName'
import { Field, InfoTile, PageHeader, Section } from '@/sections/assistant/settings/SettingsUI'
import { toast } from '@/lib/toast'

const NAME_MAX = 120

// 0–4 score from length and character variety; only guides the user, the API enforces rules.
const passwordStrength = (value) => {
    if (!value) return { score: 0, label: '' }
    let score = 0
    if (value.length >= 8) score += 1
    if (value.length >= 12) score += 1
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
    return { score, label: value.length < 8 ? labels[0] : labels[score] }
}

function PasswordInput({ id, value, onChange, autoComplete, minLength, placeholder }) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="nbs-input-wrap">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                className="nbs-input has-trailing"
                required
                minLength={minLength}
                autoComplete={autoComplete}
                placeholder={placeholder}
            />
            <button
                type="button"
                className="nbs-input-trailing"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                title={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
        </div>
    )
}

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
    const nameChanged = displayName.trim() !== (visibleName || '')
    const strength = passwordStrength(password)
    const confirmTouched = passwordConfirmation.length > 0
    const passwordsMatch = confirmTouched && password === passwordConfirmation

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
        <TabsContent value="profile" className="nbs-page m-0 outline-none">
            <PageHeader title="Profile" description="Manage how you appear in NursingAI and keep your account secure." />

            <div className="nbs-hero">
                <div className="nbs-hero-banner" aria-hidden="true" />
                <div className="nbs-hero-body">
                    <span className="nbs-avatar is-xl">{initials}</span>
                    <div className="min-w-0 flex-1 pb-1">
                        <div className="nbs-hero-name">{visibleName || profile.email}</div>
                        <div className="nbs-hero-email">{profile.email}</div>
                    </div>
                    <span className="nbs-pill is-brand capitalize">{roleLabel}</span>
                </div>
            </div>

            <Section
                as="form"
                onSubmit={onSaveProfile}
                icon={UserIcon}
                title="Personal information"
                description="Your display name is shown in the chat and in support tickets."
            >
                <div className="nbs-grid">
                    <Field label="Display name" htmlFor="nbs-display-name" trailing={`${displayName.length}/${NAME_MAX}`}>
                        <input
                            id="nbs-display-name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="nbs-input"
                            maxLength={NAME_MAX}
                            placeholder="Add a display name"
                        />
                    </Field>
                    <Field label="Email address" htmlFor="nbs-email" hint="Contact support to change your email.">
                        <div className="nbs-input-wrap">
                            <MailIcon className="nbs-input-leading size-4" aria-hidden="true" />
                            <input id="nbs-email" value={profile.email || ''} readOnly className="nbs-input has-leading is-readonly" />
                            <LockIcon className="nbs-input-lock size-3.5" aria-hidden="true" />
                        </div>
                    </Field>
                </div>
                <div className="nbs-actions">
                    {nameChanged && (
                        <button
                            type="button"
                            className="nbs-btn is-ghost"
                            onClick={() => setDisplayName(visibleName || '')}
                            disabled={savingProfile}
                        >
                            Discard
                        </button>
                    )}
                    <button type="submit" disabled={savingProfile || !nameChanged} className="nbs-btn is-primary">
                        {savingProfile ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </Section>

            <Section
                icon={BuildingIcon}
                title="Workspace"
                description="Linked to your account. Answers are drawn from this workspace's documents."
            >
                <div className="nbs-grid">
                    <InfoTile
                        icon={BuildingIcon}
                        label="Business"
                        value={profile.business_name || profile.business_client_id || '—'}
                    />
                    <InfoTile
                        icon={FolderIcon}
                        label="Workspace"
                        value={profile.workspace_name || profile.workspace_id || '—'}
                    />
                </div>
            </Section>

            <Section
                as="form"
                onSubmit={onChangePassword}
                icon={KeyIcon}
                title="Password"
                description="Use at least 8 characters. A mix of letters, numbers and symbols is strongest."
            >
                <Field label="Current password" htmlFor="nbs-current-password">
                    <PasswordInput
                        id="nbs-current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </Field>
                <div className="nbs-grid">
                    <Field
                        label="New password"
                        htmlFor="nbs-new-password"
                        trailing={strength.label ? <span className={`nbs-strength-label is-${strength.score}`}>{strength.label}</span> : null}
                    >
                        <PasswordInput
                            id="nbs-new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                        />
                        <div className="nbs-strength" aria-hidden="true">
                            {[1, 2, 3, 4].map((step) => (
                                <span key={step} className={password && strength.score >= step ? `is-on is-${strength.score}` : ''} />
                            ))}
                        </div>
                    </Field>
                    <Field
                        label="Confirm new password"
                        htmlFor="nbs-confirm-password"
                        trailing={confirmTouched ? (
                            passwordsMatch
                                ? <span className="nbs-match is-ok"><CheckIcon className="size-3" /> Matches</span>
                                : <span className="nbs-match is-bad"><XIcon className="size-3" /> Doesn&apos;t match</span>
                        ) : null}
                    >
                        <PasswordInput
                            id="nbs-confirm-password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </Field>
                </div>
                <div className="nbs-actions">
                    <button
                        type="submit"
                        disabled={savingPassword || !currentPassword || !password || !passwordsMatch}
                        className="nbs-btn is-dark"
                    >
                        {savingPassword ? 'Updating…' : 'Update password'}
                    </button>
                </div>
            </Section>
        </TabsContent>
    )
}
