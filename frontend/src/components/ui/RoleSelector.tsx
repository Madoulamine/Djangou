import type { ReactNode } from 'react'

// Extensible type — add more roles when backend supports them
export type RoleType = 'eleve' | 'enseignant'

type RoleOption = { value: RoleType; label: string; icon: ReactNode }
type RoleSelectorProps = {
    selectedRole: RoleType
    onChange: (role: RoleType) => void
}

const ROLES: RoleOption[] = [
    {
        value: 'eleve',
        label: 'Élève',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" />
            </svg>
        ),
    },
    {
        value: 'enseignant',
        label: 'Enseignant',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
            </svg>
        ),
    },
]

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    return (
        <div className="role-selector">
            <p className="role-selector__label">Je suis un…</p>
            <div className="role-grid">
                {ROLES.map(({ value, label, icon }) => (
                    <button
                        key={value}
                        type="button"
                        className={`role-btn${selectedRole === value ? ' active' : ''}`}
                        onClick={() => onChange(value)}
                    >
                        {icon}
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
