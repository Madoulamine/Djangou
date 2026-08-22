import pdgImg from '../../../assets/images/pdg.jpeg'
import bahImg from '../../../assets/images/bah.jpeg'
import yassineImg from '../../../assets/images/yassine.jpeg'

type Founder = {
    name: string
    title: string
    stack: string[]
    bio: string
    image: string
}

const FOUNDERS: Founder[] = [
    {
        name: 'Mamadou Lamine Diallo',
        title: 'PDG — Dev Fullstack & Mobile',
        stack: ['Python', 'Django', 'Node.js', 'React', 'TypeScript', 'Machine Learning'],
        bio: "Fondateur et President de Djangou, diplome en 2026. Passionne par l'education numerique en Afrique, il pilote la vision technologique et strategique de la plateforme.",
        image: pdgImg,
    },
    {
        name: 'Boubacar Bah',
        title: 'Dev Fullstack, IA & Data',
        stack: ['Node.js', 'React', 'Python', 'IA', 'Data Science'],
        bio: "Chef de service cyber chez OneGuinea et developpeur backend chez Elitech. Expert en intelligence artificielle et securite informatique, il renforce l'infrastructure de Djangou.",
        image: bahImg,
    },
    {
        name: 'Mamadou Yassine Diallo',
        title: 'Dev Fullstack',
        stack: ['PHP', 'Laravel', 'Node.js', 'React', 'Bootstrap'],
        bio: "Developpeur Fullstack diplome en 2026. Specialise dans la conception d'interfaces modernes et de services backend robustes pour la plateforme Djangou.",
        image: yassineImg,
    },
]

function FounderCard({ founder }: { founder: Founder }) {
    return (
        <article className="founder-card-alt">
            <div className="founder-card-alt__header">
                <img
                    src={founder.image}
                    alt={founder.name}
                    className="founder-card-alt__avatar"
                    loading="lazy"
                />
                <div className="founder-card-alt__title-group">
                    <h3 className="founder-card-alt__name">{founder.name}</h3>
                    <p className="founder-card-alt__title-role">{founder.title}</p>
                </div>
            </div>
            <div className="founder-card-alt__body">
                <p className="founder-card-alt__bio">{founder.bio}</p>
                <div className="founder-card-alt__stack">
                    {founder.stack.map(tech => (
                        <span key={tech} className="tech-badge">{tech}</span>
                    ))}
                </div>
            </div>
        </article>
    )
}

export function FondateursPage() {
    return (
        <main>
            {/* ── Hero header ── */}
            <section className="founders-hero section">
                <div className="container">
                    <div className="founders-hero__heading">
                        <h1 className="founders-hero__title">
                            LES FONDATEURS DE{' '}
                            <span className="founders-hero__brand">DJANGOU</span>
                        </h1>
                        <p className="founders-hero__desc">
                            Trois développeurs guinéens unis pour rendre l'excellence
                            académique accessible à <br />
                            chaque élève en Afrique.
                        </p>
                    </div>

                    {/* Triangle layout — juste sous le paragraphe */}
                    <div className="founders-triangle">
                        <div className="founders-triangle__top">
                            <FounderCard founder={FOUNDERS[0]} />
                        </div>
                        <div className="founders-triangle__bottom">
                            <FounderCard founder={FOUNDERS[1]} />
                            <FounderCard founder={FOUNDERS[2]} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission quote */}
            <section className="founders-quote section">
                <div className="container">
                    <blockquote className="founders-quote__block">
                        <p>"Notre mission : rendre l'excellence academique accessible a chaque eleve guineen, ou qu'il soit."</p>
                        <cite>— L'equipe Djangou</cite>
                    </blockquote>
                </div>
            </section>
        </main>
    )
}
