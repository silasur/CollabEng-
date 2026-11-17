import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

import { getPeriod, getStudentActivity, project } from './StudentActivityData'

const categories = [
  { id: 'notebook', label: 'Notebook entries' },
  { id: 'reviews', label: 'AI reviews' },
  { id: 'files', label: 'Files' },
]

const filters = [{ id: 'all', label: 'All activity' }, ...categories]

function ActivityList({ student }) {
  const [filter, setFilter] = useState('all')
  const visibleCategories = categories.filter(({ id }) => filter === 'all' || filter === id)

  return (
    <>
      <div className="activity-filters" role="group" aria-label="Filter activity">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleCategories.map(({ id, label }) => (
        <section key={id} className="activity-section" aria-labelledby={`activity-${id}`}>
          <h2 id={`activity-${id}`}>
            {label} <span>({student[id].length})</span>
          </h2>
          {student[id].length > 0 ? (
            <ul>
              {student[id].map((title) => <li key={title}>{title}</li>)}
            </ul>
          ) : (
            <p className="activity-empty">No records in this category.</p>
          )}
        </section>
      ))}
    </>
  )
}

export default function StudentActivity() {
  const { studentId } = useParams()
  const [searchParams] = useSearchParams()
  const { value: period, label: periodLabel } = getPeriod(searchParams)
  const student = getStudentActivity(studentId, period)

  return (
    <div className="collab-dashboard contributions-page student-activity">
      <AppHeader showProjectNavigation />

      <div className="cd-body">
        <main className="sc-main">
          <div className="activity-content">
            <Link className="activity-back" to={`/student-contributions?period=${period}`}>
              ← Back to team contributions
            </Link>

            <div className="sc-heading">
              <h1>{student ? `${student.name}’s activity` : 'Student activity unavailable'}</h1>
              <p>{project.name} • {project.courseCode} • {project.term}</p>
              {student && <p>{periodLabel}</p>}
            </div>

            {student ? (
              <ActivityList key={studentId} student={student} />
            ) : (
              <p className="activity-empty">
                Return to team contributions and select a student.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
