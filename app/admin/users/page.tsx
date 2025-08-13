'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building
} from 'lucide-react'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  isApproved: boolean
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  businessInfo?: {
    businessName: string
    businessType: string
    taxId: string
  }
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface UserStats {
  total: number
  active: number
  pending: number
  suppliers: number
  customers: number
  admins: number
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, pending: 0, suppliers: 0, customers: 0, admins: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailsDialog, setDetailsDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    isApproved: false
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.role !== 'all') params.append('role', filters.role)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setStats(data.stats)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar usuarios',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

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

    fetchUsers()
  }, [session, status, router, fetchUsers])

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      setActionLoading(userId)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          userId,
          action,
          ...data
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: result.message
        })
        fetchUsers()
        if (action === 'update') {
          setEditDialog(false)
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al actualizar usuario',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al procesar la acción',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(selectedUser._id)
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          userId: selectedUser._id
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: result.message
        })
        fetchUsers()
        setDeleteDialog(false)
        setSelectedUser(null)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al eliminar usuario',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar usuario',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openDetailsDialog = (user: User) => {
    setSelectedUser(user)
    setDetailsDialog(true)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      isApproved: user.isApproved
    })
    setEditDialog(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialog(true)
  }

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { color: 'bg-purple-100 text-purple-800', icon: Shield, label: 'Administrador' },
      supplier: { color: 'bg-blue-100 text-blue-800', icon: Building, label: 'Proveedor' },
      customer: { color: 'bg-green-100 text-green-800', icon: Users, label: 'Cliente' }
    }
    
    const config = configs[role as keyof typeof configs] || configs.customer
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <UserX className="h-3 w-3 mr-1" />
          Pendiente Aprobación
        </Badge>
      )
    }

    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: UserCheck, label: 'Activo' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: UserX, label: 'Inactivo' },
      suspended: { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Suspendido' }
    }
    
    const config = configs[status as keyof typeof configs] || configs.active
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-2">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <UserX className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Por aprobar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suppliers}</div>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Compradores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select 
                value={filters.role} 
                onValueChange={(value) => setFilters({ ...filters, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="supplier">Proveedores</SelectItem>
                  <SelectItem value="customer">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button 
                onClick={() => setFilters({ role: 'all', status: 'all', search: '' })}
                variant="outline" 
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
              <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <CardTitle className="flex items-center gap-2">
                        {user.name}
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status, user.isApproved)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Registrado: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {user.lastLogin && (
                      <p className="text-xs text-gray-400">
                        Último acceso: {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{user.address.city}, {user.address.state}</span>
                        </div>
                      )}
                    </div>
                    
                    {user.businessInfo && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span>{user.businessInfo.businessName}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.businessInfo.businessType} - {user.businessInfo.taxId}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailsDialog(user)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>

                    {!user.isApproved && (
                      <Button 
                        size="sm"
                        onClick={() => handleUserAction(user._id, 'approve')}
                        disabled={actionLoading === user._id}
                      >
                        {actionLoading === user._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Aprobar
                      </Button>
                    )}

                    {user.status === 'active' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="bg-yellow-50 hover:bg-yellow-100"
                        onClick={() => handleUserAction(user._id, 'suspend')}
                        disabled={actionLoading === user._id}
                      >
                        {actionLoading === user._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4 mr-2" />
                        )}
                        Suspender
                      </Button>
                    )}

                    {user.status === 'suspended' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100"
                        onClick={() => handleUserAction(user._id, 'activate')}
                        disabled={actionLoading === user._id}
                      >
                        {actionLoading === user._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Activar
                      </Button>
                    )}

                    {user.role !== 'admin' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100"
                        onClick={() => openDeleteDialog(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="supplier">Proveedor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="approved"
                  checked={editForm.isApproved}
                  onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.checked })}
                />
                <Label htmlFor="approved" className="text-sm">
                  Usuario aprobado
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser) {
                  handleUserAction(selectedUser._id, 'update', editForm)
                }
              }}
              disabled={actionLoading === selectedUser?._id}
            >
              {actionLoading === selectedUser?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedUser.phone || 'No especificado'}</p>
                </div>
                <div>
                  <Label>Rol</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status, selectedUser.isApproved)}</div>
                </div>
                <div>
                  <Label>Fecha de Registro</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedUser.address && (
                <div>
                  <Label>Dirección</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                    {selectedUser.address.street}<br />
                    {selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}
                  </p>
                </div>
              )}

              {selectedUser.businessInfo && (
                <div>
                  <Label>Información Comercial</Label>
                  <div className="text-sm mt-1 p-3 bg-gray-50 rounded space-y-1">
                    <p><strong>Empresa:</strong> {selectedUser.businessInfo.businessName}</p>
                    <p><strong>Tipo:</strong> {selectedUser.businessInfo.businessType}</p>
                    <p><strong>CUIT/RUC:</strong> {selectedUser.businessInfo.taxId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario {selectedUser?.name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading === selectedUser?._id}
            >
              {actionLoading === selectedUser?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}