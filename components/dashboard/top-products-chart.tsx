'use client'

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

interface TopProductsChartProps {
  data: TopProduct[]
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#ff00ff'
]

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = data.slice(0, 8).map((product, index) => ({
    ...product,
    color: COLORS[index % COLORS.length]
  }))

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Ventas: {data.sales} unidades
          </p>
          <p className="text-sm text-muted-foreground">
            Ingresos: {formatCurrency(data.revenue)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>
          Top productos por cantidad de ventas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="sales"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Product List */}
        <div className="mt-4 space-y-2">
          {chartData.slice(0, 5).map((product, index) => (
            <div key={product.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: product.color }}
                />
                <span className="truncate max-w-[150px]">{product.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{product.sales} ventas</div>
                <div className="text-muted-foreground">
                  {formatCurrency(product.revenue)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
