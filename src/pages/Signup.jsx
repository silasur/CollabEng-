
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

            const email = e.target.email.value

            navigate('/confirm-email', {
              state: { email }
            })
          }}
        >
          <label>Full Name</label>
          <input
            type="text"
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
