import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import { SocialLogin } from '../../../components/ui/SocialLogin'
type RoleType = 'eleve' | 'etudiant' | 'enseignant' | 'admin'

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

// Role icons as inline SVG
const ROLES: { value: RoleType; label: string; icon: ReactNode }[] = [
  {
    value: 'eleve',
    label: 'Élève',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>,
  },
  {
    value: 'etudiant',
    label: 'Étudiant',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
  },
  {
    value: 'enseignant',
    label: 'Enseignant',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
]

export function RegisterPage() {
  const [role, setRole] = useState<RoleType>('eleve')
  const [showPwd, setShowPwd] = useState(false)
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="auth-layout">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-card__logo">
          <img src={logo} alt="Djangou" />
        </div>

        {/* Title */}
        <div className="auth-card__title">
          <h1>Créer un compte</h1>
          <p>Rejoignez la communauté d'apprentissage</p>
        </div>

        {/* Role picker */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '.84rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.75rem' }}>
            Je suis un…
          </p>
          <div className="role-grid">
            {ROLES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                className={`role-btn ${role === value ? 'active' : ''}`}
                onClick={() => setRole(value)}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={e => e.preventDefault()}>
          <div className="field">
            <label htmlFor="name">Nom complet</label>
            <div className="field-input">
              <input id="name" name="name" type="text" placeholder="Jean Dupont" autoComplete="name" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <div className="field-input">
              <input id="email" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="field-input field-input--action">
              <input id="password" name="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" className="field-action" onClick={() => setShowPwd(v => !v)} aria-label="Afficher">
                {showPwd ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <div className="field-input field-input--action">
              <input id="confirm" name="confirm" type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" />
            </div>
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', fontSize: '.84rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 2, width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0 }}
            />
            <span>
              J'accepte les <Link to="/" style={{ color: 'var(--blue)', fontWeight: 700 }}>conditions d'utilisation</Link> et la politique de confidentialité.
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '.25rem' }}
            disabled={!agreed}
          >
            Créer mon compte →
          </button>
        </form>

        <SocialLogin />

        <p className="auth-switch">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
