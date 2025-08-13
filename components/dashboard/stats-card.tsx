'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  change: number
  icon: LucideIcon
  trend: 'up' | 'down'
  description?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  description 
}: StatsCardProps) {
  const isPositive = change >= 0
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Badge
            variant={isPositive ? 'default' : 'destructive'}
            className={cn(
              'flex items-center space-x-1',
              isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(change)}%</span>
          </Badge>
          <span>vs mes anterior</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
