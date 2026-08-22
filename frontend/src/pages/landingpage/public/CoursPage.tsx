import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '../../../components/ui/SectionHeading'
import { CourseCard, type Course } from '../../../components/ui/CourseCard'

// Sample course data - replace with API calls later
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80'

const COURSES: Course[] = [
    { id: 9, title: 'Intelligence Artificielle & Machine Learning', subject: 'IA & Data', level: 'Superieur', rating: 5.0, students: 4500, image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80', description: "Decouvrez les fondements des reseaux de neurones et construisez vos propres modeles IA." },
    { id: 1, title: 'Suites et Limites de fonctions', subject: 'Mathematiques', level: 'Terminale', rating: 4.8, students: 1240, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80', description: "Maitrisez les suites numeriques et les limites de fonctions pour reussir votre bac." },
    { id: 2, title: 'Optique Geometrique : Lentilles', subject: 'Physique', level: 'Terminale', rating: 4.5, students: 870, image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&q=80', description: "Comprenez la formation des images a travers les lentilles convergentes et divergentes." },
    { id: 3, title: "L'Analyse Litteraire du XIXe", subject: 'Francais', level: '1ere', rating: 4.6, students: 2100, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80', description: "Decouvrez les grands auteurs du XIXe et apprenez a analyser leurs oeuvres." },
    { id: 4, title: 'Empires et Royaumes medievaux', subject: 'Histoire', level: '3eme', rating: 4.7, students: 3120, image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&q=80', description: "Explorez les grandes civilisations et empires qui ont faconne notre monde." },
    { id: 5, title: 'Genetique et Heredite', subject: 'Sciences', level: 'Terminale', rating: 4.9, students: 980, image: PLACEHOLDER_IMG, description: "Apprenez les mecanismes de transmission des caracteres hereditaires." },
    { id: 6, title: 'Equations du Second Degre', subject: 'Mathematiques', level: '2nde', rating: 4.4, students: 1560, image: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=600&q=80', description: "Resolvez les equations du second degre avec aisance." },
    { id: 7, title: 'La Revolution Francaise', subject: 'Histoire', level: '4eme', rating: 4.8, students: 2400, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', description: "Plongez dans les evenements qui ont change le cours de l'histoire mondiale." },
    { id: 8, title: "Electricite et Circuits", subject: 'Physique', level: '1ere', rating: 4.3, students: 720, image: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=600&q=80', description: "Comprenez les lois fondamentales de l'electricite et des circuits." },
]

const SUBJECTS = ['Tous', 'IA & Data', 'Mathematiques', 'Physique', 'Francais', 'Histoire', 'Sciences']

// Carousel Component - reusable for other sections
function CoursesCarousel({ courses }: { courses: Course[] }) {
    const ref = useRef<HTMLDivElement>(null)
    const scroll = (dir: 'left' | 'right') => {
        ref.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
    }
    return (
        <div className="courses-carousel-wrap">
            <button className="carousel-nav carousel-nav--left" onClick={() => scroll('left')} aria-label="Precedent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="courses-carousel" ref={ref}>
                {courses.map(course => (
                    <CourseCard key={course.id} course={course} compact />
                ))}
            </div>
            <button className="carousel-nav carousel-nav--right" onClick={() => scroll('right')} aria-label="Suivant">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
        </div>
    )
}

export function CoursPage() {
    const [activeSubject, setActiveSubject] = useState('Tous')
    const [showAll, setShowAll] = useState(false)

    const filtered = activeSubject === 'Tous'
        ? COURSES
        : COURSES.filter(c => c.subject === activeSubject)

    return (
        <main>
            {/* Hero */}
            <section className="courses-hero">
                <div className="container">
                    <div className="courses-hero__grid">
                        <div className="courses-hero__content">
                            <span className="courses-hero__eyebrow">Plateforme educative</span>
                            <h1 className="courses-hero__title">Apprenez a votre rythme,<br />progressez sans limites.</h1>
                            <p className="courses-hero__sub">
                                Des centaines de cours concus par des enseignants certifies pour les classes de 6eme a Terminale.
                            </p>
                            <div className="courses-hero__actions">
                                <Link to="/register" className="btn btn-primary btn-lg">Commencer gratuitement &rarr;</Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">Se connecter</Link>
                            </div>
                            <div className="courses-hero__stats">
                                <div className="hero-stat-item">
                                    <span className="stat-val">500+</span>
                                    <span className="stat-lbl">Cours en ligne</span>
                                </div>
                                <div className="hero-stat-item">
                                    <span className="stat-val">12k+</span>
                                    <span className="stat-lbl">Eleves actifs</span>
                                </div>
                                <div className="hero-stat-item">
                                    <span className="stat-val">4.8/5</span>
                                    <span className="stat-lbl">Satisfaction</span>
                                </div>
                            </div>
                        </div>
                        <div className="courses-hero__image">
                            <img src="/hero_cours_generated.png" alt="Apprentissage en ligne" className="animate-up" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter + Carousel */}
            <section className="section">
                <div className="container">
                    <SectionHeading
                        eyebrow="Catalogue"
                        title="Cours en vedette"
                        description="Naviguez par matiere et decouvrez les cours les mieux notes par nos eleves."
                    />

                    <div className="filter-pills">
                        {SUBJECTS.map(subject => (
                            <button
                                key={subject}
                                className={`filter-pill${activeSubject === subject ? ' active' : ''}`}
                                onClick={() => { setActiveSubject(subject); setShowAll(false) }}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>

                    <CoursesCarousel courses={filtered} />

                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <button
                            style={{ color: 'var(--blue)', fontSize: '1.25rem', fontWeight: '800', background: 'transparent', border: 'none', padding: '1rem', cursor: 'pointer' }}
                            onClick={() => setShowAll(v => !v)}
                        >
                            {showAll ? 'Voir moins \u2191' : `Voir tous les cours (${filtered.length}) \u2193`}
                        </button>
                    </div>

                    {showAll && (
                        <div className="courses-grid" style={{ marginTop: '2rem' }}>
                            {filtered.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="container">
                    <div className="cta-band">
                        <h2>Pret a commencer votre parcours ?</h2>
                        <p>Rejoignez des milliers d'eleves et d'enseignants sur Djangou et transformez votre apprentissage.</p>
                        <div className="cta-band__actions">
                            <Link to="/register" className="btn btn-primary btn-lg">Creer un compte gratuit</Link>
                            <Link to="/login" className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}>
                                Se connecter
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
