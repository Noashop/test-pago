'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProductPerformance {
  name: string
  sales: number
  revenue: number
  views: number
}

interface ProductPerformanceChartProps {
  data: ProductPerformance[]
}

const COLORS = ['#73A8B3', '#E07A5F', '#8884d8', '#82ca9d', '#ffc658']

export function ProductPerformanceChart({ data }: ProductPerformanceChartProps) {
  const chartData = data.slice(0, 5).map((product, index) => ({
    ...product,
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    color: COLORS[index % COLORS.length]
  }))

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            Ventas: {data.sales} unidades
          </p>
          <p className="text-sm text-muted-foreground">
            Ingresos: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-muted-foreground">
            Visualizaciones: {data.views.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento de Productos</CardTitle>
        <CardDescription>
          Top 5 productos por ventas y visualizaciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-muted-foreground"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-muted-foreground"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Performance Summary */}
        <div className="mt-4 space-y-2">
          {chartData.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: product.color }}
                />
                <span className="truncate max-w-[120px]">{product.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{product.sales} ventas</div>
                <div className="text-muted-foreground text-xs">
                  {product.views} vistas
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
