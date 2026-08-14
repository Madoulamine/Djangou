type StatCardProps = {
  value: string
  label: string
  tone?: 'blue' | 'orange'
}

export function StatCard({ value, label, tone = 'blue' }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}
