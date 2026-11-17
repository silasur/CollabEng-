
import { Link, useNavigate } from 'react-router-dom'

function ForgotPassword() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    const email = e.target.email.value

    navigate('/reset-password-sent', {
      state: { email }
    })
  }

  return (
    <div className="forgot-page">
      <div className="forgot-container">

        <div className="forgot-icon">
          <span>🔐</span>
        </div>

        <h1>Forgot Password?</h1>

        <p className="forgot-description">
          No worries! Enter your registered email address
          and reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <label>University Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your university email"
            required
          />

          <button type="submit">
            Send Reset Link
          </button>
        </form>

        <Link to="/" className="back-login-link">
          ← Back to Login
        </Link>

      </div>
    </div>
  )
}

export default ForgotPassword