export const project = {
  id: 'robot',
  name: 'Autonomous Delivery Robot',
  courseCode: 'MIE346',
  term: 'Fall 2026',
}

export const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'all', label: 'All time' },
]

export function getPeriod(searchParams) {
  return periods.find(({ value }) => value === searchParams.get('period')) ?? periods[1]
}

// Sample records grouped by reporting period until the API is available.
const weeklyActivity = new Map([
  ['alex', {
    name: 'Alex Johnson',
    otherActivity: 1,
    notebook: [
      'Drive system requirements',
      'Motor sizing calculations',
      'Traction test procedure',
      'Encoder calibration notes',
      'Prototype assembly checklist',
    ],
    reviews: [
      'Motor torque assumptions',
      'Encoder resolution trade-offs',
      'Drive system failure modes',
      'Traction test coverage',
    ],
    files: ['motor-sizing.xlsx', 'drivetrain-assembly.step'],
  }],
  ['priya', {
    name: 'Priya Shah',
    otherActivity: 1,
    notebook: [
      'Power budget assumptions',
      'Battery selection criteria',
      'Wiring harness layout',
      'Power draw measurements',
    ],
    reviews: [
      'Power budget assumptions',
      'Battery capacity estimate',
      'Wiring harness safety checks',
    ],
    files: ['power-budget.xlsx'],
  }],
  ['marcus', {
    name: 'Marcus Lee',
    notebook: [
      'Chassis load cases',
      'Mesh convergence notes',
      'Mounting bracket revision',
    ],
    reviews: ['Chassis boundary conditions', 'Mounting bracket stress results'],
    files: ['chassis-fea-iteration-4.pdf', 'mounting-bracket.step'],
  }],
  ['yuna', {
    name: 'Yuna Kim',
    notebook: ['Structural assumptions in section 3.2', 'Sensor placement notes'],
    reviews: ['Sensor field of view'],
    files: ['sensor-layout.pdf'],
  }],
])

const earlierActivity = new Map([
  ['alex', {
    notebook: ['Initial drivetrain sketch'],
    reviews: ['Drivetrain concept trade-offs'],
    files: ['drive-concept.pdf'],
  }],
  ['priya', {
    notebook: ['Initial battery requirements'],
    reviews: ['Preliminary power estimate'],
    files: ['battery-comparison.xlsx'],
  }],
  ['marcus', {
    notebook: ['Initial chassis constraints'],
    reviews: ['Frame material selection'],
    files: ['chassis-concept.step'],
  }],
  ['yuna', {
    notebook: ['Early sensor requirements'],
    reviews: ['Sensor coverage trade-offs'],
    files: ['sensor-comparison.pdf'],
  }],
])

export function getStudentActivity(studentId, period) {
  const student = weeklyActivity.get(studentId)
  if (!student) return undefined

  if (period === 'today') {
    return { name: student.name, notebook: [], reviews: [], files: [], otherActivity: 0 }
  }

  if (period === 'all') {
    const earlier = earlierActivity.get(studentId)
    return {
      ...student,
      notebook: [...student.notebook, ...earlier.notebook],
      reviews: [...student.reviews, ...earlier.reviews],
      files: [...student.files, ...earlier.files],
    }
  }

  return student
}

export function getContributions(period) {
  return Array.from(weeklyActivity.keys(), (id) => {
    const { name, notebook, reviews, files, otherActivity = 0 } = getStudentActivity(id, period)

    return {
      id,
      name,
      notebook: notebook.length,
      aiReviews: reviews.length,
      files: files.length,
      totalActivity: notebook.length + reviews.length + files.length + otherActivity,
    }
  }).filter(({ totalActivity }) => totalActivity > 0)
}
