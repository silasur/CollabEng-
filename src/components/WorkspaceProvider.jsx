import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { WorkspaceContext } from './WorkspaceData'
import { getStudentName } from './studentIdentity'

function WorkspaceSession({ children, studentId }) {
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  // File identity prevents duplicate uploads when the same attachment is saved again.
  const fileIds = useRef(new WeakMap())
  const [entries, setEntries] = useState([])
  const [activities, setActivities] = useState([])

  function recordActivity(activity) {
    const actorName = getStudentName(studentId)

    setActivities((previous) => {
      if (previous.some(({ id }) => id === activity.id)) return previous
      return [{ ...activity, actorName }, ...previous]
    })
  }

  function registerFiles(attachments, source = null, metadata = {}) {
    const addedAt = new Date().toISOString()
    const uploader = getStudentName(studentId)
    const records = []
    const references = attachments.map((attachment) => {
      // Existing references stay references, including files deleted from the library.
      if (attachment.fileId) return attachment
      const file = attachment
      let id = fileIds.current.get(file)
      if (!id) {
        id = crypto.randomUUID()
        fileIds.current.set(file, id)
        const extension = file.name.split('.').length > 1 ? file.name.split('.').pop().toUpperCase() : 'FILE'
        const type = ['STEP', 'STP', 'STL', 'DWG', 'DXF'].includes(extension) ? 'CAD'
          : ['XLSX', 'XLS', 'CSV', 'TSV'].includes(extension) ? 'Data'
            : file.type.startsWith('image/') ? 'Image'
              : ['PDF', 'DOC', 'DOCX', 'TXT', 'MD'].includes(extension) ? 'Document' : 'File'
        records.push({ id, file, name: file.name, extension, type, addedAt, uploader, uploaderId: studentId,
          taskId: '', notebookId: '', ...metadata })
        recordActivity({ id: `file-uploaded:${id}`, kind: 'file-uploaded',
          targetId: id, title: file.name, occurredAt: addedAt })
      }
      return { fileId: id, name: file.name }
    })
    setFiles((previous) => {
      const next = [...records.filter((record) => !previous.some(({ id }) => id === record.id)), ...previous]
      if (!source) return next
      const ids = new Set(references.map(({ fileId }) => fileId))
      return next.map((record) => {
        const sources = (record.sources ?? []).filter((item) => !(item.kind === source.kind && item.id === source.id))
        if (ids.has(record.id)) sources.push(source)
        return { ...record, sources }
      })
    })
    return references
  }

  function removeActivity(resource, targetId) {
    setActivities((previous) => previous.filter((activity) =>
      activity.targetId !== targetId || !activity.kind.startsWith(`${resource}-`),
    ))
  }

  return (
    <WorkspaceContext.Provider value={{
      studentId, files, setFiles, entries, setEntries, messages, setMessages, registerFiles, activities, recordActivity, removeActivity,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export default function WorkspaceProvider({ children }) {
  // Navigation updates the provider after sign-in and sign-out.
  useLocation()
  const studentId = sessionStorage.getItem('currentStudentId')

  return (
    <WorkspaceSession key={studentId ?? 'guest'} studentId={studentId}>
      {children}
    </WorkspaceSession>
  )
}
