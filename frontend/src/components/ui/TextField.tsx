import type { InputHTMLAttributes, ReactNode } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  actionIcon?: ReactNode
}

export function TextField({ label, id, icon, actionIcon, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? props.name

  return (
    <label className={`text-field relative ${className}`} htmlFor={inputId}>
      <span className="block mb-1">{label}</span>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-gray-400">
            {icon}
          </span>
        )}
        <input 
          id={inputId} 
          className={`w-full text-sm placeholder:text-gray-400 ${icon ? 'pl-9' : ''} ${actionIcon ? 'pr-9' : ''}`}
          {...props} 
        />
        {actionIcon && (
          <span className="absolute right-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            {actionIcon}
          </span>
        )}
      </div>
    </label>
  )
}
