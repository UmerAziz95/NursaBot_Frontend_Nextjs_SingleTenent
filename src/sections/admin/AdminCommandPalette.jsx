'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft as EnterIcon, Search as SearchIcon } from 'lucide-react'
import { navGroupsForRole } from '@/sections/admin/adminNav'

// Ctrl/Cmd+K quick navigation across admin pages. Mounted only while open,
// so every opening starts with an empty search.
export default function AdminCommandPalette({ onClose, role = 'admin' }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        const items = navGroupsForRole(role).flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
        if (!q) return items
        // Title matches rank above description/section matches ("sub" → Subscriptions before Users).
        const score = (item) => {
            const label = item.label.toLowerCase()
            if (label.startsWith(q)) return 0
            if (label.includes(q)) return 1
            if (`${item.description} ${item.group}`.toLowerCase().includes(q)) return 2
            return -1
        }
        return items
            .map((item, index) => ({ item, index, rank: score(item) }))
            .filter((entry) => entry.rank >= 0)
            .sort((a, b) => a.rank - b.rank || a.index - b.index)
            .map((entry) => entry.item)
    }, [query, role])

    const go = (item) => {
        if (!item) return
        onClose()
        router.push(item.href)
    }

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
        } else if (event.key === 'Enter') {
            event.preventDefault()
            go(results[activeIndex])
        } else if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
        }
    }

    return (
        <div className="nba-palette-backdrop" onMouseDown={onClose} role="presentation">
            <div
                className="nba-palette"
                role="dialog"
                aria-modal="true"
                aria-label="Go to page"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="nba-palette-search">
                    <SearchIcon className="h-4 w-4" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value)
                            setActiveIndex(0)
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Jump to a page…"
                        aria-label="Search admin pages"
                    />
                    <kbd>Esc</kbd>
                </div>
                <ul className="nba-palette-list" role="listbox">
                    {results.length === 0 ? (
                        <li className="nba-palette-empty">No pages match “{query.trim()}”.</li>
                    ) : results.map((item, index) => {
                        const Icon = item.icon
                        const active = index === activeIndex
                        return (
                            <li key={item.href} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    className={`nba-palette-item ${active ? 'is-active' : ''}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => go(item)}
                                >
                                    <span className="nba-palette-icon"><Icon className="h-4 w-4" /></span>
                                    <span className="min-w-0 flex-1 text-left">
                                        <span className="nba-palette-label">{item.label}</span>
                                        <span className="nba-palette-desc">{item.description}</span>
                                    </span>
                                    <span className="nba-palette-group">{item.group}</span>
                                    {active && <EnterIcon className="nba-palette-enter h-3.5 w-3.5" />}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}
