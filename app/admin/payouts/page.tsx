"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCcw, PlayCircle, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SupplierRef { _id: string; name?: string; email?: string }
interface PayoutOrderRef { order: { _id: string; orderNumber?: string; total?: number }; amount: number }
interface PayoutItem {
  _id: string
  supplier: SupplierRef
  currency: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  attempts?: number
  lastError?: string
  lastTriedAt?: string
  paidAt?: string
  createdAt: string
  orders: PayoutOrderRef[]
}

export default function AdminPayoutsPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PayoutItem[]>([])
  const [status, setStatus] = useState<string>('')
  const [supplier, setSupplier] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const [limit, setLimit] = useState<string>('')

  const totalPending = useMemo(() => items.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0), [items])
  const totalFailed = useMemo(() => items.filter(i => i.status === 'failed').reduce((a, b) => a + b.amount, 0), [items])
  const totalPaid = useMemo(() => items.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0), [items])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (supplier) params.set('supplier', supplier)
      const res = await fetch(`/api/admin/payouts?${params.toString()}`, { 
        cache: 'no-store',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error al cargar payouts')
      const data = await res.json()
      setItems(data.payouts || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudieron cargar los payouts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Queremos solo fetch inicial; no refetch por cambios en la referencia de la función
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  const handleProcess = async () => {
    try {
      setProcessing(true)
      const body: any = { }
      if (retryFailed) body.retryFailed = true
      if (limit) body.limit = Number(limit)
      const res = await fetch('/api/admin/payouts/process', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(body) 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al procesar pagos')
      toast({ title: 'Procesamiento completado', description: `Pagados: ${data?.results?.filter((r: any)=>r.status==='paid').length ?? data?.processed ?? 0}` })
      fetchData()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo procesar', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pagos a Proveedores (Payouts)</h1>
          <p className="text-sm text-muted-foreground">Administra, filtra y procesa pagos pendientes o con error.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCcw className="h-4 w-4 mr-2"/>}
            Actualizar
          </Button>
          <Button onClick={handleProcess} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
            Procesar pagos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filtros</CardTitle>
          <CardDescription>Filtra por estado y proveedor. Opcionalmente habilita reintentos y límite de procesamiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={status || 'all'} onValueChange={(v)=> setStatus(v==='all'?'':v)}>
                <SelectTrigger><SelectValue placeholder="Estado"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="failed">Fallidos</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">ID Proveedor</label>
              <Input value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="ObjectId proveedor"/>
            </div>
            <div>
              <label className="text-sm font-medium">Reintentar fallidos</label>
              <div className="flex items-center gap-2 mt-2">
                <input id="retry" type="checkbox" checked={retryFailed} onChange={(e)=>setRetryFailed(e.target.checked)} />
                <label htmlFor="retry" className="text-sm">Incluir fallidos en el procesamiento</label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Límite a procesar</label>
              <Input value={limit} onChange={e=>setLimit(e.target.value.replace(/[^0-9]/g,''))} placeholder="Opcional"/>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Pendiente</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">${'{'}totalPending.toFixed(2){'}'} {items[0]?.currency||'ARS'}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Fallido</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">${'{'}totalFailed.toFixed(2){'}'} {items[0]?.currency||'ARS'}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Pagado</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">${'{'}totalPaid.toFixed(2){'}'} {items[0]?.currency||'ARS'}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Resultados: {items.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Último intento</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Órdenes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Cargando...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm">Sin resultados</TableCell></TableRow>
                ) : items.map((p)=> (
                  <TableRow key={p._id}>
                    <TableCell className="whitespace-nowrap">{new Date(p.createdAt).toLocaleString('es-AR')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.supplier?.name || 'Sin nombre'}</span>
                        <span className="text-xs text-muted-foreground">{p.supplier?.email}</span>
                        <span className="text-xs text-muted-foreground">{p.supplier?._id}</span>
                      </div>
                    </TableCell>
                    <TableCell>${'{'}p.amount.toFixed(2){'}'} {p.currency}</TableCell>
                    <TableCell>
                      {p.status === 'paid' && <Badge className="bg-green-600">Pagado</Badge>}
                      {p.status === 'pending' && <Badge variant="secondary">Pendiente</Badge>}
                      {p.status === 'failed' && <Badge className="bg-red-600">Fallido</Badge>}
                    </TableCell>
                    <TableCell>{p.attempts ?? 0}</TableCell>
                    <TableCell>{p.lastTriedAt ? new Date(p.lastTriedAt).toLocaleString('es-AR') : '-'}</TableCell>
                    <TableCell className="max-w-[280px] truncate" title={p.lastError || ''}>{p.lastError || '-'}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {p.orders?.slice(0,3).map((o) => (
                          <div key={o.order._id} className="flex items-center justify-between gap-2">
                            <span>#{o.order.orderNumber || o.order._id.slice(-6)}</span>
                            <span>${'{'}o.amount.toFixed(2){'}'}</span>
                          </div>
                        ))}
                        {p.orders?.length > 3 && (
                          <div className="text-muted-foreground">+{p.orders.length - 3} más</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
