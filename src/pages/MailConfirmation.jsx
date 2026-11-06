
import { Link, useLocation } from 'react-router-dom'

function MailConfirmation() {
  const location = useLocation()
  const email = location.state?.email || 'your university email'

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">

        <div className="mail-illustration">
          <div className="mail-circle">
            <span className="mail-icon">✉</span>
          </div>
          <div className="success-badge">✓</div>
        </div>

        <h1>Check your email</h1>

        <p className="confirmation-description">
          We've sent a confirmation link to your email address.
        </p>

        <div className="confirmation-email">
         
          {email}
        </div>

        <p className="confirmation-info">
          Please check your inbox and click the confirmation
          link to activate your account.
        </p>

        <Link to="/" className="confirmation-button">
          Back to Login
        </Link>

        <p className="resend-text">
          Didn't receive the email? Check your spam folder.
        </p>

      </div>
    </div>
  )
}

export default MailConfirmation
