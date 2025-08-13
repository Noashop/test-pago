import { useRouter } from 'next/navigation'
import { useSession, getSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

export const useAuthRedirect = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const redirectBasedOnRole = async () => {
    // Obtener la sesión actualizada después del login
    const currentSession = await getSession()
    if (!currentSession?.user) return

    try {
      if (currentSession.user.role === 'admin') {
        // Admin va al panel administrativo
        router.push('/admin')
      } else if (currentSession.user.role === 'supplier') {
        // Verificar si el proveedor está aprobado
        if (currentSession.user.isApproved) {
          router.push('/supplier')
        } else {
          // Si no está aprobado, mostrar mensaje y redirigir a la tienda
          toast({
            title: 'Cuenta pendiente de aprobación',
            description: 'Tu cuenta de proveedor está siendo revisada. Mientras tanto, puedes explorar la tienda.',
          })
          router.push('/')
        }
      } else {
        // Cliente - verificar si tiene órdenes en proceso
        try {
          const response = await fetch('/api/auth/check-orders')
          const data = await response.json()
          
          if (data.hasOrdersInProcess) {
            // Si tiene órdenes en proceso, ir a sus órdenes
            router.push('/orders')
          } else {
            // Si no tiene órdenes, ir a la tienda para motivar la compra
            router.push('/')
          }
        } catch (error) {
          // En caso de error, ir a la tienda
          console.error('Error checking orders:', error)
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error in redirect:', error)
      // Fallback a la tienda
      router.push('/')
    }
  }

  return { redirectBasedOnRole }
} 