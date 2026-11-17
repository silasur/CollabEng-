
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

//  demo accountn untill backend is connected
async function verifyCredentials(email, password) {
  return email === 'student@example.com' && password === 'demo1234'
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    setErrorMessage('')

    try {
      const isValid = await verifyCredentials(email, password)

      if (!isValid) {
        setErrorMessage('Invalid email or password.')
        return
      }
    } catch {
      setErrorMessage('Unable to sign in. Please try again.')
      return
    }

    sessionStorage.setItem('currentStudentId', email)

    const hasCompletedFirstEnrollment =
      localStorage.getItem('hasCompletedFirstEnrollment') === 'true'

    navigate(hasCompletedFirstEnrollment ? '/dashboard' : '/course-enrollment')
  }

  return (
    <div className="form-panel">
      <div className="login-form">

        <div className="form-heading">
          <h2>Welcome back</h2>
        </div>

        <form onSubmit={handleLogin}>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="password">Password</label>

          <div className="password-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}

          <button type="submit" className="login-button">
            Log In
          </button>

        </form>

        <p className="signup-text">
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </p>

      </div>
    </div>
  )
}

export default LoginForm
