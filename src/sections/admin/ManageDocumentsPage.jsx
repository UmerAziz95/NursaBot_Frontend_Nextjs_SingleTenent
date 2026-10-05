'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Ban as BanIcon,
    CheckCircle2 as CheckIcon,
    ChevronDown as ChevronDownIcon,
    CloudUpload as CloudUploadIcon,
    FileText as FileTextIcon,
    Files as FilesIcon,
    Layers as LayersIcon,
    Loader2 as LoaderIcon,
    RefreshCw as RefreshIcon,
    RotateCcw as RetryIcon,
    Search as SearchIcon,
    Trash2 as TrashIcon,
    TriangleAlert as AlertIcon,
    X as XIcon,
} from 'lucide-react'
import { fetchLaravel, getLaravelApiUrl } from '@/lib/laravel-api'
import { ensureFreshToken, getStoredToken } from '@/lib/auth-session'
import { toast } from '@/lib/toast'
import './documents.css'

const MAX_BYTES = 50 * 1024 * 1024
const ACTIVE = ['queued', 'processing']
const POLL_ACTIVE_MS = 2000
const POLL_IDLE_MS = 20000

const STATUS = {
    queued: { label: 'Queued', tone: 'is-neutral' },
    processing: { label: 'Processing', tone: 'is-info' },
    indexed: { label: 'Ready', tone: 'is-success' },
    empty: { label: 'No text found', tone: 'is-warning' },
    failed: { label: 'Failed', tone: 'is-danger' },
    cancelled: { label: 'Cancelled', tone: 'is-neutral' },
}

const STAGE_LABEL = {
    queued: 'Waiting in queue',
    starting: 'Starting…',
    processing: 'Reading pages and creating embeddings',
    extracting: 'Extracting text',
    chunking: 'Splitting into chunks',
    embedding: 'Creating embeddings',
    saving: 'Saving to knowledge base',
    finalizing: 'Finishing up',
}

const formatBytes = (bytes) => {
    const n = Number(bytes) || 0
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
    if (n >= 1024) return `${Math.round(n / 1024)} KB`
    return `${n} B`
}

const formatWhen = (iso) => {
    if (!iso) return '—'
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const duration = (start, end) => {
    if (!start || !end) return ''
    const seconds = Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000))
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const docsPath = (business, workspace) =>
    `/api/admin/businesses/${encodeURIComponent(business)}/workspaces/${encodeURIComponent(workspace)}/documents`

/** Upload with byte-level progress (fetch cannot report upload progress). */
function uploadWithProgress(url, formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.setRequestHeader('Accept', 'application/json')
        const token = getStoredToken()
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.withCredentials = true
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
            let body = null
            try { body = JSON.parse(xhr.responseText) } catch { body = null }
            if (xhr.status >= 200 && xhr.status < 300) resolve(body)
            else reject(new Error(body?.detail || body?.message || (xhr.status === 413 ? 'The file is too large.' : 'Upload failed. Please try again.')))
        }
        xhr.onerror = () => reject(new Error('Network error while uploading. Please check your connection.'))
        xhr.send(formData)
    })
}

function ProgressBar({ value, tone = '' }) {
    return (
        <div className={`nbd-bar ${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
            <span style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
        </div>
    )
}

function DocumentProgress({ doc }) {
    if (doc.status === 'queued') {
        return <div className="nbd-progress-text"><LoaderIcon className="h-3 w-3" />Waiting in queue</div>
    }
    if (doc.status === 'processing') {
        const pages = doc.pages_total ? `Page ${doc.pages_done} of ${doc.pages_total}` : null
        return (
            <div className="nbd-progress">
                <div className="nbd-progress-head">
                    <span><LoaderIcon className="h-3 w-3 animate-spin" />{STAGE_LABEL[doc.stage] || 'Processing'}</span>
                    <strong>{doc.progress}%</strong>
                </div>
                <ProgressBar value={doc.progress} tone="is-active" />
                <div className="nbd-progress-meta">
                    {[pages, `${doc.chunks_done || doc.chunk_count || 0} chunks`].filter(Boolean).join(' · ')}
                </div>
            </div>
        )
    }
    if (doc.status === 'indexed') {
        return (
            <div className="nbd-progress-text is-done">
                <CheckIcon className="h-3.5 w-3.5" />
                {doc.chunk_count} chunks{doc.pages_total ? ` · ${doc.pages_total} pages` : ''}
                {doc.started_at && doc.finished_at ? ` · ${duration(doc.started_at, doc.finished_at)}` : ''}
            </div>
        )
    }
    if (doc.status === 'failed' || doc.status === 'empty') {
        return (
            <div className={`nbd-progress-text ${doc.status === 'failed' ? 'is-error' : 'is-warn'}`} title={doc.meta_json || ''}>
                <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                    {doc.status === 'empty' ? 'No readable text (scanned PDF?)' : doc.meta_json || 'Processing failed'}
                </span>
            </div>
        )
    }
    return <div className="nbd-progress-text">{doc.meta_json || '—'}</div>
}

export default function ManageDocumentsPage() {
    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [business, setBusiness] = useState('')
    const [workspace, setWorkspace] = useState('')
    const [documents, setDocuments] = useState([])
    const [loaded, setLoaded] = useState(false)
    const [uploads, setUploads] = useState([])
    const [dragging, setDragging] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [chunkWords, setChunkWords] = useState('')
    const [overlapWords, setOverlapWords] = useState('')
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')
    const [busyId, setBusyId] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    const fileInput = useRef(null)

    // Businesses, then workspaces of the selected business.
    useEffect(() => {
        let cancelled = false
        fetchLaravel('/api/admin/businesses')
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return
                const list = ok && Array.isArray(data) ? data : []
                setBusinesses(list)
                setBusiness((current) => current || list.find((b) => b.business_client_id === 'default')?.business_client_id || list[0]?.business_client_id || '')
            })
            .catch(() => { if (!cancelled) toast.error('Could not load businesses.') })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        if (!business) return undefined
        let cancelled = false
        fetchLaravel(`/api/admin/businesses/${encodeURIComponent(business)}/workspaces`)
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return
                const list = ok && Array.isArray(data) ? data : []
                setWorkspaces(list)
                setWorkspace((current) => (list.some((w) => w.workspace_id === current) ? current : list.find((w) => w.workspace_id === 'default')?.workspace_id || list[0]?.workspace_id || ''))
            })
            .catch(() => { if (!cancelled) toast.error('Could not load workspaces.') })
        return () => { cancelled = true }
    }, [business])

    const hasActive = documents.some((d) => ACTIVE.includes(d.status))
    const hasActiveRef = useRef(false)
    useEffect(() => { hasActiveRef.current = hasActive || uploads.length > 0 }, [hasActive, uploads.length])

    // Poll the server: fast while something is processing, slow otherwise.
    useEffect(() => {
        if (!business || !workspace) return undefined
        let cancelled = false
        let timer = null
        const load = () => {
            fetchLaravel(docsPath(business, workspace))
                .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    if (cancelled) return
                    if (ok && Array.isArray(data)) setDocuments(data)
                    else if (!ok) toast.error(data?.detail || 'Could not load documents.')
                    setLoaded(true)
                })
                .catch(() => { if (!cancelled) setLoaded(true) })
                .finally(() => {
                    if (!cancelled) timer = window.setTimeout(load, document.hidden ? POLL_IDLE_MS : (hasActiveRef.current ? POLL_ACTIVE_MS : POLL_IDLE_MS))
                })
        }
        load()
        return () => { cancelled = true; window.clearTimeout(timer) }
    }, [business, workspace, reloadKey])

    const refresh = useCallback(() => setReloadKey((n) => n + 1), [])

    const startUploads = async (fileList) => {
        const files = Array.from(fileList || [])
        if (!files.length) return
        if (!business || !workspace) {
            toast.error('Choose a business and workspace first.')
            return
        }
        await ensureFreshToken().catch(() => {})

        for (const file of files) {
            const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const ext = file.name.split('.').pop()?.toLowerCase()
            if (!['pdf', 'txt'].includes(ext)) {
                toast.error(`${file.name}: only PDF and TXT files are supported.`)
                continue
            }
            if (file.size > MAX_BYTES) {
                toast.error(`${file.name}: larger than 50 MB.`)
                continue
            }
            setUploads((list) => [...list, { id, name: file.name, size: file.size, percent: 0, error: '' }])

            const form = new FormData()
            form.append('file', file)
            if (Number(chunkWords) > 0) form.append('chunk_words', String(Number(chunkWords)))
            if (overlapWords !== '' && Number(overlapWords) >= 0) form.append('overlap_words', String(Number(overlapWords)))

            try {
                await uploadWithProgress(
                    getLaravelApiUrl(`${docsPath(business, workspace)}/upload`),
                    form,
                    (percent) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, percent } : u))),
                )
                setUploads((list) => list.filter((u) => u.id !== id))
                toast.success(`${file.name} uploaded — processing in the background.`)
                refresh()
            } catch (err) {
                setUploads((list) => list.map((u) => (u.id === id ? { ...u, error: err.message } : u)))
                toast.error(`${file.name}: ${err.message}`)
            }
        }
        if (fileInput.current) fileInput.current.value = ''
    }

    const act = async (doc, action) => {
        if (action === 'delete') {
            const chunks = doc.chunk_count ? ` and its ${doc.chunk_count} chunks/embeddings` : ''
            if (!window.confirm(`Delete “${doc.filename}”${chunks}? The assistant will stop using it. This cannot be undone.`)) return
        }
        setBusyId(doc.id)
        try {
            const path = `${docsPath(business, workspace)}/${encodeURIComponent(doc.id)}${action === 'delete' ? '' : `/${action}`}`
            const res = await fetchLaravel(path, { method: action === 'delete' ? 'DELETE' : 'POST' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || `Could not ${action} the document.`)
            if (action === 'delete') {
                setDocuments((list) => list.filter((d) => d.id !== doc.id))
                toast.success(data?.message || 'Document deleted.')
            } else {
                toast.success(action === 'cancel' ? 'Processing cancelled.' : 'Document queued again.')
            }
            refresh()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setBusyId('')
        }
    }

    const stats = useMemo(() => ({
        total: documents.length,
        ready: documents.filter((d) => d.status === 'indexed').length,
        active: documents.filter((d) => ACTIVE.includes(d.status)).length,
        failed: documents.filter((d) => ['failed', 'empty'].includes(d.status)).length,
        chunks: documents.reduce((sum, d) => sum + (Number(d.chunk_count) || 0), 0),
    }), [documents])

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase()
        return documents.filter((d) => {
            if (filter === 'active' && !ACTIVE.includes(d.status)) return false
            if (filter === 'ready' && d.status !== 'indexed') return false
            if (filter === 'issues' && !['failed', 'empty', 'cancelled'].includes(d.status)) return false
            return !q || d.filename.toLowerCase().includes(q) || String(d.uploaded_by || '').toLowerCase().includes(q)
        })
    }, [documents, filter, query])

    return (
        <div className="nbd">
            <div className="nbd-top">
                <section className="nba-card nbd-upload">
                    <div className="nbd-scope">
                        <label>
                            <span>Business</span>
                            <select value={business} onChange={(e) => { setBusiness(e.target.value); setLoaded(false); setDocuments([]) }}>
                                {businesses.map((b) => <option key={b.business_client_id} value={b.business_client_id}>{b.name || b.business_client_id}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Workspace</span>
                            <select value={workspace} onChange={(e) => { setWorkspace(e.target.value); setLoaded(false); setDocuments([]) }}>
                                {workspaces.map((w) => <option key={w.workspace_id} value={w.workspace_id}>{w.name || w.workspace_id}</option>)}
                            </select>
                        </label>
                    </div>

                    <div
                        className={`nbd-drop ${dragging ? 'is-dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); void startUploads(e.dataTransfer.files) }}
                        onClick={() => fileInput.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click() }}
                    >
                        <span className="nbd-drop-icon"><CloudUploadIcon className="h-6 w-6" /></span>
                        <div className="nbd-drop-title">Drop PDF or TXT files here, or <u>browse</u></div>
                        <div className="nbd-drop-hint">Up to 50 MB each · several files at once</div>
                        <input
                            ref={fileInput}
                            type="file"
                            multiple
                            accept=".pdf,.txt,application/pdf,text/plain"
                            className="sr-only"
                            onChange={(e) => void startUploads(e.target.files)}
                        />
                    </div>

                    {uploads.length > 0 && (
                        <ul className="nbd-uploads">
                            {uploads.map((u) => (
                                <li key={u.id} className={u.error ? 'is-error' : ''}>
                                    <FileTextIcon className="h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="nbd-uploads-row">
                                            <span className="truncate">{u.name}</span>
                                            <span>{u.error ? 'Failed' : u.percent < 100 ? `Uploading ${u.percent}%` : 'Queuing…'}</span>
                                        </div>
                                        {u.error ? <div className="nbd-uploads-error">{u.error}</div> : <ProgressBar value={u.percent} tone="is-upload" />}
                                    </div>
                                    {u.error && (
                                        <button type="button" className="nbd-icon" aria-label="Dismiss" onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}>
                                            <XIcon className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button type="button" className="nbd-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
                        <ChevronDownIcon className={`h-3.5 w-3.5 transition ${showAdvanced ? 'rotate-180' : ''}`} />
                        Chunking settings (optional)
                    </button>
                    {showAdvanced && (
                        <div className="nbd-advanced">
                            <label><span>Words per chunk</span><input type="number" min={50} max={2000} placeholder="Workspace default" value={chunkWords} onChange={(e) => setChunkWords(e.target.value)} /></label>
                            <label><span>Overlap words</span><input type="number" min={0} max={1000} placeholder="Workspace default" value={overlapWords} onChange={(e) => setOverlapWords(e.target.value)} /></label>
                        </div>
                    )}

                    <p className="nbd-note">
                        Processing runs on the server. You can leave this page or sign out — documents keep processing and you&apos;ll see the result here.
                    </p>
                </section>

                <div className="nbd-stats">
                    {[
                        { label: 'Documents', value: stats.total, icon: FilesIcon },
                        { label: 'Ready for chat', value: stats.ready, icon: CheckIcon, tone: 'is-green' },
                        { label: 'Processing', value: stats.active, icon: LoaderIcon, tone: 'is-brand', spin: stats.active > 0 },
                        { label: 'Chunks indexed', value: stats.chunks.toLocaleString(), icon: LayersIcon },
                    ].map(({ label, value, icon: Icon, tone, spin }) => (
                        <div key={label} className="nbd-stat">
                            <span className={`nbd-stat-icon ${tone || ''}`}><Icon className={`h-4 w-4 ${spin ? 'animate-spin' : ''}`} /></span>
                            <div>
                                <div className="nbd-stat-value">{value}</div>
                                <div className="nbd-stat-label">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <section className="nba-card nbd-history">
                <div className="nbd-history-head">
                    <h2 className="nba-card-title">Upload history</h2>
                    <div className="nbd-history-tools">
                        <div className="nba-tabs" role="tablist" aria-label="Filter documents">
                            {[
                                ['all', 'All', stats.total],
                                ['active', 'Processing', stats.active],
                                ['ready', 'Ready', stats.ready],
                                ['issues', 'Issues', documents.filter((d) => ['failed', 'empty', 'cancelled'].includes(d.status)).length],
                            ].map(([key, label, count]) => (
                                <button key={key} type="button" role="tab" aria-selected={filter === key} className={`nba-tab ${filter === key ? 'is-active' : ''}`} onClick={() => setFilter(key)}>
                                    {label}<span className="nba-tab-count">{count}</span>
                                </button>
                            ))}
                        </div>
                        <div className="nbd-search">
                            <SearchIcon className="h-4 w-4" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" aria-label="Search documents" />
                        </div>
                        <button type="button" className="admin-btn-secondary" onClick={refresh}>
                            <RefreshIcon className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="nbd-table-scroll">
                    <table className="admin-table nbd-table">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Status</th>
                                <th className="nbd-col-progress">Progress</th>
                                <th>Uploaded</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loaded ? (
                                [0, 1, 2].map((i) => <tr key={i}><td colSpan={5}><span className="nba-skel h-6 w-full" /></td></tr>)
                            ) : visible.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="cell-empty">
                                        <FilesIcon className="mx-auto mb-1 h-5 w-5 text-slate-400" />
                                        {documents.length === 0 ? 'No documents yet. Upload a PDF or TXT file to teach the assistant.' : 'No documents match this filter.'}
                                    </td>
                                </tr>
                            ) : visible.map((doc) => {
                                const status = STATUS[doc.status] || { label: doc.status, tone: 'is-neutral' }
                                const busy = busyId === doc.id
                                return (
                                    <tr key={doc.id}>
                                        <td>
                                            <div className="nbd-file">
                                                <span className={`nbd-file-icon is-${doc.file_type}`}>{String(doc.file_type || '').toUpperCase()}</span>
                                                <div className="min-w-0">
                                                    <div className="nbd-file-name" title={doc.filename}>{doc.filename}</div>
                                                    <div className="nbd-file-meta">{formatBytes(doc.file_size)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`nbd-status ${status.tone}`}>{status.label}</span></td>
                                        <td className="nbd-col-progress"><DocumentProgress doc={doc} /></td>
                                        <td>
                                            <div className="nbd-when">{formatWhen(doc.created_at)}</div>
                                            {doc.uploaded_by && <div className="nbd-file-meta truncate" title={doc.uploaded_by}>{doc.uploaded_by}</div>}
                                        </td>
                                        <td className="col-actions">
                                            <div className="flex justify-end gap-0.5">
                                                {ACTIVE.includes(doc.status) && (
                                                    <button type="button" className="admin-icon-btn" title="Cancel processing" disabled={busy} onClick={() => void act(doc, 'cancel')}>
                                                        <BanIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {['failed', 'cancelled', 'empty'].includes(doc.status) && (
                                                    <button type="button" className="admin-icon-btn" title="Process again" disabled={busy} onClick={() => void act(doc, 'retry')}>
                                                        <RetryIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    title="Delete document, chunks and embeddings"
                                                    disabled={busy}
                                                    onClick={() => void act(doc, 'delete')}
                                                >
                                                    {busy ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
