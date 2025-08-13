'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, RotateCcw, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WHEEL_PRIZES } from '@/constants'

interface WheelState {
  spinsAvailable: number
  totalSpins: number
  totalPrizes: number
  canSpinDaily: boolean
  recentSpins: any[]
  unusedSpins: number
}

interface Prize {
  label: string
  type: string
  value: number
  description: string
}

export default function Wheel() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [wheelState, setWheelState] = useState<WheelState | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState<Prize | null>(null)
  const [showPrize, setShowPrize] = useState(false)

  // Fetch wheel state
  useEffect(() => {
    if (session?.user?.id) {
      fetchWheelState()
    }
  }, [session])

  const fetchWheelState = async () => {
    try {
      const response = await fetch('/api/roulette')
      if (response.ok) {
        const data = await response.json()
        setWheelState(data.data)
      }
    } catch (error) {
      console.error('Error fetching wheel state:', error)
    }
  }

  const spinWheel = async () => {
    if (!wheelState || wheelState.spinsAvailable <= 0 || isSpinning) {
      toast({
        title: 'No puedes girar',
        description: 'No tienes giros disponibles',
        variant: 'destructive'
      })
      return
    }

    setIsSpinning(true)
    
    // Random rotation between 5-10 full rotations
    const spins = 5 + Math.random() * 5
    const finalRotation = rotation + (spins * 360)
    
    // Animate rotation
    const animate = () => {
      setRotation(prev => {
        const newRotation = prev + 20
        if (newRotation < finalRotation) {
          requestAnimationFrame(animate)
        } else {
          // Stop spinning and get prize
          setTimeout(() => {
            getPrize()
          }, 500)
        }
        return newRotation
      })
    }
    
    animate()
  }

  const getPrize = async () => {
    try {
      const response = await fetch('/api/roulette', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setWonPrize(data.data.prize)
        setShowPrize(true)
        fetchWheelState() // Refresh state
        
        toast({
          title: '¡Felicidades!',
          description: `Ganaste: ${data.data.prize.label}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al girar la ruleta',
        variant: 'destructive'
      })
    } finally {
      setIsSpinning(false)
    }
  }

  const closePrize = () => {
    setShowPrize(false)
    setWonPrize(null)
  }

  if (!session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Ruleta de Premios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">
            Inicia sesión para participar en la ruleta
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Wheel State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Ruleta de Premios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wheelState && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {wheelState.spinsAvailable}
                </p>
                <p className="text-sm text-gray-600">Giros Disponibles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">
                  {wheelState.totalPrizes}
                </p>
                <p className="text-sm text-gray-600">Premios Ganados</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={spinWheel}
            disabled={!wheelState || wheelState.spinsAvailable <= 0 || isSpinning}
            className="w-full"
            size="lg"
          >
            {isSpinning ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Girando...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                ¡Girar Ruleta!
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Wheel Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="relative w-64 h-64 mx-auto">
            {/* Wheel */}
            <div 
              className="w-full h-full rounded-full border-4 border-primary relative overflow-hidden transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Prize Segments */}
              {Object.entries(WHEEL_PRIZES).map(([key, prize], index) => {
                const angle = (360 / Object.keys(WHEEL_PRIZES).length) * index
                const segmentAngle = 360 / Object.keys(WHEEL_PRIZES).length
                
                return (
                  <div
                    key={key}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos((segmentAngle * Math.PI) / 180) * 50}% ${50 - Math.sin((segmentAngle * Math.PI) / 180) * 50}%)`
                    }}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center text-xs font-medium text-white"
                      style={{
                        background: index % 2 === 0 ? 'var(--primary)' : 'var(--accent)',
                        transform: `rotate(${-angle}deg)`
                      }}
                    >
                      {prize.label}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Center pointer */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-red-500"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Spins */}
      {wheelState?.recentSpins && wheelState.recentSpins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Giros Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wheelState.recentSpins.slice(0, 3).map((spin, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{spin.prizeLabel}</span>
                  <Badge variant={spin.isUsed ? "secondary" : "default"}>
                    {spin.isUsed ? "Usado" : "Disponible"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prize Modal */}
      {showPrize && wonPrize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                ¡Felicidades!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-bold">{wonPrize.label}</h3>
              <p className="text-gray-600">{wonPrize.description}</p>
              <Button onClick={closePrize} className="w-full">
                ¡Genial!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 