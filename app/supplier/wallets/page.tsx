'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Wallet } from 'lucide-react'

interface WalletDest {
  _id?: string
  provider: 'mercadopago' | 'bank'
  alias?: string
  cbu?: string
  cvu?: string
  accountId?: string
  holderName?: string
  isPrimary?: boolean
}

export default function SupplierWalletsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wallets, setWallets] = useState<WalletDest[]>([])

  const [provider, setProvider] = useState<'mercadopago' | 'bank'>('mercadopago')
  const [alias, setAlias] = useState('')
  const [holderName, setHolderName] = useState('')
  const [cbu, setCbu] = useState('')
  const [cvu, setCvu] = useState('')
  const [accountId, setAccountId] = useState('')

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/supplier/wallets')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al cargar destinos de cobro')
      setWallets(data.wallets || [])
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudieron cargar los destinos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const resetForm = () => {
    setAlias(''); setHolderName(''); setCbu(''); setCvu(''); setAccountId('')
  }

  const handleAdd = async () => {
    try {
      setSaving(true)
      const payload: any = { provider, alias, holderName, isPrimary: wallets.length === 0 }
      if (provider === 'bank') payload.cbu = cbu
      if (provider === 'mercadopago') { payload.cvu = cvu; payload.accountId = accountId }

      const res = await fetch('/api/supplier/wallets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
      toast({ title: 'Guardado', description: 'Destino de cobro agregado' })
      setWallets(data.wallets || [])
      resetForm()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo guardar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleMakePrimary = async (walletId: string) => {
    try {
      const res = await fetch('/api/supplier/wallets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ walletId, isPrimary: true }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar')
      toast({ title: 'Actualizado', description: 'Destino establecido como principal' })
      setWallets(data.wallets || [])
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleDelete = async (walletId: string) => {
    try {
      const res = await fetch(`/api/supplier/wallets?walletId=${walletId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar')
      toast({ title: 'Eliminado', description: 'Destino de cobro eliminado' })
      setWallets(data.wallets || [])
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" /> Destinos de cobro</h1>
          <p className="text-sm text-muted-foreground">Configurá CBU/CVU o cuenta de Mercado Pago para recibir pagos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar destino</CardTitle>
              <CardDescription>Seleccioná el tipo y completá los datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Proveedor</Label>
                <Select value={provider} onValueChange={(v: 'mercadopago' | 'bank') => setProvider(v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                    <SelectItem value="bank">Banco (CBU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Alias</Label>
                  <Input value={alias} onChange={(e) => setAlias(e.target.value)} />
                </div>
                <div>
                  <Label>Titular</Label>
                  <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} />
                </div>
              </div>

              {provider === 'bank' && (
                <div>
                  <Label>CBU</Label>
                  <Input value={cbu} onChange={(e) => setCbu(e.target.value)} />
                </div>
              )}
              {provider === 'mercadopago' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CVU</Label>
                    <Input value={cvu} onChange={(e) => setCvu(e.target.value)} />
                  </div>
                  <div>
                    <Label>Account ID (opcional)</Label>
                    <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} />
                  </div>
                </div>
              )}

              <Button onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Guardar destino
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Destinos guardados</CardTitle>
              <CardDescription>Marcá uno como principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
              ) : wallets.length === 0 ? (
                <div className="text-sm text-muted-foreground">Todavía no agregaste destinos</div>
              ) : (
                wallets.map(w => (
                  <div key={w._id} className="border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{w.provider === 'bank' ? 'Banco (CBU)' : 'Mercado Pago'}</div>
                        <div className="text-muted-foreground">{w.alias || '-'}</div>
                        <div className="text-muted-foreground">Titular: {w.holderName || '-'}</div>
                        {w.provider === 'bank' && <div className="text-muted-foreground">CBU: {w.cbu || '-'}</div>}
                        {w.provider === 'mercadopago' && (
                          <>
                            <div className="text-muted-foreground">CVU: {w.cvu || '-'}</div>
                            <div className="text-muted-foreground">Account ID: {w.accountId || '-'}</div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!w.isPrimary && (
                          <Button size="sm" variant="outline" onClick={() => w._id && handleMakePrimary(w._id)}>Hacer principal</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => w._id && handleDelete(w._id)}>Eliminar</Button>
                      </div>
                    </div>
                    {w.isPrimary && <div className="mt-2 text-xs text-green-600">Principal</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
              <CardDescription>Cómo se acreditan los pagos</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>- Configurá al menos un destino de cobro y marcá uno como principal.</p>
              <p>- Los pagos se generan cuando las órdenes están pagadas y entregadas.</p>
              <p>- El administrador crea los pagos (payouts) y luego los libera.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
