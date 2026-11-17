import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getContributions, getPeriod, periods, project } from './StudentActivityData'

function StudentContributions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { value: period, label: periodLabel } = getPeriod(searchParams)
  const members = getContributions(period)

  return (
    <div className="collab-dashboard contributions-page">
      <AppHeader showProjectNavigation />

      <div className="cd-body">
        <main className="sc-main">
          <div className="sc-content">
   

            {/* Display the current project information */}
            <div className="sc-heading">
              <h1>Team contributions</h1>
              <p>
                {project.name} • {project.courseCode} • {project.term}
              </p>
            </div>

            {/* Select the contribution reporting period */}
            <div
              className="sc-periods"
              role="group"
              aria-label="Contribution period"
            >
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={period === item.value ? 'is-selected' : ''}
                  aria-pressed={period === item.value}
                  onClick={() => setSearchParams({ period: item.value })}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Allow the contribution table to scroll on narrow screens */}
            <div
              className="sc-table-container"
              role="region"
              aria-label={`${periodLabel} team contributions`}
              tabIndex={0}
            >
              <table className="sc-table">
                <caption className="sc-visually-hidden">
                  Team contributions — {periodLabel}
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Team member</th>
                    <th scope="col">Total activity</th>
                    <th scope="col">Notebook</th>
                    <th scope="col">AI reviews</th>
                    <th scope="col">Files</th>
                    <th scope="col">
                      <span className="sc-visually-hidden">Activity details</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <th scope="row">{member.name}</th>
                      <td className="sc-total">{member.totalActivity}</td>
                      <td>{member.notebook}</td>
                      <td>{member.aiReviews}</td>
                      <td>{member.files}</td>
                      <td className="sc-action">
                        <Link
                          to={`/student-contributions/${member.id}/activity?period=${period}`}
                          aria-label={`View activity for ${member.name}`}
                        >
                          View activity →
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Show an empty state for periods without sample data */}
                  {members.length === 0 && (
                    <tr>
                      <td className="sc-empty" colSpan={6}>
                        No sample contribution data for this period yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StudentContributions