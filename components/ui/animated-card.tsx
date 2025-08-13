'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  clickable?: boolean
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  clickable = false 
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : undefined}
      whileTap={clickable ? "tap" : undefined}
      transition={{
        delay,
        duration: 0.4,
        ease: 'easeOut',
      }}
      className={cn(
        'bg-white rounded-lg shadow-md overflow-hidden',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedContainer({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) {
  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedButton({ 
  children, 
  className,
  onClick,
  disabled = false,
  variant = 'default'
}: { 
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'success' | 'danger'
}) {
  const buttonVariants: Variants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  }

  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors'
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary/90',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  return (
    <motion.button
      variants={buttonVariants}
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}

export function AnimatedFadeIn({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay,
        duration: 0.6,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedSlideIn({ 
  children, 
  className,
  direction = 'up',
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number 
}) {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{
        delay,
        duration: 0.5,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 