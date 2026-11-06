
import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import { useNavigate } from 'react-router-dom'

function CourseEnrollment() {
  const navigate = useNavigate() 
  const [courseCode, setCourseCode] = useState('')
  const [courses, setCourses] = useState([])
  const [message, setMessage] = useState('')

  const handleEnrollment = (e) => {
    e.preventDefault()

    const code = courseCode.trim().toUpperCase()

    if (!code) return

    if (courses.includes(code)) {
      setMessage('You have already added this course.')
      return
    }

    setCourses([...courses, code])
    localStorage.setItem('hasCompletedFirstEnrollment', 'true')
    setCourseCode('')
    setMessage('Course added successfully!')
  }

  return (
    <>
      <AppHeader />

      <main className="enrollment-page">
        <div className="enrollment-container">

          <div className="enrollment-header">
            <h1>Course Enrollment</h1>

            <form onSubmit={handleEnrollment}>
              <label htmlFor="courseCode">Course Code</label>

              <div className="course-input-group">
                <input
                  id="courseCode"
                  name="courseCode"
                  type="text"
                  placeholder="e.g. ENG2001"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  required
                />

                <button type="submit">
                  Join Course
                </button>
              </div>
            </form>

            {message && (
              <p className="enrollment-message">{message}</p>
            )}
          </div>

          <div className="enrolled-courses-section">
            <h2>My Courses</h2>

            {courses.length === 0 ? (
              <div className="empty-courses">
                <span>📚</span>
                <h3>No courses yet</h3>
                <p>
                  You haven't joined any courses.
                  Enter a course code above to get started.
                </p>
              </div>
            ) : (
              <div className="course-list">
                {courses.map((course) => (
                  <div 
                    className="course-item"
                    key={course}
                    onClick={() => navigate(`/course/${course}/projects`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="course-icon">📘</div>

                    <div className="course-details">
                      <h3>{course}</h3>
                      <p>Course Code</p>
                    </div>

                    <span className="course-status">
                      Added
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  )
}

export default CourseEnrollment
