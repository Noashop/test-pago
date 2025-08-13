'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Download,
  Calendar,
  Package,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Invoice {
  _id: string
  invoiceNumber: string
  period: {
    startDate: string
    endDate: string
  }
  subtotal: number
  commission: number
  totalPayment: number
  status: string
  paymentMethod: string
  paymentDate?: string
  createdAt: string
}

interface WalletStats {
  totalEarnings: number
  pendingPayments: number
  paidAmount: number
  commissionPaid: number
  recentTransactions: Array<{
    _id: string
    type: 'payment' | 'commission'
    amount: number
    description: string
    date: string
  }>
}

export default function SupplierBillingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role !== 'supplier') {
      router.push('/auth/login')
      return
    }
    fetchBillingData()
  }, [session, router])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const [invoicesResponse, statsResponse] = await Promise.all([
        fetch('/api/supplier/invoices'),
        fetch('/api/supplier/wallet-stats')
      ])

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setWalletStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast({
        title: "Error",
        description: "Error al cargar datos de facturación",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'approved':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Facturación y Billetera
        </h1>
        <p className="text-gray-600">
          Gestiona tus facturas y pagos
        </p>
      </div>

      {/* Wallet Stats */}
      {walletStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(walletStats.totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(walletStats.pendingPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                En proceso de aprobación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(walletStats.paidAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagos completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(walletStats.commissionPaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Comisiones de la plataforma
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      {walletStats?.recentTransactions && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletStats.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'payment' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'payment' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'payment' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mis Facturas
          </CardTitle>
          <CardDescription>
            Historial de facturas y pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay facturas generadas</p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(invoice.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.period.startDate).toLocaleDateString()} - {new Date(invoice.period.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(invoice.totalPayment)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Comisión: {formatCurrency(invoice.commission)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 