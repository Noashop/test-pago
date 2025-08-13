'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Store } from 'lucide-react'

interface SupplierItem {
  id: string
  name: string
  logo: string
  totalProducts: number
}

export default function SuppliersCarousel() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/public/suppliers', { cache: 'no-store' })
        if (!res.ok) throw new Error('Error al cargar proveedores')
        const data = await res.json()
        setSuppliers(data.suppliers || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full py-6 flex items-center justify-center text-gray-500 text-sm">
        Cargando emprendedores...
      </div>
    )
  }

  if (!suppliers.length) {
    return null
  }

  const scrollBy = (container: HTMLDivElement | null, delta: number) => {
    if (!container) return
    container.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="py-8 bg-white border-t border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Emprendedores Destacados</h3>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="group flex items-center">
            <button
              aria-label="Anterior"
              className="hidden md:flex mr-2 h-9 w-9 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              onClick={(e) => scrollBy((e.currentTarget.parentElement?.querySelector('#suppliers-strip') as HTMLDivElement) || null, -300)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              id="suppliers-strip"
              className="flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory pb-2"
            >
              {suppliers.map((s) => (
                <div key={s.id} className="snap-start shrink-0">
                  <Link href={`/products?supplier=${encodeURIComponent(s.id)}`} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-full ring-1 ring-gray-200 bg-white overflow-hidden flex items-center justify-center">
                      {s.logo ? (
                        <Image
                          src={s.logo}
                          alt={s.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-semibold bg-gray-100">
                          {s.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 max-w-[84px] text-center truncate" title={s.name}>{s.name}</span>
                  </Link>
                </div>
              ))}
            </div>

            <button
              aria-label="Siguiente"
              className="hidden md:flex ml-2 h-9 w-9 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              onClick={(e) => scrollBy((e.currentTarget.parentElement?.querySelector('#suppliers-strip') as HTMLDivElement) || null, 300)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
