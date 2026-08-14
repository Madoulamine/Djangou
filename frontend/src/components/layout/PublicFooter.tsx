import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

const COL_PLATEFORME = ['Cours', 'Quiz', 'Défis', 'Certifications', 'Classement']
const COL_ENSEIGNANTS = ['Espace enseignant', 'Créer un cours', 'Suivi élèves', 'Évaluations']

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <img src={logo} alt="Djangou" />
            <p>La plateforme éducative numérique pour les élèves, enseignants et établissements scolaires.</p>
          </div>

          {/* Column: Plateforme */}
          <div className="footer__col">
            <h4>Plateforme</h4>
            {COL_PLATEFORME.map(label => (
              <Link key={label} to="/">{label}</Link>
            ))}
          </div>

          {/* Column: Enseignants */}
          <div className="footer__col">
            <h4>Enseignants</h4>
            {COL_ENSEIGNANTS.map(label => (
              <Link key={label} to="/">{label}</Link>
            ))}
          </div>
        </div>

        <div className="footer__socials">
          <a href="#" aria-label="Facebook" className="social-facebook">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V15.398H7.898v-3.398h2.54V9.453c0-2.518 1.492-3.906 3.784-3.906 1.096 0 2.245.196 2.245.196v2.467h-1.265c-1.246 0-1.633.774-1.633 1.564v1.828h2.784l-.445 3.398h-2.339v6.481C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" /></svg>
          </a>
          <a href="#" aria-label="YouTube" className="social-youtube">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186a2.697 2.697 0 0 0-1.89-1.9c-1.666-.446-8.334-.446-8.334-.446s-6.668 0-8.334.446a2.697 2.697 0 0 0-1.89 1.9c-.446 1.667-.446 5.147-.446 5.147s0 3.48.446 5.147a2.697 2.697 0 0 0 1.89 1.9c1.666.446 8.334.446 8.334.446s6.668 0 8.334-.446a2.697 2.697 0 0 0 1.89-1.9c.446-1.667.446-5.147.446-5.147s0-3.48-.446-5.147zM9.545 15.568V7.766l6.818 3.901-6.818 3.901z" /></svg>
          </a>
          <a href="#" aria-label="TikTok" className="social-tiktok">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003.93 16 6.33 6.33 0 0010.26 22.31a6.32 6.32 0 006.11-6.32V9.06a8.3 8.3 0 005.69 2.22V7.78a5.21 5.21 0 01-2.47-1.09z" /></svg>
          </a>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Djangou. Tous droits réservés.</span>
          <div className="footer__bottom-links">
            <Link to="/" className="footer__bottom-link">Politique de confidentialité &rarr;</Link>
            <Link to="/" className="footer__bottom-link">Conditions générales d'utilisation &rarr;</Link>
            <Link to="/" className="footer__bottom-link">Mentions légales &rarr;</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
