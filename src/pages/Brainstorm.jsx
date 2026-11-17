import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { getStudentName, displayStudentName } from '../components/studentIdentity'

const noteWidth = 204
const noteDateFormat = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' })

const colors = {
  yellow: '#fef3a6',
  blue: '#bfdbfe',
  green: '#bbf7d0',
  pink: '#fecaca',
  purple: '#e9d5ff',
  orange: '#fed7aa',
}

function readBoard(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(saved) || saved.some((note) => !note || typeof note.id !== 'string'
      || typeof note.text !== 'string' || !Number.isFinite(note.left) || !Number.isFinite(note.top)
      || !Number.isFinite(note.height) || !Number.isFinite(note.textWidth)
      || !Number.isFinite(note.angle) || !Object.hasOwn(colors, note.color))) {
      throw new Error('Invalid saved board')
    }
    return { notes: saved, error: '' }
  } catch {
    // Do not overwrite data that could not be restored.
    return { notes: [], error: 'Saved board could not be loaded. Existing saved data has been preserved.' }
  }
}

function BrainstormBoard({ studentId }) {
  const storageKey = `collabeng.brainstorm:${encodeURIComponent(studentId)}`
  const [restored] = useState(() => readBoard(storageKey))
  const [notes, setNotes] = useState(restored.notes)
  const [storageError, setStorageError] = useState(restored.error)

  useEffect(() => {
    if (restored.error) return
    let active = true
    let message = ''
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes))
    } catch {
      message = 'Board could not be saved in this browser. Keep this page open and try again later.'
    }
    // Report the storage result after synchronization, without an extra synchronous render.
    queueMicrotask(() => { if (active) setStorageError(message) })
    return () => { active = false }
  }, [notes, storageKey, restored.error])
  const [tool, setTool] = useState('move')
  const [color, setColor] = useState('yellow')
  const [draft, setDraft] = useState(null)
  const board = useRef(null)
  const editor = useRef(null)
  const drag = useRef(null)

  const noteCount = notes.length

  const editing = draft !== null

  useEffect(() => {
    if (editing) editor.current?.focus()
  }, [editing])

  function startNote(x, y) {
    const maxLeft = board.current.clientWidth - noteWidth - 4
    setDraft({
      id: null,
      text: '',
      color,
      left: Math.max(4, Math.min(maxLeft, x)),
      top: Math.max(4, y),
    })
  }

  function saveNote() {
    const text = draft.text.trim()
    setDraft(null)
    if (!text) return

    if (draft.id !== null) {
      setNotes((previous) => previous.map((note) =>
        note.id === draft.id ? { ...note, text } : note,
      ))
    } else {
      const id = crypto.randomUUID()
      const author = getStudentName(studentId)
      const createdAt = new Date().toISOString()
      setNotes((previous) => [...previous, {
        ...draft,
        id,
        text,
        author,
        authorId: studentId,
        createdAt,
        angle: 0,
        textWidth: 176,
        height: 166,
      }])
    }
  }

  function startDrag(event, note) {
    if (tool !== 'move' || event.button !== 0) return

    const card = event.currentTarget
    drag.current = {
      id: note.id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: card.offsetLeft,
      top: card.offsetTop,
      moved: false,
    }
    card.setPointerCapture(event.pointerId)
  }

  function moveNote(event) {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return

    const dx = event.clientX - active.x
    const dy = event.clientY - active.y
    if (!active.moved && Math.hypot(dx, dy) < 5) return
    active.moved = true

    const maxLeft = board.current.clientWidth - event.currentTarget.offsetWidth - 4
    const left = Math.max(4, Math.min(maxLeft, active.left + dx))
    const top = Math.max(4, active.top + dy)

    setNotes((previous) => previous.map((note) =>
      note.id === active.id ? { ...note, left, top } : note,
    ))
  }

  function activateNote(event, note) {
    const wasDragged = event.detail > 0 && drag.current?.id === note.id && drag.current.moved
    drag.current = null
    if (!wasDragged) setDraft({ ...note })
  }

  const boardHeight = Math.max(830, ...notes.map((note) => note.top + note.height + 32), (draft?.top ?? 0) + 198)

  return (
    <div className="collab-dashboard brainstorm-page">
      <AppHeader showProjectNavigation />

      <main className="brainstorm-main">
        {storageError && <p role="alert">{storageError}</p>}
        <div className="brainstorm-toolbar">
          
          <div className="brainstorm-tools" role="group" aria-label="Board tools">
            <button type="button" aria-pressed={tool === 'move'} onClick={() => setTool('move')}>
              ✦ Move
            </button>
            <button type="button" aria-pressed={tool === 'note'} onClick={() => setTool('note')}>
              ▤ Sticky Note
            </button>
          </div>

          <div className="brainstorm-colors" role="group" aria-label="New note color">
            {Object.entries(colors).map(([name, value]) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={color === name}
                style={{ '--note-color': value }}
                onClick={() => setColor(name)}
              />
            ))}
          </div>

          <div className="brainstorm-actions">
            <span aria-live="polite">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
          </div>
        </div>

        <div className="brainstorm-viewport">
          <div
            className="brainstorm-board"
            data-tool={tool}
            ref={board}
            tabIndex={tool === 'note' ? 0 : undefined}
            aria-label={tool === 'note' ? 'Brainstorm board. Press Enter to add a note.' : undefined}
            onKeyDown={(event) => {
              if (tool !== 'note' || event.target !== event.currentTarget || event.key !== 'Enter') return
              event.preventDefault()
              startNote(28, 48)
            }}
            style={{ '--board-height': `${boardHeight}px` }}
            onClick={(event) => {
              if (tool !== 'note' || event.target !== event.currentTarget) return

              const bounds = event.currentTarget.getBoundingClientRect()
              startNote(event.clientX - bounds.left, event.clientY - bounds.top)
            }}
          >
            {noteCount === 0 && !editing && (
              <p className="brainstorm-empty">
                Select Sticky Note, then click anywhere on the board.
              </p>
            )}
            {notes.filter((note) => note.id !== draft?.id).map((note) => (
              <button
                key={note.id}
                type="button"
                className="brainstorm-note"
                style={{
                  '--note-color': colors[note.color],
                  '--note-left': `${note.left}px`,
                  '--note-top': `${note.top}px`,
                  '--note-height': `${note.height}px`,
                  '--note-angle': `${note.angle}deg`,
                  '--note-text-width': `${note.textWidth}px`,
                }}
                onPointerDown={(event) => startDrag(event, note)}
                onPointerMove={moveNote}
                onPointerCancel={() => { drag.current = null }}
                onClick={(event) => activateNote(event, note)}
              >
                <span className="brainstorm-note-text">{note.text}</span>
                {(note.author || note.createdAt) && (
                  <span className="brainstorm-note-author">
                    {displayStudentName(note.author, note.authorId)}
                    {note.author && note.createdAt && ' · '}
                    {note.createdAt && (
                      <time dateTime={note.createdAt}>
                        {noteDateFormat.format(new Date(note.createdAt))}
                      </time>
                    )}
                  </span>
                )}
              </button>
            ))}
            {draft && (
              <div
                className="brainstorm-note brainstorm-note-draft"
                style={{
                  '--note-color': colors[draft.color],
                  '--note-left': `${draft.left}px`,
                  '--note-top': `${draft.top}px`,
                  '--note-height': `${draft.height ?? 166}px`,
                  '--note-angle': `${draft.angle ?? 0}deg`,
                }}
              >
                <textarea
                  ref={editor}
                  aria-label="Note"
                  aria-describedby="brainstorm-draft-help"
                  placeholder="Write a note…"
                  value={draft.text}
                  onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                  onBlur={saveNote}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setDraft(null)
                    } else if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      saveNote()
                    }
                  }}
                />
                <span id="brainstorm-draft-help">Enter to save · Esc to cancel</span>
              </div>
            )}
          </div>
        </div>

        {noteCount > 0 && (
          <p className="brainstorm-hint">Drag notes to rearrange · Click a note to edit</p>
        )}
      </main>
    </div>
  )
}

function Brainstorm() {
  const studentId = sessionStorage.getItem('currentStudentId')?.trim().toLowerCase() ?? 'guest'
  return <BrainstormBoard key={studentId} studentId={studentId} />
}

export default Brainstorm
