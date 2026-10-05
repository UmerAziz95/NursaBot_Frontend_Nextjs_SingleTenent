export default function SectionHeading({ eyebrow, title, text, align = 'center', light = false }) {
    return (
        <div className={`nbl-heading is-${align} ${light ? 'is-light' : ''}`}>
            {eyebrow ? <span className="nbl-eyebrow">{eyebrow}</span> : null}
            <h2 className="nbl-heading-title">{title}</h2>
            {text ? <p className="nbl-heading-text">{text}</p> : null}
        </div>
    )
}
