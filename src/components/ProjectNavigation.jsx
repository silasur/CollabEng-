import dashboardIcon from '../assets/dashboard/dashboard.svg'
import brainstormIcon from '../assets/dashboard/brainstorm.svg'
import tasksIcon from '../assets/dashboard/tasks.svg'
import notebookIcon from '../assets/dashboard/notebook.svg'
import filesIcon from '../assets/dashboard/files.svg'
import messagesIcon from '../assets/dashboard/messages.svg'
import assistantIcon from '../assets/dashboard/assistant.svg'
import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Dashboard', icon: dashboardIcon, path: '/dashboard' },
  { label: 'Brainstorm', icon: brainstormIcon, path: '/brainstorm' },
  { label: 'Tasks', icon: tasksIcon, path: '/tasks' },
  { label: 'Notebook', icon: notebookIcon, path: '/notebook' },
  { label: 'Files', icon: filesIcon, path: '/files' },
  { label: 'Messages', icon: messagesIcon, path: '/messages' },
  { label: 'AI Assistant', icon: assistantIcon, path: '/ai-assistant' },
]

function ProjectNavigation() {
  return (
    <nav className="project-navigation" aria-label="Project navigation">
      {navigation.map(({ label, icon, path }) => {
        const content = (
          <>
            <span
              className="cd-nav-icon"
              style={{ '--nav-icon': `url("${icon}")` }}
              aria-hidden="true"
            />
            <span className="cd-nav-label">{label}</span>
          </>
        )

        return path ? (
          <NavLink
            key={label}
            to={path}
            className="cd-nav-item"
            aria-label={label}
            title={label}
            end
          >
            {content}
          </NavLink>
        ) : (
          <button
            key={label}
            type="button"
            className="cd-nav-item"
            aria-label={label}
            title={`${label} — coming soon`}
            disabled
          >
            {content}
          </button>
        )
      })}
    </nav>
  )
}

export default ProjectNavigation
