import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useDashboardData } from '../components/WorkspaceData'
import fileDot from '../assets/dashboard/activity-file.svg'
import updateDot from '../assets/dashboard/activity-update.svg'

const activityTypes = {
  'file-uploaded': { label: 'File uploaded', to: '/files', icon: fileDot },
  'note-created': { label: 'Shared note created', to: '/notebook', icon: updateDot },
  'note-updated': { label: 'Shared note updated', to: '/notebook', icon: updateDot },
  'note-published': { label: 'Note published to Shared Notebook', to: '/notebook', icon: updateDot },
  'task-completed': { label: 'Task completed', to: '/tasks', icon: updateDot },
}

const activityDateFormat = new Intl.DateTimeFormat('en-CA', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})
const dueDateFormat = new Intl.DateTimeFormat('en-CA', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

function Dashboard() {
  const { openTaskCount, sharedNotesCount, fileCount, upcomingTasks, recentActivity } = useDashboardData()
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const metrics = [
    { label: 'My open tasks', count: openTaskCount, to: '/tasks' },
    { label: 'Shared notebook entries', count: sharedNotesCount, to: '/notebook' },
    { label: 'Project files', count: fileCount, to: '/files' },
  ]

  const visibleActivity = recentActivity
    .filter(({ kind }) => activityTypes[kind])
    .toSorted((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 8)

  return (
    <div className="collab-dashboard">
      <AppHeader showProjectNavigation />

      <main className="cd-main">
        <h1 className="cd-page-title">Project dashboard</h1>

        <section className="cd-metrics" aria-label="Project overview">
          {metrics.map(({ label, count, to }) => (
            <Link className="cd-card cd-metric" key={to} to={to}>
              <span>{label}</span>
              <strong>{count}</strong>
            </Link>
          ))}
        </section>

        <div className="cd-panels">
          <section className="cd-card cd-panel" aria-labelledby="dashboard-activity">
            <h2 id="dashboard-activity">Recent activity</h2>
            <div aria-live="polite">
              {visibleActivity.length ? (
                <ul className="cd-feed">
                  {visibleActivity.map(({ id, kind, title, actorName, occurredAt }) => {
                    const { label, to, icon } = activityTypes[kind]
                    return (
                      <li key={id}>
                        <img src={icon} alt="" />
                        <div>
                          <p className="cd-muted">{label}</p>
                          <Link className="cd-record-link" to={to}>{title}</Link>
                          <p className="cd-muted">
                            {actorName && `${actorName} · `}
                            <time dateTime={occurredAt}>{activityDateFormat.format(new Date(occurredAt))}</time>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="cd-empty">No recent activity yet.</p>
              )}
            </div>
          </section>

          <section className="cd-card cd-panel" aria-labelledby="dashboard-tasks">
            <div className="cd-panel-heading">
              <h2 id="dashboard-tasks">My upcoming tasks</h2>
              <Link to="/tasks">View tasks →</Link>
            </div>

            {upcomingTasks.length ? (
              <ul className="cd-due-list">
                {upcomingTasks.slice(0, 5).map(({ id, title, due, progress }) => (
                  <li key={id}>
                    <p className="cd-task-title">{title}</p>
                    <p className="cd-muted">
                      {due < today && <strong className="cd-overdue">Overdue · </strong>}
                      <time dateTime={due}>{dueDateFormat.format(new Date(due))}</time>
                      {Number.isFinite(progress) && ` · ${progress}% complete`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cd-empty">No open tasks with a due date.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
