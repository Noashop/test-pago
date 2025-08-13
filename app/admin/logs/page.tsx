"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCcw, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LogItem {
  _id: string
  type: 'payout' | 'webhook' | 'oauth'
  referenceId?: string
  supplier?: { _id: string; name?: string; email?: string }
  order?: { _id: string; orderNumber?: string }
  payout?: { _id: string; amount?: number; status?: string }
  request?: any
  response?: any
  success: boolean
  error?: string
  createdAt: string
}

export default function AdminLogsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<LogItem[]>([])

  const [type, setType] = useState<string>('all')
  const [success, setSuccess] = useState<string>('all')
  const [supplier, setSupplier] = useState('')
  const [payout, setPayout] = useState('')
  const [order, setOrder] = useState('')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState('100')

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (type !== 'all') params.set('type', type)
      if (success !== 'all') params.set('success', success)
      if (supplier) params.set('supplier', supplier)
      if (payout) params.set('payout', payout)
      if (order) params.set('order', order)
      if (q) params.set('q', q)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (limit) params.set('limit', limit)
      const res = await fetch(`/api/admin/payment-logs?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Error al cargar logs')
      const data = await res.json()
      setItems(data.logs || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudieron cargar los logs', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Queremos solo fetch inicial; no refetch por cambios en la referencia de la función
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  const okCount = useMemo(()=> items.filter(i=>i.success).length, [items])
  const failCount = useMemo(()=> items.filter(i=>!i.success).length, [items])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Auditoría de Pagos</h1>
          <p className="text-sm text-muted-foreground">Registros de Webhooks, Payouts y OAuth.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCcw className="h-4 w-4 mr-2"/>}
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filtros</CardTitle>
          <CardDescription>Filtra por tipo, estado y referencias.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Éxito</label>
              <Select value={success} onValueChange={setSuccess}>
                <SelectTrigger><SelectValue placeholder="Éxito"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Exitosos</SelectItem>
                  <SelectItem value="false">Fallidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Proveedor ID</label>
              <Input value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="ObjectId"/>
            </div>
            <div>
              <label className="text-sm font-medium">Payout ID</label>
              <Input value={payout} onChange={e=>setPayout(e.target.value)} placeholder="ObjectId"/>
            </div>
            <div>
              <label className="text-sm font-medium">Orden ID</label>
              <Input value={order} onChange={e=>setOrder(e.target.value)} placeholder="ObjectId"/>
            </div>
            <div>
              <label className="text-sm font-medium">Texto libre</label>
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Error, referenceId..."/>
            </div>
            <div>
              <label className="text-sm font-medium">Desde</label>
              <Input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Hasta</label>
              <Input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Límite</label>
              <Input value={limit} onChange={e=>setLimit(e.target.value.replace(/[^0-9]/g,''))} />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchData}>Aplicar filtros</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Exitosos</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{okCount}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fallidos</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{failCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Resultados: {items.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Éxito</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Cargando...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm">Sin resultados</TableCell></TableRow>
                ) : items.map((l)=> (
                  <TableRow key={l._id}>
                    <TableCell className="whitespace-nowrap">{new Date(l.createdAt).toLocaleString('es-AR')}</TableCell>
                    <TableCell>{l.type}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={l.referenceId || ''}>{l.referenceId || '-'}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={l.supplier?._id || ''}>
                      {l.supplier ? `${l.supplier.name || 'Sin nombre'} (${l.supplier.email || '-'})` : '-'}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate" title={l.payout?._id || ''}>{l.payout?._id || '-'}</TableCell>
                    <TableCell className="max-w-[160px] truncate" title={l.order?._id || ''}>{l.order?.orderNumber || l.order?._id || '-'}</TableCell>
                    <TableCell>{l.success ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={l.error || ''}>{l.error || '-'}</TableCell>
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
