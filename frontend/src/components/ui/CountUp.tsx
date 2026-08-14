/**
 * CountUp — reusable animated counter component.
 *
 * Triggers when scrolled into view (IntersectionObserver).
 * Automatically parses suffix/multiplier from display strings like "15k+", "95%".
 *
 * Usage:
 *   <CountUp target={15000} suffix="k+" duration={1600} />
 *   <CountUp target={95} suffix="%" />
 */

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
    /** Final numeric value to count up to */
    target: number
    /** String appended after the number, e.g. "k+", "%" */
    suffix?: string
    /** Animation duration in ms (default: 1500) */
    duration?: number
    /** Display as divided by this value (e.g. 15000 ÷ 1000 → "15") */
    divisor?: number
}

export function CountUp({
    target,
    suffix = '',
    duration = 1500,
    divisor = 1,
}: CountUpProps) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const startTime = performance.now()
                    const displayTarget = target / divisor

                    const tick = (now: number) => {
                        const elapsed = now - startTime
                        const progress = Math.min(elapsed / duration, 1)
                        // Ease-out cubic for a snappy feel
                        const eased = 1 - Math.pow(1 - progress, 3)
                        setCount(Math.round(eased * displayTarget))
                        if (progress < 1) requestAnimationFrame(tick)
                    }
                    requestAnimationFrame(tick)
                }
            },
            { threshold: 0.3 }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [target, duration, divisor])

    return (
        <span ref={ref}>
            {count}
            {suffix}
        </span>
    )
}
