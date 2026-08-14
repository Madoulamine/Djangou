import { useState } from 'react'

export type RoleType = 'eleve' | 'etudiant' | 'enseignant' | 'admin'

type RoleSelectorProps = {
    selectedRole: RoleType
    onChange: (role: RoleType) => void
}

const roles = [
    {
        value: 'eleve',
        label: 'Élève',
        icon: (
            <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" />
            </svg>
        ),
    },
    {
        value: 'etudiant',
        label: 'Étudiant',
        icon: (
            <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
    },
    {
        value: 'enseignant',
        label: 'Enseignant',
        icon: (
            <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2m16-4h.01M16 11h.01M16 7h.01" />
                <circle cx="8.5" cy="7" r="4" />
            </svg>
        ),
    },
    {
        value: 'admin',
        label: 'Admin',
        icon: (
            <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M8 11h8" />
                <path d="M12 15V7" />
            </svg>
        ),
    },
] as const

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    return (
        <div className="mb-4">
            <span className="block mb-3 text-sm font-bold text-gray-800">Je suis un...</span>
            <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                    const isSelected = selectedRole === role.value
                    return (
                        <button
                            key={role.value}
                            type="button"
                            onClick={() => onChange(role.value as RoleType)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {role.icon}
                            <span className="text-sm font-semibold">{role.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
