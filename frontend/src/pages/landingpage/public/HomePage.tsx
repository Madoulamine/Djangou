import { Link } from 'react-router-dom'
import eleve2 from '../../../assets/images/eleve2.png'
import { BrandHighlight } from '../../../components/ui/BrandHighlight'
import { CountUp } from '../../../components/ui/CountUp'

/* ── SVG Icon components (inline, no emoji) ── */
const IconVideo = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="15" height="15" rx="2" /><path d="m17 8 4-2v12l-4-2" /></svg>
const IconQuiz = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
const IconTrophy = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M12 17v4" /><path d="M8 21h8" /><path d="M7 4h10v7a5 5 0 0 1-10 0V4Z" /></svg>
const IconBadge = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
const IconOffline = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
const IconCup = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8" /><path d="M12 17v4" /><path d="M17 7A5 5 0 0 1 7 7v0" /><rect x="2" y="4" width="20" height="4" rx="1" /></svg>

const FEATURES = [
  { icon: <IconVideo />, title: 'Cours Vidéo & PDF', desc: "Accédez à un contenu d'excellente qualité pour l'ensemble du programme.", accent: false },
  { icon: <IconQuiz />, title: 'Quiz & Évaluation', desc: 'Testez vos connaissances avec des quiz interactifs et une correction automatique.', accent: true },
  { icon: <IconTrophy />, title: 'Défis & Badges', desc: 'Gagnez des badges et grimpez dans le classement pour vous dépasser.', accent: false },
  { icon: <IconBadge />, title: 'Certifications', desc: 'Obtenez des certificats valorisants à la fin de chaque parcours.', accent: true },
  { icon: <IconOffline />, title: 'Mode Hors-ligne', desc: 'Téléchargez vos cours pour les consulter sans connexion internet.', accent: false },
  { icon: <IconCup />, title: 'Concours Officiels', desc: 'Préparez-vous aux examens nationaux avec des annales et corrections.', accent: true },
]

const STATS: {
  target: number
  divisor: number
  suffix: string
  label: string
  orange: boolean
}[] = [
    { target: 15000, divisor: 1000, suffix: 'k+', label: 'Élèves', orange: false },
    { target: 900, divisor: 1, suffix: '+', label: 'Enseignants', orange: true },
    { target: 600, divisor: 1, suffix: '+', label: 'Cours', orange: false },
    { target: 30000, divisor: 1000, suffix: 'k+', label: 'Quiz', orange: true },
    { target: 95, divisor: 1, suffix: '%', label: 'Taux réussite', orange: false },
  ]

export function HomePage() {
  return (
    <main>
      {/* ── HERO ─────────────────────────────── */}
      <section className="container section">
        <div className="hero">
          <div>
            <span className="hero__badge animate-up">La nouvelle ère de l'éducation</span>
            <h1 className="hero__title animate-up-1">
              Apprendre autrement avec <BrandHighlight>Djangou.</BrandHighlight>
            </h1>
            <p className="hero__sub animate-up-2">
              Les apprenants définissent eux-mêmes leurs objectifs et apprennent à apprendre grâce à des activités quotidiennes d'auto-évaluation et de réflexion.
            </p>
            <div className="hero__actions animate-up-3">
              <Link to="/register" className="btn btn-primary btn-lg">
                S'inscrire gratuitement
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">Découvrir les cours</Link>
            </div>
          </div>
          <div className="hero__image animate-up-2">
            <img src={eleve2} alt="Élèves qui apprennent avec Djangou" />
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────── */}
      <section className="stats">
        <div className="container">
          <div className="stats__grid">
            {STATS.map(({ target, divisor, suffix, label, orange }) => (
              <div key={label}>
                <p className={`stat__value ${orange ? 'stat__value--orange' : ''}`}>
                  <CountUp target={target} divisor={divisor} suffix={suffix} duration={1600} />
                </p>
                <p className="stat__label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="features__header">
            <h2>Tout ce dont vous avez besoin</h2>
            <p>Des outils puissants pour rendre l'apprentissage interactif, engageant et efficace.</p>
          </div>
          <div className="features__grid">
            {FEATURES.map(({ icon, title, desc, accent }) => (
              <article key={title} className="feature-card">
                <div className={`feature-card__icon ${accent ? 'feature-card__icon--orange' : ''}`}>
                  {icon}
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="container" style={{ paddingBottom: '4rem' }}>
        <div className="cta-band">
          <h2>Prêt à transformer<br />votre façon d'apprendre&nbsp;?</h2>
          <p>Rejoignez des milliers d'élèves et d'enseignants qui utilisent Djangou pour atteindre l'excellence.</p>
          <div className="cta-band__actions">
            <Link to="/register" className="btn btn-white btn-lg">Créer un compte</Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>Découvrir Djangou</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
