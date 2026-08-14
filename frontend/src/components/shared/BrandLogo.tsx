import logo from '../../assets/images/logo.png'
import icon from '../../assets/icons/icon.png'

type BrandLogoProps = {
  variant?: 'full' | 'mark'
  className?: string
}

export function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  const image = variant === 'full' ? logo : icon
  const label = variant === 'full' ? 'Djangou' : 'Djangou icon'

  return (
    <img
      src={image}
      alt={label}
      className={`brand-logo brand-logo--${variant} ${className}`}
    />
  )
}
