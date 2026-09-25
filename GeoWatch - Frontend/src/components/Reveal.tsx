import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
}

function Reveal({ children, className = '', delay = 0, direction = 'up' }: RevealProps) {
  const offset =
    direction === 'left'
      ? { x: -32, y: 0 }
      : direction === 'right'
        ? { x: 32, y: 0 }
        : direction === 'none'
          ? { x: 0, y: 0 }
          : { x: 0, y: 28 }

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default Reveal