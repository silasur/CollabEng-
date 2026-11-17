
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MailConfirmation from './pages/MailConfirmation'
import ForgotPassword from './pages/ForgotPassword'
import CourseEnrollment from './pages/CourseEnrollment'
import CourseProjects from './pages/CourseProjects'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import StudentContributions from './pages/StudentContributions'
import StudentActivity from './pages/StudentActivity'
import Brainstorm from './pages/Brainstorm'
import Tasks from './pages/Tasks'
import Files from './pages/Files.jsx'
import Messages from './pages/Messages.jsx'
import Notebook from './pages/Notebook.jsx'
import AppHeader from './components/AppHeader'
import { AssistantProvider, AssistantWorkspace } from './components/Assistant'
import './App.css'

function App() {
  return (
    <AssistantProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/confirm-email" element={<MailConfirmation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password-sent" element={<MailConfirmation passwordReset />} />
        <Route path="/course-enrollment" element={<CourseEnrollment />} />
        <Route path="/course/:courseCode/projects" element={<CourseProjects />}/>
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-contributions" element={<StudentContributions />} />
        <Route path="/student-contributions/:studentId/activity" element={<StudentActivity />} />
        <Route path="/brainstorm" element={<Brainstorm />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/files" element={<Files />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notebook" element={<Notebook />} />


        <Route path="/ai-assistant" element={
          <div className="collab-dashboard">
            <AppHeader showProjectNavigation />
            <AssistantWorkspace />
          </div>
        } />
      </Routes>
    </AssistantProvider>

  )
}

export default App
