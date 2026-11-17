import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
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


const filters = ['All', 'In Progress', 'Done']

// Format date-only values in UTC so the displayed date stays the same across time zones.
const dateFormat = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' })
const weekDateFormat = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' })

function TaskDate({ value }) {
  return value ? <time dateTime={value}>{dateFormat.format(new Date(value))}</time> : '—'
}

function getWeekRange(now) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

function getTaskCompletion(task) {
  if (task.status !== 'Done') return null
  if (task.completedAt) {
    return { at: task.completedAt, by: task.completedBy, name: task.completedByName }
  }

  // Read completion dates recorded by the earlier task version.
  const history = Array.isArray(task.progressHistory) ? task.progressHistory : []
  const completion = history.filter((change) => change.status === 'Done' && change.previousStatus !== 'Done')
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0]
  return completion
    ? { at: completion.occurredAt, by: completion.actorId, name: completion.actorName }
    : null
}

function getWeeklyActivity(tasks, start, end) {
  const students = new Map()

  for (const task of tasks) {
    const completion = getTaskCompletion(task)
    const events = [
      { at: task.createdAt, by: task.createdBy, name: task.createdByName, count: 'added' },
      { ...completion, count: 'completed' },
    ]

    for (const event of events) {
      const timestamp = Date.parse(event.at)
      if (!event.by || !(timestamp >= start.getTime() && timestamp < end.getTime())) continue
      if (!students.has(event.by)) {
        students.set(event.by, { id: event.by, name: event.name, added: 0, completed: 0 })
      }
      const student = students.get(event.by)
      if (event.name) student.name = event.name
      student[event.count] += 1
    }
  }

  return Array.from(students.values())
}

function Tasks({ teamMembers = [] }) {
  const { recordActivity } = useWorkspace()
  // The demo login stores the account ID for this browser tab.
  const currentStudentId = sessionStorage.getItem('currentStudentId')
  const [tasks, setTasks] = useState(readProjectTasks)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [assigneeId, setAssigneeId] = useState(currentStudentId ?? '')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('In Progress')
  const [progressInput, setProgressInput] = useState('0')
  const dialog = useRef(null)
  // Apply the status filter when choosing which rows to display.
  const visibleTasks = tasks.filter(({ status }) => filter === 'All' || filter === status)

  const week = getWeekRange(new Date())
  const weekEnd = new Date(week.end)
  weekEnd.setDate(weekEnd.getDate() - 1)
  const weeklyActivity = getWeeklyActivity(tasks, week.start, week.end)
  const currentName = currentStudentId
    ? localStorage.getItem(`studentName:${currentStudentId.trim().toLowerCase()}`)?.trim()
    : ''

  function studentName(student) {
    return teamMembers.find(({ id }) => id === student.id)?.name
      || student.name
      || (student.id === currentStudentId ? currentName || 'Me' : student.id)
  }

  function canEdit(task) {
    return Boolean(currentStudentId && task.assigneeId === currentStudentId)
  }

  function openTaskForm(task = null) {
    if (!currentStudentId || (task && !canEdit(task))) return

    const fields = dialog.current.querySelector('form').elements
    fields.namedItem('title').value = task?.title ?? ''
    setAssigneeId(task?.assigneeId || currentStudentId)
    fields.namedItem('due').value = task?.due ?? ''
    setEditingTask(task)
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'In Progress')
    setProgressInput(task?.status === 'In Progress' ? String(task.progress) : '0')
    setError('')
    dialog.current.showModal()
  }

  function saveTask(event) {
    event.preventDefault()
    if (!currentStudentId) {
      setError('Sign in before creating or editing tasks.')
      return
    }
    if (editingTask && !canEdit(editingTask)) {
      setError('Only the assigned student can edit this task.')
      return
    }

    // Read the submitted fields and reject names made entirely of whitespace.
    const fields = new FormData(event.currentTarget)
    const title = fields.get('title').trim()
    if (!title) {
      setError('Enter a task name.')
      return
    }

    const assignedStudentId = editingTask ? editingTask.assigneeId : assigneeId
    if (!assignedStudentId) {
      setError('Select the student assigned to this task.')
      return
    }

    // Completed tasks always have 100% progress.
    const progress = status === 'Done' ? 100 : Number(progressInput)
    if (status === 'In Progress' &&
        (!progressInput.trim() || !Number.isInteger(progress) || progress < 0 || progress > 99)) {
      setError('Enter a whole number from 0 to 99.')
      return
    }

    // Use the current local calendar date for the last update.
    const now = new Date()
    const updated = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
    const timestamp = now.toISOString()
    const becameDone = status === 'Done' && editingTask?.status !== 'Done'
    const completion = becameDone
      ? { at: timestamp, by: currentStudentId, name: currentName || null }
      : editingTask ? getTaskCompletion(editingTask) : null

    const task = {
      ...editingTask,
      id: editingTask?.id ?? crypto.randomUUID(),
      title,
      description: description.trim(),
      assigneeId: assignedStudentId,
      status,
      due: fields.get('due'),
      updated,
      progress,
      createdAt: editingTask ? editingTask.createdAt ?? null : timestamp,
      createdBy: editingTask ? editingTask.createdBy ?? null : currentStudentId,
      createdByName: editingTask ? editingTask.createdByName ?? null : currentName || null,
      completedAt: status === 'Done' ? completion?.at ?? null : null,
      completedBy: status === 'Done' ? completion?.by ?? null : null,
      completedByName: status === 'Done' ? completion?.name ?? null : null,
    }

    const nextTasks = editingTask
      ? tasks.map((item) => item.id === task.id ? task : item)
      : [...tasks, task]

    try {
      sessionStorage.setItem(taskStorageKey, JSON.stringify(nextTasks))
    } catch {
      setError('Unable to save the task in this tab.')
      return
    }

    setTasks(nextTasks)
    if (becameDone) {
      recordActivity({
        id: crypto.randomUUID(),
        kind: 'task-completed',
        targetId: task.id,
        title: task.title,
        occurredAt: now.toISOString(),
      })
    }
    // Show the new task immediately if the current filter would hide it.
    if (filter !== 'All' && filter !== status) setFilter('All')
    dialog.current.close()
  }

  return (
    <div className="collab-dashboard tasks-page">
      <AppHeader showProjectNavigation />

      <main className="tasks-main" aria-label="Tasks">
        {!currentStudentId && (
          <p role="alert">Sign in to create and edit your tasks. <Link to="/">Go to login</Link></p>
        )}
        <div className="tasks-toolbar">
          <div className="tasks-filters" role="group" aria-label="Filter tasks">
            {filters.map((label) => (
              <button
                key={label}
                type="button"
                aria-pressed={filter === label}
                onClick={() => setFilter(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="tasks-primary" disabled={!currentStudentId} onClick={() => openTaskForm()}>+ New Task</button>
        </div>

        <div className="tasks-table-wrap" role="region" aria-label="Project tasks" tabIndex={0}>
          <table className="tasks-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Assigned to</th>
                <th scope="col">Status</th>
                <th scope="col">Due date</th>
                <th scope="col">Last update</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => (
                <tr
                  key={task.id}
                  data-editable={canEdit(task)}
                  onClick={() => openTaskForm(task)}
                >
                  <th scope="row">
                    {canEdit(task) ? (
                      <button
                        type="button"
                        className="tasks-edit"
                        aria-label={`Edit ${task.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openTaskForm(task)
                        }}
                      >
                        {task.title}
                      </button>
                    ) : task.title}
                  </th>
                  <td>{teamMembers.find(({ id }) => id === task.assigneeId)?.name || (task.assigneeId === currentStudentId ? 'Me' : task.assigneeId) || 'Unassigned'}</td>
                  <td className={task.status === 'Done' ? 'tasks-done' : 'tasks-in-progress'}>
                    {task.status}
                  </td>
                  <td><TaskDate value={task.due} /></td>
                  <td><TaskDate value={task.updated} /></td>
                  <td className="tasks-percent">{task.progress}%</td>
                </tr>
              ))}
              {visibleTasks.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    {tasks.length === 0 ? 'No tasks yet.' : 'No tasks match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="tasks-weekly" aria-labelledby="tasks-weekly-title">
          <div className="tasks-weekly-heading">
            <h2 id="tasks-weekly-title">Weekly activity</h2>
            <p>
              <time dateTime={week.start.toISOString()}>{weekDateFormat.format(week.start)}</time>
              {' – '}
              <time dateTime={weekEnd.toISOString()}>{weekDateFormat.format(weekEnd)}</time>
            </p>
          </div>
          {weeklyActivity.length === 0 ? (
            <p className="tasks-weekly-empty">No tasks added or completed this week.</p>
          ) : (
            <ul className="tasks-weekly-students">
              {weeklyActivity.map((student) => (
                <li className="tasks-weekly-student" key={student.id}>
                  <strong>{studentName(student)}</strong>
                  <span>
                    {student.added} {student.added === 1 ? 'task' : 'tasks'} added
                    {' · '}{student.completed} completed
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <dialog className="tasks-dialog" ref={dialog} aria-labelledby="task-form-title">
        <form onSubmit={saveTask}>
          <h2 id="task-form-title">{editingTask ? 'Edit Task' : 'New Task'}</h2>
          <label>
            Task name
            <input name="title" required maxLength={120} />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label>
            Assigned to
            <select
              name="assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              required
              disabled={Boolean(editingTask)}
            >
              {currentStudentId && !teamMembers.some(({ id }) => id === currentStudentId) && (
                <option value={currentStudentId}>Me</option>
              )}
              {teamMembers.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </label>
          <label>
            Progress (%)
            <input
              type="number"
              min={0}
              max={99}
              step={1}
              required
              disabled={status === 'Done'}
              value={status === 'Done' ? '100' : progressInput}
              onChange={(event) => setProgressInput(event.target.value)}
            />
          </label>
          <label>
            Due date
            <input type="date" name="due" required />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="tasks-dialog-actions">
            <button type="button" onClick={() => dialog.current.close()}>Cancel</button>
            <button type="submit" className="tasks-primary">{editingTask ? 'Save changes' : 'Create Task'}</button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

export default Tasks
