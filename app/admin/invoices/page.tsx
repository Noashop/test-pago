'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  DollarSign,
  Calendar,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Invoice {
  _id: string
  invoiceNumber: string
  supplierId: {
    _id: string
    name: string
    email: string
    businessInfo?: {
      businessName: string
    }
  }
  supplierName: string
  period: {
    startDate: string
    endDate: string
  }
  items: Array<{
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    commission: number
    supplierPayment: number
  }>
  subtotal: number
  commission: number
  totalPayment: number
  status: string
  paymentMethod: string
  paymentDate?: string
  createdAt: string
}

interface Supplier {
  _id: string
  name: string
  email: string
  businessInfo?: {
    businessName: string
  }
}

export default function AdminInvoicesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: '',
    startDate: '',
    endDate: '',
    paymentMethod: 'bank_transfer'
  })

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchInvoices()
    fetchSuppliers()
  }, [session, router])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/invoices', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setInvoices(data.invoices)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Error",
        description: "Error al cargar facturas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setSuppliers(data.suppliers)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Factura generada exitosamente",
        })
        setIsDialogOpen(false)
        setFormData({
          supplierId: '',
          startDate: '',
          endDate: '',
          paymentMethod: 'bank_transfer'
        })
        fetchInvoices()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast({
        title: "Error",
        description: "Error al generar factura",
        variant: "destructive"
      })
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
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
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
          Gestión de Facturas
        </h1>
        <p className="text-gray-600">
          Genera y gestiona facturas para proveedores
        </p>
      </div>

      {/* Generate Invoice Button */}
      <div className="mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generar Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generar Nueva Factura</DialogTitle>
              <DialogDescription>
                Selecciona el proveedor y período para generar la factura
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Proveedor</label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({...formData, supplierId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.businessInfo?.businessName || supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Método de Pago</label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Generar Factura
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay facturas generadas</p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(invoice.status)}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {invoice.invoiceNumber}
                        {getStatusBadge(invoice.status)}
                      </CardTitle>
                      <CardDescription>
                        {invoice.supplierName} • {new Date(invoice.period.startDate).toLocaleDateString()} - {new Date(invoice.period.endDate).toLocaleDateString()}
                      </CardDescription>
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
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subtotal:</span>
                    <span className="ml-2">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Comisión:</span>
                    <span className="ml-2">{formatCurrency(invoice.commission)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Pago Proveedor:</span>
                    <span className="ml-2">{formatCurrency(invoice.totalPayment)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  {invoice.status === 'pending' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar Pago
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 