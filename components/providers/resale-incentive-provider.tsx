'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { setResaleIncentiveEmitter } from '@/store/cart-store'
import { useResaleIncentive } from '@/components/cart/resale-incentive-toast'

export default function ResaleIncentiveProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { showIncentive } = useResaleIncentive()

  useEffect(() => {
    // Only set up the emitter if user is logged in as a client
    if (session?.user?.role === 'client') {
      setResaleIncentiveEmitter((data) => {
        showIncentive(data)
      })
    } else {
      // Clear the emitter if user is not a client or not logged in
      setResaleIncentiveEmitter((_data) => {})
    }

    // Cleanup on unmount
    return () => {
      setResaleIncentiveEmitter((_data) => {})
    }
  }, [session, showIncentive])

  return <>{children}</>
}
