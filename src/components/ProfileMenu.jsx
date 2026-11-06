
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // Temporary example until user data is connected
  const fullName = 'Student Name'

  return (
    <div className="profile-menu">

      <button
        className="profile-user"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="profile-user-info">
          <strong>{fullName}</strong>
          <span>Student account</span>
        </div>

        <div className="profile-avatar">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5"
              stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6"
              stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" />
          </svg>
        </div>
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

          <button onClick={() =>{
            setIsOpen(false)
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
