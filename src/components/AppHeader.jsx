import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProfileMenu from './ProfileMenu'
import ProjectNavigation from './ProjectNavigation'

const workspacePathKey = 'collabeng.lastWorkspacePath'
const workspacePathPattern = /^\/(?:dashboard|brainstorm|tasks|notebook|files|messages|ai-assistant|student-contributions)(?:[/?#]|$)/

function readWorkspacePath() {
  try {
    const path = sessionStorage.getItem(workspacePathKey)
    return path && workspacePathPattern.test(path) ? path : '/dashboard'
  } catch {
    return '/dashboard'
  }
}

function AppHeader({ showProjectNavigation = false }) {
  const location = useLocation()
  const currentPath = location.pathname + location.search + location.hash
  const isWorkspace = workspacePathPattern.test(currentPath)
  const returnPath = readWorkspacePath()

  useEffect(() => {
    if (!isWorkspace) return
    try {
      sessionStorage.setItem(workspacePathKey, currentPath)
    } catch {
      // Navigation remains usable when browser storage is unavailable.
    }
  }, [isWorkspace, currentPath])

  return (
    <header className={showProjectNavigation ? 'app-header project-header' : 'app-header'}>
      <div className="app-header-inner">
        {showProjectNavigation ? (
          <ProjectNavigation />
        ) : (
          <Link className="app-brand workspace-brand-link" to={returnPath}
            aria-label="Return to workspace" title="Back to workspace">
            <div className="app-brand-logo">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9L12 3L21 9H3Z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 10V19M9.5 10V19M14.5 10V19M19 10V19M3 20H21"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="app-brand-text">
              <strong>University of Toronto</strong>
              <span>CollabEng Workspace</span>
            </div>
          </Link>
        )}

        <div className="assistant-header-actions">
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
