'use client'

// Shared building blocks for the account settings dialog (nbs-* styles in globals.css).

export function PageHeader({ title, description, children }) {
    return (
        <header className="nbs-page-header">
            <div className="min-w-0">
                <h2 className="nbs-page-title">{title}</h2>
                {description ? <div className="nbs-page-desc">{description}</div> : null}
            </div>
            {children ? <div className="shrink-0">{children}</div> : null}
        </header>
    )
}

export function Section({ icon: Icon, title, description, action, tone = 'default', className = '', children, as: Tag = 'section', ...rest }) {
    return (
        <Tag className={`nbs-section ${tone !== 'default' ? `is-${tone}` : ''} ${className}`} {...rest}>
            {(title || Icon) && (
                <div className="nbs-section-head">
                    {Icon ? (
                        <span className="nbs-section-icon" aria-hidden="true">
                            <Icon className="size-4" />
                        </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        {title ? <h3 className="nbs-section-title">{title}</h3> : null}
                        {description ? <div className="nbs-section-desc">{description}</div> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            )}
            {children}
        </Tag>
    )
}

export function InfoTile({ icon: Icon, label, value, hint }) {
    return (
        <div className="nbs-tile">
            {Icon ? (
                <span className="nbs-tile-icon" aria-hidden="true">
                    <Icon className="size-4" />
                </span>
            ) : null}
            <div className="min-w-0">
                <div className="nbs-tile-label">{label}</div>
                <div className="nbs-tile-value" title={typeof value === 'string' ? value : undefined}>{value}</div>
                {hint ? <div className="nbs-tile-hint">{hint}</div> : null}
            </div>
        </div>
    )
}

const PILL_TONES = {
    active: 'is-success',
    answered: 'is-success',
    open: 'is-warning',
    expired: 'is-warning',
    cancelled: 'is-danger',
    closed: 'is-neutral',
}

export function StatusPill({ status, tone, className = '', children }) {
    const resolved = tone || PILL_TONES[String(status || '').toLowerCase()] || 'is-neutral'
    return (
        <span className={`nbs-pill ${resolved} ${className}`}>
            <span className="nbs-pill-dot" aria-hidden="true" />
            {children || status}
        </span>
    )
}

export function Field({ label, hint, htmlFor, children, trailing }) {
    return (
        <div className="nbs-field">
            <div className="nbs-field-top">
                <label className="nbs-label" htmlFor={htmlFor}>{label}</label>
                {trailing ? <span className="nbs-field-trailing">{trailing}</span> : null}
            </div>
            {children}
            {hint ? <div className="nbs-field-hint">{hint}</div> : null}
        </div>
    )
}

export function SkeletonPage() {
    return (
        <div className="nbs-page" aria-busy="true" aria-label="Loading settings">
            <div className="space-y-2">
                <span className="nbs-skel h-6 w-40" />
                <span className="nbs-skel h-4 w-72" />
            </div>
            <span className="nbs-skel h-32 w-full rounded-2xl" />
            <span className="nbs-skel h-48 w-full rounded-2xl" />
        </div>
    )
}
