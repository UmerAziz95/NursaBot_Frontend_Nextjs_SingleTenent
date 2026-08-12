const GENERIC_DISPLAY_NAMES = new Set(['normal user', 'user', 'your name'])

export const isGenericDisplayName = (value) => {
    const normalized = String(value || '').trim().toLowerCase()
    return !normalized || GENERIC_DISPLAY_NAMES.has(normalized)
}

export const resolveDisplayName = (value) => {
    const normalized = String(value || '').trim()
    return isGenericDisplayName(normalized) ? '' : normalized
}
