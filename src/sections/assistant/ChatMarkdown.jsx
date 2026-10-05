"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const components = {
    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    table: ({ node, ...props }) => (
        <div className="nb-md-table">
            <table {...props} />
        </div>
    ),
}

export default function ChatMarkdown({ children }) {
    return (
        <div className="nb-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {String(children || "")}
            </ReactMarkdown>
        </div>
    )
}
