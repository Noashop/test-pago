"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Verificación deshabilitada</h1>
          <p className="text-sm text-muted-foreground">
            La verificación por correo para login/registro está deshabilitada. Por favor inicia sesión con tu email y contraseña.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button>Ir al login</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
