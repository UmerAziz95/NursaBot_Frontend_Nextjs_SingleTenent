'use client'

/**
 * Hidden fields that real users never see. Autofill bots often fill them;
 * the API rejects any non-empty honeypot value.
 */
export default function HoneypotFields({ values, onChange }) {
    const fields = [
        { name: 'website', label: 'Website' },
        { name: 'company_url', label: 'Company URL' },
        { name: 'fax_number', label: 'Fax number' },
    ]

    return (
        <div
            aria-hidden="true"
            tabIndex={-1}
            style={{
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
            }}
        >
            {fields.map(({ name, label }) => (
                <label key={name}>
                    {label}
                    <input
                        type="text"
                        name={name}
                        autoComplete="off"
                        tabIndex={-1}
                        value={values?.[name] || ''}
                        onChange={(event) => onChange?.(name, event.target.value)}
                    />
                </label>
            ))}
        </div>
    )
}

export const emptyHoneypot = () => ({
    website: '',
    company_url: '',
    fax_number: '',
})
