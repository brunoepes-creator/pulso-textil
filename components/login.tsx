"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smile } from "lucide-react"
// 1. Importamos la conexión a Supabase
import { supabase } from "@/lib/supabase"

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false) // Nuevo estado para mostrar carga

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 2. Consultamos a la tabla 'emprendedor' en Supabase
      const { data, error } = await supabase
        .from('emprendedor')
        .select('*')
        .eq('email', email) // Buscamos el correo ingresado
        .single() // Esperamos un solo resultado

      if (error || !data) {
        setError("El usuario no existe o hubo un error.")
        setLoading(false)
        return
      }

      // 3. Verificamos la contraseña
      // NOTA: Para este ejercicio didáctico comparamos texto directo.
      // En producción real, aquí se usaría bcrypt o Supabase Auth.
      if (data.password_hash === password) {
        // ¡Éxito!
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
            <Smile className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">Pulso Textil</h1>
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
            disabled={loading} // Deshabilitar botón mientras carga
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  )
}