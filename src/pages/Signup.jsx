
import { useNavigate, Link } from 'react-router-dom'

function Signup() {
  const navigate = useNavigate()

  return (
    <div className="signup-page">
      <div className="signup-container">

        <h1>Create your account</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()

            const form = new FormData(e.currentTarget)
            const fullName = form.get('fullName').trim()
            const email = form.get('email').trim()
            if (!fullName) return

            // Keep the profile name associated with its email until registration uses the backend.
            localStorage.setItem(`studentName:${email.toLowerCase()}`, fullName)

            navigate('/confirm-email', {
              state: { email }
            })
          }}
        >
          <label htmlFor="signup-full-name">Full Name</label>
          <input
            id="signup-full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            required
          />

          <label>University Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your university email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm your password"
            required
          />

          <button type="submit">
            Create Account
          </button>
        </form>

        <p className="login-link">
          Already have an account?
          <Link to="/"> Log In</Link>
        </p>

      </div>
    </div>
  )
}

export default Signup
