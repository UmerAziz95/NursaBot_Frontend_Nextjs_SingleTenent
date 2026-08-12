/**
 * Shared helpers for protected auth forms (honeypot + captcha payload).
 */

export function buildAuthProtectionPayload(honeypot, captcha) {
    return {
        website: honeypot?.website || '',
        company_url: honeypot?.company_url || '',
        fax_number: honeypot?.fax_number || '',
        captcha_token: captcha?.captcha_token || undefined,
        captcha_answer: captcha?.captcha_answer || undefined,
        challenge_id: captcha?.challenge_id || undefined,
    }
}

export function assertCaptchaReady(captcha) {
    if (!captcha || captcha.mode === 'loading' || captcha.mode === 'error') {
        return 'Please complete the captcha.'
    }
    if ((captcha.mode === 'turnstile' || captcha.mode === 'recaptcha') && !captcha.captcha_token) {
        return 'Please complete the captcha.'
    }
    if (captcha.mode === 'math' && !String(captcha.captcha_answer || '').trim()) {
        return 'Please solve the captcha challenge.'
    }
    return null
}
