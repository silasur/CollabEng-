
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/SignUp'
import MailConfirmation from './pages/MailConfirmation'
import ForgotPassword from './pages/ForgotPassword'
import CourseEnrollment from './pages/CourseEnrollment'
import CourseProjects from './pages/CourseProjects'
import Profile from './pages/Profile'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/confirm-email" element={<MailConfirmation />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/course-enrollment" element={<CourseEnrollment />} />
      <Route path="/course/:courseCode/projects" element={<CourseProjects />}/>
      <Route path="/profile" element={<Profile />} />
    </Routes>

  )
}

export default App
