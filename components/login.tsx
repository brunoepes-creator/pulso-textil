"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
// 1. Borramos 'Smile' y agregamos 'Image' de Next.js
import Image from "next/image" 
import { supabase } from "@/lib/supabase"

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('emprendedor')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !data) {
        setError("El usuario no existe o hubo un error.")
        setLoading(false)
        return
      }

      if (data.password_hash === password) {
        onLogin()
      } else {
        setError("Contraseña incorrecta")
      }

    } catch (err) {
      setError("Ocurrió un error inesperado al intentar ingresar.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center space-y-4">
          
          {/* --- AQUÍ ESTÁ EL CAMBIO DEL LOGO --- */}
          {/* Eliminamos el div azul y el icono Smile */}
          <div className="relative w-48 h-50 mb-2">
            <Image 
              src="/logov2.jpg" // Asegúrate que este sea el nombre en la carpeta public
              alt="Logo AWANA"
              fill // Esto hace que la imagen llene el contenedor padre
              className="object-contain" // Esto evita que el logo se estire o deforme
              priority // Carga la imagen de inmediato
            />
          </div>
          {/* ---------------------------------- */}

              <p className="text-sm text-gray-600">Accede a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Usuario
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <Button 
            type="submit" 
            className="h-12 w-full bg-blue-600 text-base font-medium hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  )
}