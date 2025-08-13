"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

const errorMessages: Record<string, { title: string; description: string }> = {
  EMAIL_NOT_VERIFIED: {
    title: "No se pudo iniciar sesión",
    description: "La verificación por correo está deshabilitada. Revisa tus credenciales e intenta nuevamente.",
  },
  CredentialsSignin: {
    title: "No se pudo iniciar sesión",
    description: "Email o contraseña inválidos. Intenta nuevamente.",
  },
  AccessDenied: {
    title: "Acceso denegado",
    description: "No tienes permisos para acceder a esta sección.",
  },
}

function ErrorContent() {
  const params = useSearchParams()
  const err = params.get("error") || ""
  const info = errorMessages[err] || {
    title: "Error de autenticación",
    description: "Ocurrió un problema al intentar iniciar sesión.",
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h1 className="text-xl font-semibold">{info.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{info.description}</p>

        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="outline">Volver al login</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
