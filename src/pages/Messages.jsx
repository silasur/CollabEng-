import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { getStudentName, displayStudentName } from '../components/studentIdentity'
import { useWorkspace } from '../components/WorkspaceData'
import channelIcon from '../assets/messages/channel.svg'
import activeChannelIcon from '../assets/messages/channel-active.svg'

const clock = new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit' })

const referenceTypes = [
  { id: 'task', label: 'Task', heading: 'Linked tasks' },
  { id: 'notebook', label: 'Notebook', heading: 'Referenced notebook' },
  { id: 'file', label: 'File', heading: 'Shared files' },
]

function readTaskReferences() {
  try {
    const tasks = JSON.parse(sessionStorage.getItem('collabeng.projectTasks') ?? '[]')
    return Array.isArray(tasks)
      ? tasks.map(({ id, title }) => ({ id, label: title }))
      : []
  } catch {
    return []
  }
}

function Reference({ reference }) {
  const { files } = useWorkspace()
  const record = reference.fileId ? files.find(({ id }) => id === reference.fileId) : null
  const file = reference.fileId ? record?.file : reference.file
  const label = record?.name ?? reference.label
  if (reference.fileId && !file) return <span>{label} (file unavailable)</span>
  if (file) {
    return (
      <button type="button" onClick={() => {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = label
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }}>{label}</button>
    )
  }
  return reference.href ? <a href={reference.href}>{reference.label}</a> : reference.label
}

const channelStorageKey = 'collabeng.channels'

function readChannels() {
  try {
    const channels = JSON.parse(sessionStorage.getItem(channelStorageKey) ?? '[]')
    return Array.isArray(channels) ? channels.filter((name) => typeof name === 'string') : []
  } catch {
    return []
  }
}

export default function Messages({ channelContexts = {}, notebooks = [], projectFiles = [] }) {
  const [channels, setChannels] = useState(readChannels)
  const [channel, setChannel] = useState(null)
  const [search, setSearch] = useState('')
  const { messages, setMessages, files, entries, registerFiles } = useWorkspace()
  const [messageDraft, setMessageDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [contextOpen, setContextOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [messageAttachment, setMessageAttachment] = useState(null)
  const [replyAttachment, setReplyAttachment] = useState(null)
  const draft = replyTo ? replyDraft : messageDraft
  const setDraft = replyTo ? setReplyDraft : setMessageDraft
  const attachment = replyTo ? replyAttachment : messageAttachment
  const setAttachment = replyTo ? setReplyAttachment : setMessageAttachment
  const [referenceType, setReferenceType] = useState('task')
  const [referenceId, setReferenceId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [tasks] = useState(readTaskReferences)
  const referenceDialog = useRef(null)
  const [channelError, setChannelError] = useState('')
  const history = useRef(null)
  const channelDialog = useRef(null)
  const replyComposer = useRef(null)
  const contextToggle = useRef(null)
  const context = channelContexts[channel]
  const visible = messages.filter((message) => message.channel === channel)

  const sharedFiles = files.filter((file) => file.libraryUpload || file.taskId || file.notebookId
    || (file.sources ?? []).some((source) => source.kind === 'message'
      || entries.some((note) => note.id === source.id && note.scope === 'Shared')))
  const options = {
    task: tasks,
    notebook: [...entries.filter((note) => note.scope === 'Shared').map((note) => ({ id: note.id, label: note.title })), ...notebooks],
    file: [...sharedFiles.map((file) => ({ id: file.id, fileId: file.id, label: file.name })), ...projectFiles],
  }[referenceType]
  const chosen = options.find(({ id }) => String(id) === referenceId)
  const channelReferences = new Map(visible.flatMap(({ attachment }) =>
    attachment ? [[attachment.type + ':' + attachment.id, attachment]] : [],
  ))

  function openReferencePicker() {
    setReferenceType('task')
    setReferenceId('')
    setSelectedFile(null)
    referenceDialog.current.showModal()
  }

  function attachReference(event) {
    event.preventDefault()
    if (referenceType === 'file' && selectedFile) {
      setAttachment({
        id: crypto.randomUUID(),
        type: 'file',
        label: selectedFile.name,
        file: selectedFile,
      })
    } else if (chosen) {
      setAttachment({ ...chosen, type: referenceType })
    }
    referenceDialog.current.close()
  }

  useEffect(() => {
    if (messages.at(-1)?.replyTo && messages.at(-1)?.channel === channel) return
    history.current.scrollTop = history.current.scrollHeight
  }, [channel, messages])

  useEffect(() => {
    if (replyTo) replyComposer.current?.focus()
  }, [replyTo])

  function closeContext() {
    setContextOpen(false)
    contextToggle.current?.focus()
  }

  function selectChannel(next) {
    if (next === channel) return
    setChannel(next)
    setMessageDraft('')
    setMessageAttachment(null)
    setReplyDraft('')
    setReplyAttachment(null)
    setReplyTo(null)
  }

  function createChannel(event) {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name').trim()
    if (!name || channels.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setChannelError('Enter a unique channel name.')
      return
    }
    const nextChannels = [...channels, name]
    try {
      sessionStorage.setItem(channelStorageKey, JSON.stringify(nextChannels))
    } catch {
      setChannelError('Unable to save the channel in this tab.')
      return
    }

    setChannels(nextChannels)
    setSearch('')
    selectChannel(name)
    channelDialog.current.close()
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!channel || (!text && !attachment)) return

    const author = getStudentName()
    const id = crypto.randomUUID()
    let sentAttachment = attachment
    if (attachment?.type === 'file') {
      const input = attachment.fileId ? attachment : attachment.file
      if (input) {
        const [reference] = registerFiles([input], { kind: 'message', id })
        sentAttachment = { id: reference.fileId, fileId: reference.fileId, type: 'file', label: reference.name ?? attachment.label }
      }
    }
    const message = { id, channel, author, authorId: sessionStorage.getItem('currentStudentId'), text, sentAt: new Date(), replyTo, attachment: sentAttachment }
    setMessages((previous) => [...previous, message])
    setDraft('')
    setAttachment(null)
    setReplyTo(null)
  }

  function toggleResolved(id) {
    setMessages((previous) => previous.map((message) =>
      message.id === id ? { ...message, resolved: !message.resolved } : message,
    ))
  }

  function renderMessage(message, isReply = false) {
    return (
      <article className="msg-item" key={message.id}>
        <span className="msg-avatar" aria-hidden="true">
          {displayStudentName(message.author, message.authorId).split(/\s+/).slice(0, 2).map((word) => word[0].toUpperCase()).join('')}
        </span>
        <div>
          <strong>{displayStudentName(message.author, message.authorId)}</strong>
          <time dateTime={message.sentAt.toISOString()}>{clock.format(message.sentAt)}</time>
          {message.text && <p>{message.text}</p>}
          {message.attachment && (
            <p className="msg-reference"><Reference reference={message.attachment} /></p>
          )}
          {!isReply && (
            <div className="msg-item-actions">
              <button type="button" onClick={() => {
                if (replyTo === message.id) return
                setReplyDraft('')
                setReplyAttachment(null)
                setReplyTo(message.id)
              }}>Reply</button>
              <button type="button" data-resolved={Boolean(message.resolved)}
                aria-label={message.resolved ? 'Reopen thread' : undefined}
                onClick={() => toggleResolved(message.id)}>
                {message.resolved ? 'Resolved' : 'Resolve thread'}
              </button>
            </div>
          )}
        </div>
      </article>
    )
  }

  function renderComposer(inThread = false) {
    return (
      <form className="msg-compose" onSubmit={sendMessage}>
        <label htmlFor="msg-text">{inThread ? 'Reply' : 'Message'}</label>
        <div>
          <button type="button" className="msg-add-reference"
            aria-label="Attach a reference" onClick={openReferencePicker}>+</button>
          <textarea id="msg-text" ref={inThread ? replyComposer : undefined} rows={1} value={draft}
            placeholder={inThread ? 'Write a reply…' : `Write a message to # ${channel}…`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
              event.preventDefault()
              if (!event.repeat) event.currentTarget.form.requestSubmit()
            }} />
        </div>
        {attachment && (
          <div className="msg-reply">
            <span>{attachment.label}</span>
            <button type="button" onClick={() => setAttachment(null)}>Remove attachment</button>
          </div>
        )}
        {inThread && (
          <div className="msg-reply">
            <button type="button" onClick={() => {
              setReplyDraft('')
              setReplyAttachment(null)
              setReplyTo(null)
            }}>Cancel reply</button>
          </div>
        )}
      </form>
    )
  }

  return (
    <div className="collab-dashboard messages-page">
      <AppHeader showProjectNavigation />

      <main className="msg-main" aria-label="Messages">
        <aside className="msg-channels" aria-labelledby="msg-channel-title">
          <h1 id="msg-channel-title">Channels</h1>
          <input type="search" aria-label="Search channels" placeholder="Search channels…"
            value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="msg-channel-list">
            {channels.length === 0 && <p className="msg-empty">No channels yet.</p>}
            {channels.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase())).map((name) => (
              <button type="button" key={name} aria-pressed={channel === name} onClick={() => selectChannel(name)}>
                <img src={channel === name ? activeChannelIcon : channelIcon} alt="" />
                <span># {name}</span>
              </button>
            ))}
          </div>
          <button className="msg-primary" type="button" onClick={() => {
            channelDialog.current.querySelector('form').reset()
            setChannelError('')
            channelDialog.current.showModal()
          }}>+ Create Channel</button>
        </aside>

        <section className="msg-chat" aria-labelledby="msg-chat-title">
          <header>
            <h2 id="msg-chat-title">{channel ? `# ${channel}` : 'Messages'}</h2>
            <button type="button" className="msg-context-toggle" ref={contextToggle}
              aria-controls="msg-discussion-context" aria-expanded={contextOpen}
              onClick={() => contextOpen ? closeContext() : setContextOpen(true)}>
              Context
            </button>
          </header>
          <div className="msg-history" ref={history} role="log" aria-label={`Messages in ${channel}`} tabIndex={0}>
            {context?.task && <p className="msg-linked">Thread linked to {context.task.label}</p>}
            {visible.length === 0 && <p className="msg-empty">{channel ? 'No messages yet.' : 'Create a channel to start a conversation.'}</p>}
            {visible.filter((message) => !message.replyTo).map((message) => {
              const replies = visible.filter((item) => item.replyTo === message.id)
              return (
                <div key={message.id}>
                  {renderMessage(message)}
                  {(replies.length > 0 || replyTo === message.id) && (
                    <div className="msg-thread" role="group" aria-label={`Replies to ${displayStudentName(message.author, message.authorId)}`}>
                      {replies.map((reply) => renderMessage(reply, true))}
                      {replyTo === message.id && renderComposer(true)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {channel && !replyTo && renderComposer()}
        </section>

        <aside className="msg-context" id="msg-discussion-context" data-open={contextOpen}
          aria-labelledby="msg-context-title" onKeyDown={(event) => {
            if (event.key === 'Escape' && contextOpen) closeContext()
          }}>
          <button type="button" className="msg-context-close" onClick={closeContext}>Close</button>
          <h2 id="msg-context-title">Discussion Context</h2>
          {referenceTypes.map(({ id, heading }) => {
            const supplied = id === 'file' ? context?.files ?? [] : context?.[id] ? [context[id]] : []
            const attached = [...channelReferences.values()].filter(({ type }) => type === id)
            const entries = [...new Map([...supplied, ...attached].map((entry) => [
              String(entry.id ?? entry.href ?? entry.label), entry,
            ])).entries()]
            return (
              <section key={id}>
                <h3>{heading}</h3>
                {entries.length === 0 && <p>None yet</p>}
                {entries.map(([key, entry]) => <p key={key}><Reference reference={entry} /></p>)}
              </section>
            )
          })}
        </aside>
      </main>

      <dialog className="msg-dialog" ref={referenceDialog} aria-labelledby="msg-reference-title">
        <form onSubmit={attachReference}>
          <h2 id="msg-reference-title">Attach a reference</h2>
          <label>
            Type
            <select value={referenceType} onChange={(event) => {
              setReferenceType(event.target.value)
              setReferenceId('')
              setSelectedFile(null)
            }}>
              {referenceTypes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          {options.length > 0 && (
            <label>
              {referenceType === 'file' ? 'Choose from Files' : 'Record'}
              <select value={referenceId} onChange={(event) => {
                setReferenceId(event.target.value)
                setSelectedFile(null)
              }}>
                <option value="">Choose a record</option>
                {options.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
          )}
          {referenceType === 'file' ? (
            <label>Choose a local file
              <input type="file" onChange={(event) => {
                setSelectedFile(event.target.files[0] ?? null)
                setReferenceId('')
              }} />
            </label>
          ) : options.length === 0 && (
            <p>{referenceType === 'task' ? 'No tasks available.' : 'No notebook records available.'}</p>
          )}
          <div>
            <button type="button" onClick={() => referenceDialog.current.close()}>Cancel</button>
            <button type="submit" className="msg-primary" disabled={!chosen && !selectedFile}>Attach</button>
          </div>
        </form>
      </dialog>

      <dialog className="msg-dialog" ref={channelDialog} aria-labelledby="msg-dialog-title">
        <form onSubmit={createChannel}>
          <h2 id="msg-dialog-title">Create Channel</h2>
          <label>Channel name<input name="name" required maxLength={50} /></label>
          {channelError && <p role="alert">{channelError}</p>}
          <div>
            <button type="button" onClick={() => channelDialog.current.close()}>Cancel</button>
            <button type="submit" className="msg-primary">Create</button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
