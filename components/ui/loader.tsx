'use client'

import { useState, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'

interface LoaderProps {
  icons: Array<{
    icon: LucideIcon
    color: string
    label: string
  }>
  message: string
  className?: string
}

export function Loader({ icons, message, className = '' }: LoaderProps) {
  const [currentIconIndex, setCurrentIconIndex] = useState(0)
  const [isExpanding, setIsExpanding] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExpanding(true)
      
      setTimeout(() => {
        setIsExpanding(false)
        setCurrentIconIndex((prev) => (prev + 1) % icons.length)
      }, 500)
    }, 1000)

    return () => clearInterval(interval)
  }, [icons.length])

  const currentIcon = icons[currentIconIndex]

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <div className="relative mb-4">
        {/* Círculo de fondo */}
        <div className={`w-16 h-16 rounded-full ${currentIcon.color} flex items-center justify-center transition-all duration-500 ${
          isExpanding ? 'scale-125' : 'scale-100'
        }`}>
          <currentIcon.icon className="w-8 h-8 text-white" />
        </div>
        
        {/* Círculos pequeños alrededor */}
        {icons.map((icon, index) => (
          <div
            key={index}
            className={`absolute w-4 h-4 rounded-full ${icon.color} flex items-center justify-center transition-all duration-300 ${
              index === currentIconIndex && isExpanding ? 'scale-150' : 'scale-100'
            }`}
            style={{
              top: `${50 + 30 * Math.cos((index * 2 * Math.PI) / icons.length)}%`,
              left: `${50 + 30 * Math.sin((index * 2 * Math.PI) / icons.length)}%`,
              transform: `translate(-50%, -50%) ${index === currentIconIndex && isExpanding ? 'scale(1.5)' : 'scale(1)'}`,
            }}
          >
            <icon.icon className="w-2 h-2 text-white" />
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700 mb-2">
          {message}
        </p>
        <p className="text-sm text-gray-500">
          {currentIcon.label}
        </p>
      </div>
    </div>
  )
} 