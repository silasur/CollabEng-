
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const courseProjects = {
  MIE346: [
    {
      id: 'robot',
      title: 'Autonomous Delivery Robot',
      description: 'Design and develop an autonomous delivery system for campus use.',
    },
    {
      id: 'arm',
      title: 'Robotic Arm',
      description: 'Develop a robotic arm concept with documented design decisions and trade-offs.',
    },
    {
      id: 'bridge',
      title: 'Sustainable Bridge',
      description: 'Explore structural concepts and justify material and geometry choices.',
    },
  ],

  ECE297: [
    {
      id: 'traffic',
      title: 'Smart Traffic System',
      description: 'Develop a smart system to improve traffic flow.',
    },
    {
      id: 'energy',
      title: 'Renewable Energy Monitor',
      description: 'Design a system to monitor renewable energy usage.',
    },
  ],
}

function CourseProjects() {
  const { courseCode } = useParams()
  const navigate = useNavigate()

  const projects = courseProjects[courseCode.toUpperCase()] || []

  const [selectedProjects, setSelectedProjects] = useState(() => {
    const saved = JSON.parse(
      localStorage.getItem('courseProjectSelections') || '{}'
    )
    return saved[courseCode] || []
  })

  const handleProjectSelection = (projectId) => {
    setSelectedProjects((previous) => {
      const updated = previous.includes(projectId)
        ? previous.filter((id) => id !== projectId)
        : [...previous, projectId]

      return updated
    })
  }

  const handleSave = () => {
    const saved = JSON.parse(
      localStorage.getItem('courseProjectSelections') || '{}'
    )

    saved[courseCode] = selectedProjects

    localStorage.setItem(
      'courseProjectSelections',
      JSON.stringify(saved)
    )

    navigate('/course-enrollment')
  }

  return (
    <>
      <AppHeader />

      <main className="projects-page">
        <div className="projects-container">
          <button
            className="back-button"
            onClick={() => navigate('/course-enrollment')}
          >
            ← Back to My Courses
          </button>

          <h1>Choose Your Projects</h1>

          <div className="projects-list">
            {projects.length === 0 ? (
              <p>No projects are available for this course yet.</p>
            ) : (
              projects.map((project) => {
                const isSelected = selectedProjects.includes(project.id)

                return (
                  <div
                    className={`project-card ${isSelected ? 'selected' : ''}`}
                    key={project.id}
                  >
                    <div className="project-info">
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                    </div>

                    <button
                      className="project-select-button"
                      onClick={() => handleProjectSelection(project.id)}
                    >
                      {isSelected ? 'Selected ✓' : 'Select Project'}
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {projects.length > 0 && (
            <div className="projects-footer">
              <span>
                {selectedProjects.length} project(s) selected
              </span>

              <button
                className="save-projects-button"
                onClick={handleSave}
              >
                Save My Projects
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default CourseProjects
