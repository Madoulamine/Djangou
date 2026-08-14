type FeatureCardProps = {
  accent?: 'blue' | 'orange'
  title: string
  description: string
}

export function FeatureCard({
  accent = 'blue',
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className={`feature-card feature-card--${accent}`}>
      <span className="feature-card__icon" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}
