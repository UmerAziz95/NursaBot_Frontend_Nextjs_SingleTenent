import { Stethoscope as StethoscopeIcon } from "lucide-react"

const SIZES = {
    sm: { box: "h-7 w-7 rounded-lg", icon: "h-3.5 w-3.5" },
    md: { box: "h-9 w-9 rounded-xl", icon: "h-[18px] w-[18px]" },
    lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
}

export default function BrandMark({ size = "md", pulse = false, className = "" }) {
    const s = SIZES[size] || SIZES.md

    return (
        <span className={`nb-brandmark ${s.box} ${pulse ? "is-pulsing" : ""} ${className}`} aria-hidden="true">
            <StethoscopeIcon className={`${s.icon} relative`} strokeWidth={2.2} />
        </span>
    )
}
