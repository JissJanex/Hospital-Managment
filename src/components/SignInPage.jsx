import { useState } from 'react'

function SignInPage({ onSignIn, isSubmitting, submitError, configError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  const isDisabled = isSubmitting || Boolean(configError)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidationError('')

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !password) {
      setValidationError('Email and password are required.')
      return
    }

    await onSignIn(normalizedEmail, password)
  }

  return (
    <div className="signin-shell">
      <section className="signin-card surface" aria-labelledby="signin-title">
        <p className="signin-tag">Hospital Management Platform</p>
        <h1 id="signin-title">Sign in to your workspace</h1>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label className="signin-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="admin@hospital.com"
              disabled={isDisabled}
              required
            />
          </label>

          <label className="signin-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isDisabled}
              required
            />
          </label>

          {validationError ? <p className="signin-error">{validationError}</p> : null}
          {configError ? <p className="signin-error">{configError}</p> : null}
          {submitError && !configError ? <p className="signin-error">{submitError}</p> : null}

          <button type="submit" className="action-btn primary signin-btn" disabled={isDisabled}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default SignInPage
