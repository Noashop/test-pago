'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Eye,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminLoader } from '@/components/ui/loaders'

interface Supplier {
  _id: string
  name: string
  email: string
  phone?: string
  businessInfo?: {
    businessName: string
    businessType: string
    taxId: string
    description?: string
    website?: string
    logo?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
    }
  }
  isApproved: boolean
  approvalDate?: Date
  approvedBy?: {
    adminId: string
    adminName: string
    approvedAt: Date
  }
  rejectionReason?: string
  createdAt: Date
}

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/suppliers', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setSuppliers(data.suppliers)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar los proveedores',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Manejo de autenticación y redirecciones
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'admin') {
      router.push('/')
      return
    }

    // Cargar proveedores tras validar acceso
    fetchSuppliers()
  }, [session, status, router, fetchSuppliers])

  const handleApproval = async (supplierId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/admin/suppliers/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          supplierId,
          action,
          reason
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: data.message,
        })
        fetchSuppliers() // Recargar la lista
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar la solicitud',
        variant: 'destructive',
      })
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.businessInfo?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !supplier.isApproved) ||
                         (filter === 'approved' && supplier.isApproved) ||
                         (filter === 'rejected' && !supplier.isApproved && supplier.rejectionReason)

    return matchesSearch && matchesFilter
  })

  if (status === 'loading' || loading) {
    return <AdminLoader />
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const pendingCount = suppliers.filter(s => !s.isApproved).length
  const approvedCount = suppliers.filter(s => s.isApproved).length
  const rejectedCount = suppliers.filter(s => !s.isApproved && s.rejectionReason).length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestión de Proveedores
          </h1>
          <p className="text-muted-foreground">
            Aprueba y gestiona las cuentas de proveedores
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">
                Proveedores registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Esperando aprobación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">
                Proveedores activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes rechazadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              Aprobados
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilter('rejected')}
            >
              Rechazados
            </Button>
          </div>
        </div>

        {/* Lista de proveedores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription>{supplier.email}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      supplier.isApproved ? 'default' : 
                      supplier.rejectionReason ? 'destructive' : 'secondary'
                    }
                  >
                    {supplier.isApproved ? 'Aprobado' : 
                     supplier.rejectionReason ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del negocio */}
                {supplier.businessInfo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{supplier.businessInfo.businessName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.businessInfo.businessType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">CUIT: {supplier.businessInfo.taxId}</span>
                    </div>
                    {supplier.businessInfo.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supplier.businessInfo.website}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha de registro */}
                <div className="text-xs text-muted-foreground">
                  Registrado: {new Date(supplier.createdAt).toLocaleDateString('es-AR')}
                </div>

                {/* Información de aprobación */}
                {supplier.isApproved && supplier.approvedBy && (
                  <div className="text-xs text-muted-foreground">
                    Aprobado por: {supplier.approvedBy.adminName} el {new Date(supplier.approvalDate!).toLocaleDateString('es-AR')}
                  </div>
                )}

                {supplier.rejectionReason && (
                  <div className="text-xs text-destructive">
                    Rechazado: {supplier.rejectionReason}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Aquí iría la lógica para ver detalles completos
                      toast({
                        title: 'Detalles',
                        description: 'Funcionalidad de detalles próximamente',
                      })
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  
                  {!supplier.isApproved && !supplier.rejectionReason && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(supplier._id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Razón del rechazo:')
                          if (reason) {
                            handleApproval(supplier._id, 'reject', reason)
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No se encontraron proveedores
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay proveedores que coincidan con los filtros'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 