import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import assistantIcon from '../assets/dashboard/assistant.svg'

const AssistantContext = createContext(null)
const prompts = [
  'Challenge my latest assumption',
  'What evidence is missing?',
]
const dateFormat = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' })

function readHistory(key) {
  if (!key) return []
  try {
    const history = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    return Array.isArray(history) ? history : []
  } catch {
    return []
  }
}

// Proposed backend contract: POST { conversationId, messages: [{ role, content }] }
// Return JSON { reply: string } and authenticate the request on the server.
async function requestReply(conversationId, messages, signal) {
  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ conversationId, messages }),
    signal,
  })

  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Assistant is unavailable. Try again later.')
  }

  const { reply } = await response.json()
  if (typeof reply !== 'string' || !reply.trim()) throw new Error('No reply received. Try again.')
  return reply.trim()
}

function AssistantSession({ children, storageKey }) {
  const [threads, setThreads] = useState(() => readHistory(storageKey))
  const [activeId, setActiveId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [failure, setFailure] = useState(null)
  const request = useRef(null)
  const dialog = useRef(null)
  const trigger = useRef(null)
  const active = threads.find(({ id }) => id === activeId)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!storageKey) return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(threads))
    } catch {
      // The current page can still use its in-memory history.
    }
  }, [storageKey, threads])

  useEffect(() => () => request.current?.abort(), [])

  function openPanel(event) {
    trigger.current = event.currentTarget
    if (!dialog.current.open) dialog.current.show()
    setPanelOpen(true)
  }

  function closePanel() {
    dialog.current.close()
    setPanelOpen(false)
  }

  function selectThread(id) {
    setActiveId(id)
    setDraft('')
  }

  async function finishTurn(thread) {
    const controller = new AbortController()
    request.current = controller
    setPendingId(thread.id)
    setFailure(null)

    try {
      const content = await requestReply(thread.id, thread.messages, controller.signal)
      if (controller.signal.aborted) return
      setThreads((previous) => previous.map((item) => item.id === thread.id
        ? { ...item, messages: [...item.messages, { role: 'assistant', content }] }
        : item))
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure({ id: thread.id, message: error.message || 'Unable to send. Try again.' })
      }
    } finally {
      if (request.current === controller) {
        request.current = null
        if (!controller.signal.aborted) setPendingId(null)
      }
    }
  }

  function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || request.current || active?.messages.at(-1)?.role === 'user') return

    const thread = {
      id: active?.id ?? crypto.randomUUID(),
      title: active?.title ?? content.slice(0, 64),
      updatedAt: new Date().toISOString(),
      messages: [...(active?.messages ?? []), { role: 'user', content }],
    }
    setThreads((previous) => [thread, ...previous.filter(({ id }) => id !== thread.id)])
    setActiveId(thread.id)
    setDraft('')
    void finishTurn(thread)
  }

  const value = {
    active, threads, pendingId, failure, draft, setDraft, panelOpen, openPanel,
    closePanel, selectThread, sendMessage,
    retry: () => {
      if (!request.current && active?.messages.at(-1)?.role === 'user') void finishTurn(active)
    },
  }

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <dialog id="assistant-panel" ref={dialog} className="assistant-drawer" aria-labelledby="assistant-drawer-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            closePanel()
          }
        }}
        onClose={() => {
          setPanelOpen(false)
          if (trigger.current?.isConnected) trigger.current.focus()
        }}>
        {panelOpen && (
          <>
            <header className="assistant-toolbar">
              <h2 id="assistant-drawer-title">AI Assistant</h2>
              <button type="button" onClick={closePanel} aria-label="Close assistant">×</button>
            </header>
            <AssistantChat compact />
          </>
        )}
      </dialog>
    </AssistantContext.Provider>
  )
}

export function AssistantProvider({ children }) {
  useLocation()
  const student = sessionStorage.getItem('currentStudentId')
  const storageKey = student ? `collabeng.assistant.${student}` : null
  return <AssistantSession key={storageKey ?? 'guest'} storageKey={storageKey}>{children}</AssistantSession>
}

export function AssistantTrigger() {
  const assistant = useContext(AssistantContext)
  if (!assistant) return null

  return (
    <button className="assistant-trigger" type="button" aria-label="Open AI chat"
      aria-haspopup="dialog" aria-controls="assistant-panel" onClick={assistant.openPanel}>
      <img src={assistantIcon} alt="" />
    </button>
  )
}

function AssistantChat({ showPrompts = false, compact = false }) {
  const { active, pendingId, failure, draft, setDraft, sendMessage, retry } = useContext(AssistantContext)
  const transcript = useRef(null)
  const input = useRef(null)

  useEffect(() => {
    if (compact) input.current?.focus({ preventScroll: true })
  }, [compact])
  const messages = active?.messages
  const waiting = Boolean(pendingId && pendingId === active?.id)
  const unanswered = messages?.at(-1)?.role === 'user' && !waiting

  useEffect(() => {
    transcript.current.scrollTop = transcript.current.scrollHeight
  }, [messages, waiting])

  return (
    <section className="assistant-chat" aria-label="Assistant conversation">
      {!compact && <h2>{active?.title ?? 'New Chat'}</h2>}
      <div className="assistant-log" ref={transcript} role="log" aria-label="Conversation">
        {!messages?.length && <p className="assistant-empty"></p>}
        {messages?.map(({ role, content }, index) => (
          <article className="assistant-message" data-role={role} key={index}>
            <strong>{role === 'user' ? 'You' : 'AI'}</strong>
            <p>{content}</p>
          </article>
        ))}
        {waiting && <p role="status">Waiting for a reply…</p>}
        {unanswered && (
          <div className="assistant-error">
            <p role="status">{failure?.id === active.id ? failure.message : 'This message has no reply yet.'}</p>
            <button type="button" disabled={Boolean(pendingId)} onClick={retry}>Retry</button>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="assistant-compose">
        {showPrompts && !messages?.length && (
          <div className="assistant-prompts">
            {prompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setDraft(prompt)}>{prompt}</button>
            ))}
          </div>
        )}
        <div className="assistant-input">
          <textarea ref={input} aria-label="Ask AI Assistant" rows={compact ? 1 : 2} value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={compact ? 'Ask AI Assistant…' : 'Ask about your design decisions, assumptions, or evidence…'}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
              event.preventDefault()
              if (!event.repeat) event.currentTarget.form.requestSubmit()
            }} />
          <button type="submit" aria-label="Send message" disabled={!draft.trim() || Boolean(pendingId) || unanswered}>→</button>
        </div>
      </form>
    </section>
  )
}

export function AssistantWorkspace() {
  const { active, threads, selectThread } = useContext(AssistantContext)
  const [historyOpen, setHistoryOpen] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(max-width: 700px)').matches,
  )

  return (
    <main className="assistant-main" aria-label="AI Assistant">
      <div className="assistant-grid" data-history-open={historyOpen}>
        <aside className="assistant-history" aria-label="AI History">
          <header className="assistant-toolbar">
            <h2 hidden={!historyOpen}>AI History</h2>
            <div className="assistant-history-actions">
              <button type="button" onClick={() => selectThread(null)}>+ New chat</button>
              <button type="button" aria-expanded={historyOpen} aria-controls="assistant-history-list"
                onClick={() => setHistoryOpen((open) => !open)}>
                {historyOpen ? 'Hide history' : 'Show history'}
              </button>
            </div>
          </header>
          <div id="assistant-history-list" className="assistant-history-list" hidden={!historyOpen}>
            {threads.length === 0 && <p className="assistant-empty">No conversations yet.</p>}
            {threads.map((thread) => (
              <button key={thread.id} type="button" aria-pressed={thread.id === active?.id}
                onClick={() => selectThread(thread.id)}>
                <strong>{thread.title}</strong>
                <small>{dateFormat.format(new Date(thread.updatedAt))} · {thread.messages.length} messages</small>
              </button>
            ))}
          </div>
        </aside>
        <AssistantChat showPrompts />
      </div>
    </main>
  )
}
