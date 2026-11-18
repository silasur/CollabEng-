import { useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { displayStudentName } from '../components/studentIdentity'
import { useWorkspace } from '../components/WorkspaceData'

const taskStorageKey = 'collabeng.projectTasks'

function readProjectTasks() {
  try {
    const tasks = JSON.parse(sessionStorage.getItem(taskStorageKey) ?? '[]')
    return Array.isArray(tasks) ? tasks : []
  } catch {
    return []
  }
}


const dateFormat = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' })

function FileBadge({ entry }) {
  return <span className="fl-badge" data-type={entry.type} aria-hidden="true">{entry.extension}</span>
}

function download({ file, name }) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function FileLinkSelect({ records, value, onChange }) {
  const unavailable = Boolean(value && !records.some((record) => record.value === value))

  return (
    <label className="fl-task-link">
      Linked to
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">No link</option>
        {unavailable && <option value={value} disabled>Link unavailable</option>}
        {['Task', 'Notebook'].map((type) => (
          <optgroup key={type} label={type}>
            {records.filter((record) => record.type === type).map((record) => (
              <option key={record.value} value={record.value}>{record.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {records.length === 0 && <small>No tasks or shared notebook notes available.</small>}
    </label>
  )
}

function fileLinkValue(entry) {
  if (entry.notebookId) return `notebook:${entry.notebookId}`
  return entry.taskId ? `task:${entry.taskId}` : ''
}

export default function Files() {
  const { sharedFiles: files, entries, messages, setFiles, registerFiles, removeActivity } = useWorkspace()
  const [pending, setPending] = useState([])
  const tasks = readProjectTasks()
  const links = [
    ...tasks.filter((task) => task?.id && typeof task.title === 'string').map(({ id, title }) => ({
      value: `task:${id}`, type: 'Task', label: `Task · ${title}`, taskId: id, notebookId: '',
    })),
    ...entries.filter((entry) => entry.scope === 'Shared').map(({ id, title }) => ({
      value: `notebook:${id}`, type: 'Notebook', label: `Notebook · ${title}`, taskId: '', notebookId: id,
    })),
  ]
  const [pendingLink, setPendingLink] = useState('')
  const [editedLink, setEditedLink] = useState('')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [action, setAction] = useState(null)
  const [name, setName] = useState('')
  const [linkError, setLinkError] = useState('')
  const menu = useRef(null)
  const dialog = useRef(null)
  const active = files.find(({ id }) => id === activeId)
  const deliverables = files.filter(({ deliverable }) => deliverable)
  const visible = files.filter(({ name }) => name.toLowerCase().includes(query.trim().toLowerCase()))

  function upload() {
    if (pending.length === 0) return
    const selectedLink = links.find(({ value }) => value === pendingLink)
    if (pendingLink && !selectedLink) {
      setLinkError('This link is unavailable. Choose another task or note.')
      return
    }
    setLinkError('')

    registerFiles(pending, null, {
      taskId: selectedLink?.taskId ?? '', notebookId: selectedLink?.notebookId ?? '',
      libraryUpload: true,
    })
    setPending([])
    setPendingLink('')
    setQuery('')
  }

  function showActions(event, id) {
    const panel = menu.current
    if (panel.matches(':popover-open') && activeId === id) {
      panel.hidePopover()
      return
    }
    setActiveId(id)
    const bounds = event.currentTarget.getBoundingClientRect()
    panel.style.left = `${Math.max(8, bounds.right - 216)}px`
    panel.style.top = `${Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 240))}px`
    if (!panel.matches(':popover-open')) panel.showPopover()
  }

  function removeDeliverable(id) {
    // Remove the deliverable flag; keep the file and its notebook/message references.
    setFiles((previous) => previous.map((entry) =>
      entry.id === id ? { ...entry, deliverable: false } : entry,
    ))
  }

  function toggleDeliverable() {
    setFiles((previous) => previous.map((entry) =>
      entry.id === activeId ? { ...entry, deliverable: !entry.deliverable } : entry,
    ))
    menu.current.hidePopover()
  }

  function openDialog(kind) {
    menu.current.hidePopover()
    setAction(kind)
    setName(active.name)
    setEditedLink(fileLinkValue(active))
    setLinkError('')
    dialog.current.showModal()
  }

  function applyAction(event) {
    event.preventDefault()
    const nextName = name.trim()
    if (action === 'rename' && !nextName) return

    if (action === 'delete') {
      setFiles((previous) => previous.filter(({ id }) => id !== activeId))
      removeActivity('file', activeId)
    } else {
      const selectedLink = links.find(({ value }) => value === editedLink)
      if (action === 'link' && editedLink && !selectedLink && editedLink !== fileLinkValue(active)) {
        setLinkError('This link is unavailable. Choose another task or note.')
        return
      }
      let changes = { name: nextName }
      if (action === 'link') {
        changes = editedLink && !selectedLink
          ? { taskId: active.taskId ?? '', notebookId: active.notebookId ?? '' }
          : { taskId: selectedLink?.taskId ?? '', notebookId: selectedLink?.notebookId ?? '' }
      }
      setFiles((previous) => previous.map((entry) =>
        entry.id === activeId ? { ...entry, ...changes } : entry,
      ))
    }
    dialog.current.close()
  }

  const linkLabels = new Map(links.map(({ value, label }) => [value, label]))
  function sourceLabels(file) {
    const labels = []
    const manual = linkLabels.get(fileLinkValue(file))
    if (manual) labels.push(manual)
    for (const source of file.sources ?? []) {
      if (source.kind === 'notebook') {
        const note = entries.find(({ id }) => id === source.id)
        if (note?.scope === 'Shared') labels.push(`Notebook · ${note.title}`)
      } else {
        const message = messages.find(({ id }) => id === source.id)
        if (message) labels.push(`Messages · # ${message.channel}`)
      }
    }
    return [...new Set(labels)].join(' / ') || (fileLinkValue(file) ? 'Link unavailable' : '—')
  }

  const actionTitles = { delete: 'Delete file', rename: 'Rename file', link: 'Edit link' }

  return (
    <div className="collab-dashboard files-page">
      <AppHeader showProjectNavigation />
      <main className="fl-main" onScroll={() => {
        if (menu.current.matches(':popover-open')) menu.current.hidePopover()
      }}>
        <div className="fl-content">
          <div className="fl-header">
            <h1>Files</h1>
            <input type="search" aria-label="Search files" placeholder="Search files" value={query}
              onChange={(event) => setQuery(event.target.value)} />
          </div>

          <section className="fl-deliverables" aria-labelledby="fl-deliverables-title">
            <h2 id="fl-deliverables-title">Deliverables</h2>
            {deliverables.length === 0 ? <p>No deliverables yet.</p> : (
              <ul>
                {deliverables.map((entry) => (
                  <li key={entry.id} className="fl-deliverable-item">
                    <button className="fl-deliverable-download" type="button"
                      onClick={() => download(entry)} aria-label={`Download ${entry.name}`}>
                      <FileBadge entry={entry} />{entry.name}
                    </button>
                    <button className="fl-deliverable-remove" type="button"
                      aria-label={`Remove ${entry.name} from Deliverables`}
                      title="Remove from Deliverables"
                      onClick={() => removeDeliverable(entry.id)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="fl-table-wrap" role="region" aria-label="Project files" tabIndex={0}>
            <table className="fl-table">
              <thead>
                <tr>
                  <th scope="col">Name</th><th scope="col">Type</th><th scope="col">Uploaded by</th>
                  <th scope="col">Date</th><th scope="col">Linked to</th><th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row"><span className="fl-file-name"><FileBadge entry={entry} />{entry.name}</span></th>
                    <td>{entry.type}</td><td>{displayStudentName(entry.uploader, entry.uploaderId)}</td>
                    <td><time dateTime={entry.addedAt}>{dateFormat.format(new Date(entry.addedAt))}</time></td>
                    <td>{sourceLabels(entry)}</td>
                    <td><button type="button" className="fl-more" aria-controls="fl-actions"
                      aria-label={`Actions for ${entry.name}`}
                      onClick={(event) => showActions(event, entry.id)}>⋯</button></td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={6}>{files.length ? 'No files match your search.' : 'No files yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <section className="fl-upload" aria-label="Upload files">
            <label className="fl-drop" data-dragging={dragging}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                const dropped = Array.from(event.dataTransfer.files)
                if (dropped.length) setPending(dropped)
              }}>
              <span aria-hidden="true" className="fl-upload-icon">↑</span>
              <span><strong>Drop files here</strong><small>or click to browse from your computer</small></span>
              <input type="file" multiple aria-label="Choose files" onChange={(event) => {
                const selected = Array.from(event.currentTarget.files)
                if (selected.length) setPending(selected)
                event.currentTarget.value = ''
              }} />
            </label>
            {pending.length > 0 && (
              <div className="fl-upload-details">
                <div className="fl-pending">
                  <strong>{pending.length === 1 ? 'Selected file' : 'Selected files'}</strong>
                  <p role="status">{pending.map((file) => file.name).join(', ')}</p>
                </div>
                <FileLinkSelect records={links} value={pendingLink} onChange={setPendingLink} />
                {linkError && <p role="alert">{linkError}</p>}
                <button className="fl-primary" type="button" onClick={upload}>
                  Upload {pending.length > 1 ? 'files' : 'file'}
                </button>
              </div>
            )}
            <small> </small>
          </section>
        </div>
      </main>

      <div className="fl-actions" id="fl-actions" popover="auto" ref={menu} aria-label="File actions">
        {active && (
          <>
            <button type="button" onClick={toggleDeliverable}>
              {active.deliverable ? 'Remove from Deliverables' : 'Add to Deliverables'}
            </button>
            <button type="button" onClick={() => { download(active); menu.current.hidePopover() }}>Download</button>
            <button type="button" onClick={() => openDialog('link')}>Edit link</button>
            <button type="button" onClick={() => openDialog('rename')}>Rename</button>
            <button type="button" className="fl-danger" onClick={() => openDialog('delete')}>Delete</button>
          </>
        )}
      </div>

      <dialog className="fl-dialog" ref={dialog} aria-labelledby="fl-dialog-title">
        <form onSubmit={applyAction}>
          <h2 id="fl-dialog-title">{actionTitles[action]}</h2>
          {action === 'delete' && <p>Delete {active?.name}?</p>}
          {action === 'rename' && (
            <label>File name<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          )}
          {action === 'link' && (
            <FileLinkSelect records={links} value={editedLink} onChange={setEditedLink} />
          )}
          {action === 'link' && linkError && <p role="alert">{linkError}</p>}
          <div>
            <button type="button" onClick={() => dialog.current.close()}>Cancel</button>
            <button type="submit" className={action === 'delete' ? 'fl-danger' : 'fl-primary'}>
              {action === 'delete' ? 'Delete' : 'Save'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
