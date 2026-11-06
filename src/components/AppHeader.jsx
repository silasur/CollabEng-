
import ProfileMenu from './ProfileMenu'

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">

        <div className="app-brand">
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
        </div>

        <ProfileMenu />

      </div>
    </header>
  )
}

export default AppHeader
