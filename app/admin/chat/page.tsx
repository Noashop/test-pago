'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send, User, Package, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ChatDoc {
  _id?: string
  chatId?: string
  userId?: string
  supplierId?: string
  customerId?: string
  orderId?: {
    _id: string
    orderNumber?: string
    status?: string
    total?: number
  } | string
  lastMessage?: {
    content: string
    timestamp: string
    senderName: string
  }
  participants?: Array<{
    userId: string
    userName: string
    userRole: string
  }>
  messages?: Array<MessageDoc>
}

interface MessageDoc {
  _id?: string
  sender?: string
  senderId?: string
  senderName?: string
  senderRole?: string
  message?: string
  content?: string
  messageType?: string
  timestamp: string | Date
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Cargando chat...</div>}>
      <AdminChatPageInner />
    </Suspense>
  )
}

function AdminChatPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [chats, setChats] = useState<ChatDoc[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatDoc | null>(null)
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const chatIdForApi = (chat: ChatDoc | null) => (chat?._id || chat?.chatId || '')

  const preselectFromQuery = useCallback((list: ChatDoc[]) => {
    const openId = searchParams.get('open')
    if (!openId || list.length === 0) return
    const found = list.find(c => (c._id === openId) || (c.chatId === openId))
    if (found) {
      setSelectedChat(found)
    }
  }, [searchParams])

  const fetchChats = useCallback(async () => {
    try {
      setLoadingChats(true)
      const res = await fetch('/api/chat?limit=50&page=1')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los chats')
      setChats(data.chats || [])
      // Autoselección o preselección por query
      setSelectedChat(prev => prev || data.chats?.[0] || null)
      preselectFromQuery(data.chats || [])
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err?.message || 'Error al cargar chats', variant: 'destructive' })
    } finally {
      setLoadingChats(false)
    }
  }, [preselectFromQuery])

  const fetchMessages = useCallback(async (chat: ChatDoc | null) => {
    if (!chat) return
    const id = chatIdForApi(chat)
    if (!id) return
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/chat/${id}/messages`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar mensajes')
      // Normalizar estructura de mensajes entre diferentes formatos
      const msgs: MessageDoc[] = (data.messages || []).map((m: any) => ({
        _id: m._id,
        sender: m.sender,
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole,
        message: m.message || m.content,
        content: m.content || m.message,
        messageType: m.messageType || 'text',
        timestamp: m.timestamp,
      }))
      setMessages(msgs)
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err?.message || 'Error al cargar mensajes', variant: 'destructive' })
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchChats()
  }, [session?.user?.role, router, fetchChats])

  useEffect(() => {
    fetchMessages(selectedChat)
  }, [selectedChat, fetchMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    const id = chatIdForApi(selectedChat)
    if (!id) return
    try {
      setSending(true)
      const res = await fetch(`/api/chat/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar el mensaje')
      setNewMessage('')
      // Refresh messages
      fetchMessages(selectedChat)
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err?.message || 'Error al enviar mensaje', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat (Administrador)</h1>
        <p className="text-gray-600">Gestiona conversaciones con proveedores y clientes vinculadas a pedidos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Lista de Chats */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingChats ? (
              <div className="flex items-center justify-center h-[500px]"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {(!chats || chats.length === 0) ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay conversaciones</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={(chat._id as string) || (chat.chatId as string)}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        ((selectedChat?._id === chat._id) || (selectedChat?.chatId === chat.chatId)) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {chat.participants?.map(p => p.userName).join(' • ') || 'Conversación'}
                            </p>
                            {chat.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {new Date(chat.lastMessage.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          {chat.orderId && typeof chat.orderId !== 'string' && (
                            <div className="flex items-center gap-1 mt-1">
                              <Package className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">Pedido #{chat.orderId.orderNumber}</span>
                              {chat.orderId.status && (
                                <Badge variant="outline" className="text-xs">{chat.orderId.status}</Badge>
                              )}
                            </div>
                          )}
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">{chat.lastMessage.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de Mensajes */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Conversación</CardTitle>
                    {selectedChat.orderId && typeof selectedChat.orderId !== 'string' && (
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> Pedido #{selectedChat.orderId.orderNumber} {selectedChat.orderId.status ? `- ${selectedChat.orderId.status}` : ''}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay mensajes aún</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id as string} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${m.senderRole === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{m.senderName || 'Usuario'}</span>
                            <span className="text-xs opacity-70">{new Date(m.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm">{m.content || m.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={sending}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecciona una conversación</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
