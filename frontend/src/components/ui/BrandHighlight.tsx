/**
 * BrandHighlight — reusable component that renders a coloured text span
 * with a curved SVG arc underline beneath it.
 *
 * Usage:
 *   <BrandHighlight>Djangou.</BrandHighlight>
 *   <BrandHighlight color="#f97316" arcColor="#2563eb">Nom.</BrandHighlight>
 */

interface BrandHighlightProps {
    children: React.ReactNode
    /** Text colour (default: CSS var --blue) */
    color?: string
    /** Arc stroke colour (default: CSS var --orange = #f97316) */
    arcColor?: string
}

export function BrandHighlight({
    children,
    color,
    arcColor = '#f97316',
}: BrandHighlightProps) {
    return (
        <span
            className="brand-highlight"
            style={color ? { color } : undefined}
        >
            {children}
            <svg
                className="brand-highlight__arc"
                viewBox="0 0 200 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    /* Gentle upwards arc — adjust control points to taste */
                    d="M2 12 C 50 3, 150 3, 198 12"
                    stroke={arcColor}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    )
}
