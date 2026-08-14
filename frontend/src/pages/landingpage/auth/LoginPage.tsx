import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import { SocialLogin } from '../../../components/ui/SocialLogin'

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)

export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div className="auth-layout">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-card__logo">
          <img src={logo} alt="Djangou" />
        </div>

        {/* Title */}
        <div className="auth-card__title">
          <h1>Connexion</h1>
          <p>Heureux de vous revoir ! Veuillez entrer vos identifiants.</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={e => e.preventDefault()}>
          {/* Email */}
          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <div className="field-input field-input--icon">
              <span className="field-icon"><IconMail /></span>
              <input id="email" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="field-input field-input--icon field-input--action">
              <span className="field-icon"><IconLock /></span>
              <input id="password" name="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="field-action" onClick={() => setShowPwd(v => !v)} aria-label="Afficher/Masquer">
                {showPwd ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Row: remember / forgot */}
          <div className="auth-row">
            <label>
              <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--blue)' }} />
              Se souvenir de moi
            </label>
            <Link to="/forgot">Mot de passe oublié ?</Link>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '.25rem' }}>
            Se connecter
          </button>
        </form>

        <SocialLogin />

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
