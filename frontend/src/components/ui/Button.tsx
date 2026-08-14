import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type BaseButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type ButtonProps = BaseButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never
  }

type ButtonLinkProps = BaseButtonProps & {
  to: string
}

function getButtonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `ui-button ui-button--${variant} ui-button--${size} ${className}`
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button className={getButtonClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  to,
}: ButtonLinkProps) {
  return (
    <Link to={to} className={getButtonClass(variant, size, className)}>
      {children}
    </Link>
  )
}
