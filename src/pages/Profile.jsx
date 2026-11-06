
import AppHeader from '../components/AppHeader'

function Profile() {
  const fullName = localStorage.getItem('studentName') || 'Student Name'
  const email = localStorage.getItem('studentEmail') || 'Not available yet'

  return (
    <>
      <AppHeader />

      <main className="profile-page">
        <div className="profile-container">
          <h1>My Profile</h1>

          <div className="profile-card">
            <div className="profile-avatar-large">
              {fullName.charAt(0).toUpperCase()}
            </div>

            <h2>{fullName}</h2>
            <p>Student Account</p>

            <div className="profile-details">
              <div className="profile-detail">
                <span>Full Name</span>
                <strong>{fullName}</strong>
              </div>

              <div className="profile-detail">
                <span>University Email</span>
                <strong>{email}</strong>
              </div>

              <div className="profile-detail">
                <span>University</span>
                <strong>University of Toronto</strong>
              </div>
              
              <div className="enrolled-courses-profile">
                <h3>Enrolled Courses</h3>
                {JSON.parse(localStorage.getItem('enrolledCourses') || '[]').length === 0 ? (
                    <p>No courses enrolled yet.</p>
                ) : (
                    JSON.parse(localStorage.getItem('enrolledCourses') || '[]').map((course) => (
                        <div className="profile-course-item" key={course}>
                            <strong>{course}</strong>
                            <span>Enrolled</span>
                        </div>   
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Profile
