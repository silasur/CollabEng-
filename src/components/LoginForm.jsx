
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()

    const hasCompletedFirstEnrollment =
      localStorage.getItem('hasCompletedFirstEnrollment')

    if (hasCompletedFirstEnrollment === 'true') {
      navigate('/dashboard')
    } else {
      navigate('/course-enrollment')
    }
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
            type="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="password">Password</label>

          <div className="password-input-wrapper">
            <input
              id="password"
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
