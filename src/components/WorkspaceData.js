import { createContext, useContext } from 'react'

export const WorkspaceContext = createContext(null)
const tasksStorageKey = 'collabeng.projectTasks'

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext)
  if (!workspace) throw new Error('WorkspaceProvider is missing.')
  return workspace
}

function readTasks() {
  try {
    const records = JSON.parse(sessionStorage.getItem(tasksStorageKey) ?? '[]')
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

const dueDatePattern = /^\d{4}-\d{2}-\d{2}$/

// Replace this data source with the project-scoped dashboard response when the API is available.
export function useDashboardData() {
  const { files, entries, activities, studentId } = useWorkspace()
  const myOpenTasks = studentId
    ? readTasks().filter((task) => task?.assigneeId === studentId
      && typeof task.title === 'string' && task.status !== 'Done')
    : []

  const upcomingTasks = myOpenTasks
    .filter((task) => typeof task.due === 'string' && dueDatePattern.test(task.due)
      && !Number.isNaN(Date.parse(task.due)))
    .sort((a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title))

  const sharedEntries = entries.filter((entry) => entry.scope === 'Shared')
  const sharedIds = new Set(sharedEntries.map(({ id }) => id))
  const sharedFiles = files.filter((file) => file.libraryUpload || file.taskId || file.notebookId
    || (file.sources ?? []).some((source) => source.kind === 'message' || sharedIds.has(source.id)))
  const filesById = new Map(sharedFiles.map((file) => [file.id, file]))

  const recentActivity = activities.flatMap((activity) => {
    if (activity.kind.startsWith('note-') && !sharedIds.has(activity.targetId)) return []
    if (activity.kind === 'file-uploaded') {
      const file = filesById.get(activity.targetId)
      return file ? [{ ...activity, title: file.name }] : []
    }
    return [activity]
  }).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))

  return {
    openTaskCount: myOpenTasks.length,
    sharedNotesCount: sharedEntries.length,
    fileCount: sharedFiles.length,
    upcomingTasks,
    recentActivity,
  }
}
