
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const studentEmail = sessionStorage.getItem('currentStudentId')?.trim().toLowerCase()
  const fullName = studentEmail
    ? localStorage.getItem(`studentName:${studentEmail}`)?.trim()
    : undefined
  const nameParts = fullName ? fullName.split(/\s+/) : []
  const firstInitial = nameParts[0]?.[0] ?? ''
  const lastInitial = nameParts.length > 1 ? nameParts.at(-1)[0] : ''
  const initials = (firstInitial + lastInitial).toUpperCase()

  return (
    <div className="profile-menu">

      <button
        type="button"
        className="profile-user"
        aria-label={fullName ? `Profile menu for ${fullName}` : 'Profile menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="profile-avatar" aria-hidden="true">
          {initials || (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
      </button>

      {isOpen && (
        <div className="profile-dropdown">

          <button onClick={() => {
            navigate('/profile')
            setIsOpen(false)
          }}>
            My Profile
          </button>

          <button
            onClick={() => {
              navigate('/course-enrollment')
              setIsOpen(false)
            }}
          >
            Course Enrollment
          </button>

          <button type="button" title="Settings — coming soon" disabled>
            Settings
          </button>

          <button onClick={() =>{
            setIsOpen(false)
            sessionStorage.removeItem('currentStudentId')
            navigate('/')
          }}>
            Log Out
          </button>

        </div>
      )}

    </div>
  )
}

export default ProfileMenu
