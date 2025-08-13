'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  User, 
  Package,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Chat {
  _id: string
  chatId: string
  participants: Array<{
    userId: string
    userName: string
    userRole: string
  }>
  chatType: string
  orderId?: {
    _id: string
    orderNumber: string
    total: number
    status: string
  }
  lastMessage?: {
    content: string
    timestamp: string
    senderName: string
  }
  messages: Array<{
    _id: string
    senderId: string
    senderName: string
    senderRole: string
    content: string
    messageType: string
    timestamp: string
    isRead: boolean
  }>
  createdAt: string
}

export default function SupplierChatPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chat?type=customer_supplier')
      const data = await response.json()

      if (response.ok) {
        setChats(data.chats)
        if (data.chats.length > 0 && !selectedChat) {
          setSelectedChat(data.chats[0])
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
      toast({
        title: "Error",
        description: "Error al cargar chats",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [selectedChat])

  useEffect(() => {
    if (session?.user?.role !== 'supplier') {
      router.push('/auth/login')
      return
    }
    fetchChats()
  }, [session, router, fetchChats])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    try {
      setSending(true)
      const response = await fetch(`/api/chat/${selectedChat.chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchChats() // Refresh chats to get updated messages
      } else {
        throw new Error('Error sending message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Error al enviar mensaje",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCustomerName = (chat: Chat) => {
    return chat.participants.find(p => p.userRole === 'client')?.userName || 'Cliente'
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
          Chat con Clientes
        </h1>
        <p className="text-gray-600">
          Comunícate con tus clientes sobre sus pedidos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay conversaciones activas</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
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
                            {getCustomerName(chat)}
                          </p>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {chat.orderId && (
                          <div className="flex items-center gap-1 mt-1">
                            <Package className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              Pedido #{chat.orderId.orderNumber}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {chat.orderId.status}
                            </Badge>
                          </div>
                        )}
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {getCustomerName(selectedChat)}
                      </CardTitle>
                      {selectedChat.orderId && (
                        <CardDescription className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Pedido #{selectedChat.orderId.orderNumber} - {selectedChat.orderId.status}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedChat.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay mensajes aún</p>
                    </div>
                  ) : (
                    selectedChat.messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderRole === 'supplier' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderRole === 'supplier'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.senderName}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecciona una conversación para comenzar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
} 