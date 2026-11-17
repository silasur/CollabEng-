// Until the API supplies user profiles, use the name saved during registration.
export function getStudentName(studentId = sessionStorage.getItem('currentStudentId')) {
  const id = studentId?.trim().toLowerCase()
  if (!id) return 'Student'
  try {
    const name = localStorage.getItem(`studentName:${id}`)?.trim()
    return name && !name.includes('@') ? name : 'Student'
  } catch {
    return 'Student'
  }
}

// Resolve older email-based records too, without attributing them to another user.
export function displayStudentName(name, studentId) {
  if (typeof name === 'string' && name.trim() && !name.includes('@')) return name.trim()
  return getStudentName(studentId || name)
}
