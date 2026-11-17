import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { getStudentName, displayStudentName } from '../components/studentIdentity'
import { useWorkspace } from '../components/WorkspaceData'
import uploadIcon from '../assets/notebook/upload-cloud.svg'
import searchIcon from '../assets/notebook/Search.svg'
import plusIcon from '../assets/notebook/Plus.svg'
import globeIcon from '../assets/notebook/Globe.svg'
import lockIcon from '../assets/notebook/Lock.svg'
import relatedIcon from '../assets/notebook/Ellipse.svg'
import timelineIcon from '../assets/notebook/TimelineMarker.svg'

const scopes = [{ name: 'Shared', icon: globeIcon }, { name: 'Personal', icon: lockIcon }]
const dateFormat = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' })
const dateLabel = (value) => dateFormat.format(new Date(value))

function downloadAttachment(file, name = file.name) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const noteSections = [
  { id: 'decision', title: 'Decision Made', hint: 'What did you choose, and why?' },
  { id: 'assumptions', title: 'Assumptions & Constraints', hint: 'List assumptions and design limits.' },
  { id: 'calculations', title: 'Calculations', hint: 'Include the formula, inputs, units and result.' },
  { id: 'observations', title: 'Test & Observations', hint: 'Describe test conditions, expected results and what you measured.' },
  { id: 'questions', title: 'Open Questions', hint: 'What still needs to be answered?' },
  { id: 'related-task', title: 'Related Task', reference: 'task' },
  { id: 'related-channel', title: 'Related Channel', reference: 'channel' },
  { id: 'next', title: 'Next Steps', hint: 'What should the team do next?' },
]

function readRecords(key) {
  try {
    const records = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

function EntryBody({ entry }) {
  const { files } = useWorkspace()
  return (
    <div className="nb-body">
      <p>{entry.summary}</p>
      {entry.sections?.map(({ id, text }) => (
        <section key={id}>
          <h3>{noteSections.find((option) => option.id === id)?.title ?? id}</h3>
          <p>{text}</p>
        </section>
      ))}
      {entry.attachments?.length > 0 && (
        <section>
          <h3>Attachments</h3>
          <ul>
            {entry.attachments.map((attachment, index) => {
              const record = attachment.fileId ? files.find(({ id }) => id === attachment.fileId) : null
              const file = attachment.fileId ? record?.file : attachment
              const name = record?.name ?? attachment.name
              return (
                <li key={attachment.fileId ?? index}>
                  <button className="nb-text-button" type="button" disabled={!file}
                    onClick={() => downloadAttachment(file, name)}>
                    {name}{!file && ' (file unavailable)'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {(entry.evidence || entry.sources) && (
        <section>
          <h3>Basis / Evidence</h3>
          {entry.evidence && <p>{entry.evidence}</p>}
          {entry.sources && <small>Sources · {entry.sources}</small>}
        </section>
      )}
      {entry.impact.length > 0 && (
        <section>
          <h3>Impact</h3>
          <ul>{entry.impact.map((line, index) => <li key={index}>{line}</li>)}</ul>
        </section>
      )}
      {entry.status && <section><h3>Status</h3><p>{entry.status}</p></section>}
      {entry.related.length > 0 && (
        <section>
          <h3>Related Work</h3>
          <ul className="nb-related">
            {entry.related.map((line, index) => (
              <li key={index}><span><img src={relatedIcon} alt="" /></span>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default function Notebook() {
  const [references] = useState(() => ({
    task: readRecords('collabeng.projectTasks')
      .filter((task) => task?.id && typeof task.title === 'string')
      .map(({ id, title }) => ({ id: String(id), label: title })),
    channel: readRecords('collabeng.channels')
      .filter((channel) => typeof channel === 'string' && channel)
      .map((channel) => ({ id: channel, label: `# ${channel}` })),
  }))
  const [sections, setSections] = useState([])
  const availableSections = noteSections.filter(({ id }) => !sections.some((section) => section.id === id))
  const { entries, setEntries, files, registerFiles, recordActivity, removeActivity } = useWorkspace()
  const [notesOpen, setNotesOpen] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(max-width: 640px)').matches,
  )
  const [scope, setScope] = useState('Shared')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState('')
  const [visibility, setVisibility] = useState('Shared')
  const [attachments, setAttachments] = useState([])
  const [attachmentError, setAttachmentError] = useState('')
  const titleInput = useRef(null)

  useEffect(() => {
    if (editorOpen) titleInput.current?.focus()
  }, [editorOpen])

  const search = query.trim().toLowerCase()
  const visible = entries.filter((entry) => {
    if (!search) return entry.scope === scope

    const searchableText = [
      entry.title,
      entry.summary,
      entry.author,
      entry.category,
      entry.evidence,
      entry.sources,
      entry.status,
      ...(entry.impact ?? []),
      ...(entry.related ?? []),
      ...(entry.sections ?? []).map(({ id, text }) =>
        `${noteSections.find((section) => section.id === id)?.title ?? ''} ${text}`,
      ),
      ...(entry.attachments ?? []).map((attachment) => files.find(({ id }) => id === attachment.fileId)?.name ?? attachment.name),
    ]

    return searchableText.some((value) => value?.toLowerCase().includes(search))
  })
  const selected = visible.find(({ id }) => id === selectedId) ?? visible[0]

  function openEditor(entry = null) {
    setEditing(entry)
    setSections(entry?.sections ?? [])
    setError('')
    setVisibility(entry?.scope ?? scope)
    setAttachments(entry?.attachments ?? [])
    setAttachmentError('')
    setEditorOpen(true)
  }

  function addAttachments(files) {
    const selectedFiles = Array.from(files)
    if (selectedFiles.length === 0) return
    const accepted = selectedFiles.filter((file) =>
      file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name),
    )
    setAttachmentError(accepted.length < selectedFiles.length ? 'Only PDFs and images can be attached.' : '')
    setAttachments((previous) => [...previous, ...accepted])
  }

  function saveEntry(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const text = (name) => values[name].trim()

    if (!text('title') || !text('summary')) {
      setError('Enter a title and notes.')
      return
    }

    const author = getStudentName()
    const now = new Date().toISOString()
    const entryId = editing?.id ?? crypto.randomUUID()
    const entry = {
      id: entryId,
      scope: visibility,
      category: editing?.category ?? 'Note',
      attachments: registerFiles(attachments, { kind: 'notebook', id: entryId }),
      title: text('title'),
      summary: text('summary'),
      sections: sections.map((section) => ({ ...section, text: section.text.trim() }))
        .filter((section) => section.text),
      evidence: editing?.evidence ?? '',
      sources: editing?.sources ?? '',
      impact: editing?.impact ?? [],
      status: editing?.status ?? '',
      related: editing?.related ?? [],
      author: editing ? displayStudentName(editing.author, editing.authorId) : author,
      authorId: editing ? editing.authorId : sessionStorage.getItem('currentStudentId'),
      createdAt: editing?.createdAt ?? now,
      editedBy: editing ? author : null,
      editedById: editing ? sessionStorage.getItem('currentStudentId') : null,
      updatedAt: now,
      version: (editing?.version ?? 0) + 1,
      history: [],
    }
    if (editing) {
      const { history, ...snapshot } = editing
      entry.history = [snapshot, ...history]
    }

    setEntries((previous) => editing
      ? previous.map((item) => item.id === entry.id ? entry : item)
      : [entry, ...previous])
    if (entry.scope === 'Shared') {
      let kind = 'note-created'
      if (editing) kind = editing.scope === 'Personal' ? 'note-published' : 'note-updated'
      recordActivity({
        id: crypto.randomUUID(),
        kind,
        targetId: entry.id,
        title: entry.title,
        occurredAt: now,
      })
    } else if (editing?.scope === 'Shared') {
      removeActivity('note', entry.id)
    }
    setScope(entry.scope)
    setSelectedId(entry.id)
    setShowHistory(false)
    setQuery('')
    setEditorOpen(false)
  }

  function publishNote(note) {
    if (note.scope !== 'Personal') return
    registerFiles(note.attachments ?? [], { kind: 'notebook', id: note.id })

    setEntries((previous) => previous.map((entry) =>
      entry.id === note.id && entry.scope === 'Personal'
        ? { ...entry, scope: 'Shared' }
        : entry,
    ))
    recordActivity({
      id: crypto.randomUUID(),
      kind: 'note-published',
      targetId: note.id,
      title: note.title,
      occurredAt: new Date().toISOString(),
    })
    setScope('Shared')
    setSelectedId(note.id)
    setShowHistory(false)
    setQuery('')
  }

  return (
    <div className="collab-dashboard notebook-page">
      <AppHeader showProjectNavigation />
      <main className="nb-main" aria-label="Notebook">
        <div className="nb-toolbar">
          <div className="nb-scopes" role="group" aria-label="Entry visibility">
            {scopes.map(({ name, icon }) => (
              <button key={name} type="button" aria-pressed={scope === name} disabled={editorOpen} onClick={() => {
                setScope(name)
                setSelectedId(null)
                setShowHistory(false)
              }}>
                <img src={icon} alt="" />{name}
              </button>
            ))}
          </div>
          <div className="nb-controls">
            <label className="nb-search">
              <img src={searchIcon} alt="" />
              <input type="search" aria-label="Search entries" placeholder="Search entries…"
                value={query} disabled={editorOpen} onChange={(event) => {
                  setQuery(event.target.value)
                  setShowHistory(false)
                }} />
            </label>
            <button className="nb-primary" type="button" disabled={editorOpen} onClick={() => openEditor()}>
              <img src={plusIcon} alt="" /> New Note
            </button>
          </div>
        </div>

        <div className="nb-grid" data-notes-open={notesOpen}>
          <aside className="nb-list" aria-label="Notes">
            <div className="nb-list-heading">
              <h2 hidden={!notesOpen}>Notes</h2>
              <button className="nb-secondary nb-notes-toggle" type="button"
                aria-expanded={notesOpen} aria-controls="nb-notes-panel"
                onClick={() => setNotesOpen((open) => !open)}>
                {notesOpen ? 'Hide note list' : 'Show note list'}
              </button>
            </div>
            <div id="nb-notes-panel" hidden={!notesOpen}>
              {visible.length === 0 && <p className="nb-muted">{search ? 'No matching notes.' : 'No notes yet.'}</p>}
              {visible.map((entry) => (
                <button key={entry.id} type="button" aria-pressed={!editorOpen && selected?.id === entry.id} disabled={editorOpen} onClick={() => {
                  setSelectedId(entry.id)
                  setShowHistory(false)
                }}>
                  <time dateTime={entry.createdAt}>{dateLabel(entry.createdAt)}</time>
                  <strong>{entry.title}</strong>
                  <span>{displayStudentName(entry.author, entry.authorId)}{search && ` · ${entry.scope}`}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="nb-detail" aria-label={editorOpen ? 'Notebook editor' : 'Entry details'}>
            {editorOpen ? (
              <form className="nb-inline-editor" onSubmit={saveEntry}>
                <h2 id="nb-editor-title">{editing ? 'Edit Note' : 'New Note'}</h2>
                <label>Title
                  <input ref={titleInput} name="title" defaultValue={editing?.title ?? ''} required placeholder="" />
                </label>
                <label>Notes
                  <textarea name="summary" defaultValue={editing?.summary ?? ''} required placeholder="" />
                </label>

                <div className="nb-note-sections">
                  {sections.map(({ id, text, recordId }) => {
                    const option = noteSections.find((item) => item.id === id)
                    if (!option) return null

                    const records = references[option.reference]
                    const selectedRecord = recordId ?? ''
                    const missingRecord = selectedRecord && !records?.some((record) => record.id === selectedRecord)

                    return (
                      <section className="nb-note-section" key={id}>
                        <div>
                          <label htmlFor={`nb-section-${id}`}>{option.title}</label>
                          <button className="nb-text-button" type="button" aria-label={`Remove ${option.title}`}
                            onClick={() => setSections((previous) => previous.filter((item) => item.id !== id))}>
                            Remove
                          </button>
                        </div>
                        {records ? (
                          <select className="nb-reference-select" id={`nb-section-${id}`} value={selectedRecord}
                            onChange={(event) => {
                              const value = event.target.value
                              const record = records.find((item) => item.id === value)
                              setSections((previous) => previous.map((item) =>
                                item.id === id ? { ...item, recordId: value, text: record?.label ?? '' } : item,
                              ))
                            }}>
                            <option value="">{records.length ? `Select a ${option.reference}` : `No ${option.reference}s available`}</option>
                            {missingRecord && <option value={selectedRecord}>{text}</option>}
                            {records.map((record) => <option key={record.id} value={record.id}>{record.label}</option>)}
                          </select>
                        ) : (
                          <textarea id={`nb-section-${id}`} rows={3} placeholder={option.hint} value={text}
                            onChange={(event) => {
                              const value = event.target.value
                              setSections((previous) => previous.map((item) =>
                                item.id === id ? { ...item, text: value } : item,
                              ))
                            }} />
                        )}
                      </section>
                    )
                  })}
                  <select className="nb-add-section" aria-label="Add section" value=""
                    disabled={availableSections.length === 0}
                    onChange={(event) => {
                      const id = event.target.value
                      setSections((previous) => [...previous, { id, text: '' }])
                    }}>
                    <option value="" disabled>+ Add section</option>
                    {availableSections.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
                  </select>
                </div>

                <div className="nb-attachments">
                  <label className="nb-drop-label" htmlFor="nb-attachment-input">Attachments</label>
                  <label className="nb-drop"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      addAttachments(event.dataTransfer.files)
                    }}>
                    <img src={uploadIcon} alt="" />
                    <span><strong>Drop PDFs or images here</strong><small>or click to browse from your computer</small></span>
                    <input id="nb-attachment-input" type="file" multiple accept="application/pdf,.pdf,image/*"
                      onChange={(event) => {
                        addAttachments(event.currentTarget.files)
                        event.currentTarget.value = ''
                      }} />
                  </label>
                  {attachmentError && <p role="alert">{attachmentError}</p>}
                  {attachments.length > 0 && (
                    <ul>
                      {attachments.map((file, index) => (
                        <li key={index}>
                          <span>{files.find(({ id }) => id === file.fileId)?.name ?? file.name}</span>
                          <button className="nb-text-button" type="button" aria-label={`Remove ${file.name}`}
                            onClick={() => setAttachments((previous) => previous.filter((_, item) => item !== index))}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <fieldset className="nb-visibility">
                  <legend>Visibility</legend>
                  <div>
                    {scopes.map(({ name }) => (
                      <label key={name}>
                        <input type="radio" name="visibility" value={name} checked={visibility === name}
                          onChange={() => setVisibility(name)} />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {error && <p role="alert">{error}</p>}
                <div className="nb-editor-actions">
                  <button className="nb-secondary" type="button" onClick={() => setEditorOpen(false)}>Cancel</button>
                  <button className="nb-primary" type="submit">Save</button>
                </div>
              </form>
            ) : selected ? (
              <>
                <header className="nb-entry-heading">
                  <div className="nb-entry-meta">
                    <span><strong>{selected.category}</strong> · {dateLabel(selected.createdAt)}</span>
                    <span>V{selected.version} · <strong>{selected.scope}</strong></span>
                  </div>
                  <div className="nb-entry-title">
                    <h2>{selected.title}</h2>
                    <button className="nb-secondary" type="button" onClick={() => openEditor(selected)}>Edit</button>
                  </div>
                  <p>Created by <strong>{displayStudentName(selected.author, selected.authorId)}</strong> · {dateLabel(selected.createdAt)}
                    {selected.editedBy && <> · Edited by <strong>{displayStudentName(selected.editedBy, selected.editedById)}</strong> · {dateLabel(selected.updatedAt)}</>}
                  </p>
                  {selected.history.length > 0 && (
                    <button className="nb-text-button" type="button" aria-expanded={showHistory}
                      onClick={() => setShowHistory(!showHistory)}>
                      {showHistory ? 'Hide previous versions' : 'View previous versions'}
                    </button>
                  )}
                  {selected.scope === 'Personal' && (
                    <div className="nb-publish-action">
                      <button className="nb-primary" type="button" onClick={() => publishNote(selected)}>
                        Publish to Shared Notebook
                      </button>
                    </div>
                  )}
                </header>
                <EntryBody entry={selected} />
                {showHistory && (
                  <section className="nb-history" aria-label="Previous versions">
                    {selected.history.map((version) => (
                      <details key={version.version}>
                        <summary><img src={timelineIcon} alt="" /> V{version.version} · {dateLabel(version.updatedAt)} · {version.title}</summary>
                        <EntryBody entry={version} />
                      </details>
                    ))}
                  </section>
                )}
              </>
            ) : <p className="nb-muted">Create or select a note to view its details.</p>}
          </section>
        </div>
      </main>

    </div>
  )
}
