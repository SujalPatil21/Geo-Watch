import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CounterProps {
  value: number
  duration?: number
  decimals?: number
  className?: string
}

function Counter({ value, duration = 1.2, decimals = 0, className = '' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) {
      return
    }

    let frame = 0
    const start = performance.now()
    const factor = 10 ** decimals

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value * factor) / factor)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, duration, decimals])

  return (
    <span ref={ref} className={className}>
      {decimals > 0 ? display.toFixed(decimals) : display}
    </span>
  )
}

export default Counter