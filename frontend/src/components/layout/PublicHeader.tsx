import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Cours', to: '/cours' },
  { label: 'Défis', to: '/defis' },
  { label: 'Fondateurs', to: '/fondateurs' },
  { label: 'Contact', to: '/contact' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar__inner">
          {/* Hamburger – mobile only */}
          <button
            className="navbar__hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {open
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            }
          </button>

          {/* Theme Toggle (Mobile) */}
          <button
            onClick={() => setIsDark(v => !v)}
            className="btn btn-ghost navbar__mobile-theme-toggle"
            aria-label="Changer le thème"
          >
            {isDark ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="navbar__logo">
            <img src={logo} alt="Djangou" />
          </Link>

          {/* Desktop nav */}
          <nav className="navbar__links" aria-label="Navigation">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) => isActive ? 'active' : ''}
                end
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="navbar__actions">
            <button
              onClick={() => setIsDark(v => !v)}
              className="btn btn-ghost"
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              aria-label="Changer le thème"
            >
              {isDark ? (
                // Sun icon
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
              ) : (
                // Moon icon
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
              )}
            </button>
            <Link to="/register" className="btn btn-primary">S'inscrire</Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar__drawer ${open ? 'open' : ''}`}>
        <nav className="navbar__drawer-inner" aria-label="Navigation mobile">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}
              end
            >
              {label}
            </NavLink>
          ))}
          <div className="navbar__drawer-divider">
            <Link to="/register" className="btn btn-primary" onClick={() => setOpen(false)} style={{ justifyContent: 'center' }}>S'inscrire</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
