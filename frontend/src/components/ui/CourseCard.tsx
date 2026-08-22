import { useNavigate } from 'react-router-dom'

export type Course = {
    id: number
    title: string
    subject: string
    level: string
    rating: number
    students: number
    image: string     // URL or import
    description?: string
}

type CourseCardProps = {
    course: Course
    compact?: boolean  // horizontal compact layout (for carousel)
}

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="course-card__rating">
            {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
            <span>{rating.toFixed(1)}</span>
        </span>
    )
}

export function CourseCard({ course, compact = false }: CourseCardProps) {
    const navigate = useNavigate()

    const handleView = () => {
        // Public gate: redirect to login to see course
        navigate('/login')
    }

    return (
        <article className={`course-card${compact ? ' course-card--compact' : ''}`}>
            <div className="course-card__image-wrap">
                <img src={course.image} alt={course.title} className="course-card__image" loading="lazy" />
                <span className="course-card__badge">{course.subject}</span>
            </div>
            <div className="course-card__body">
                <span className="course-card__level">{course.level}</span>
                <h3 className="course-card__title">{course.title}</h3>
                {course.description && !compact && (
                    <p className="course-card__desc">{course.description}</p>
                )}
                <div className="course-card__meta">
                    <StarRating rating={course.rating} />
                    <span className="course-card__students">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" /></svg>
                        {course.students.toLocaleString()}
                    </span>
                </div>
                <button className="btn btn-primary btn-sm course-card__cta" onClick={handleView}>
                    Voir le cours →
                </button>
            </div>
        </article>
    )
}
