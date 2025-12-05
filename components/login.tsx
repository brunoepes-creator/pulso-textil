"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User } from "lucide-react"
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
        setError("Credenciales incorrectas.")
        setLoading(false)
        return
      }

      if (data.password_hash === password) {
        onLogin()
      } else {
        setError("Contraseña incorrecta.")
      }

    } catch (err) {
      setError("Error de conexión.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    // CONTENEDOR PRINCIPAL (Relativo para contener los absolutos)
    <div className="w-full min-h-screen grid lg:grid-cols-2 overflow-hidden relative">
      
      {/* --- ESTILOS CSS --- */}
      <style jsx>{`
        @keyframes weaveMain {
            0% { transform: translate(-100%, -100%) rotate(35deg); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate(100vw, 100vh) rotate(35deg); opacity: 0; }
        }
        @keyframes weaveCross {
            0% { transform: translate(100%, -100%) rotate(-35deg); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate(-100vw, 100vh) rotate(-35deg); opacity: 0; }
        }

        .thread {
            position: absolute;
            width: 150vmax; 
            height: 2px;
            pointer-events: none;
        }

        /* Hilo Dorado */
        .thread-gold {
            background: linear-gradient(90deg, transparent, #B45309, #F59E0B, transparent); 
            animation: weaveMain 10s infinite linear;
        }

        /* Hilo Azul */
        .thread-blue {
            background: linear-gradient(90deg, transparent, #172554, #1E40AF, transparent); 
            animation: weaveCross 14s infinite linear;
        }
      `}</style>

      {/* --- CAPA DE HILOS (Z-INDEX: 20) --- */}
      {/* Esta capa está por encima de los fondos de las columnas (Z-0) pero debajo del contenido (Z-30) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
         <div className="thread thread-gold" style={{ top: '20%', left: '-10%', animationDelay: '0s' }}></div>
         <div className="thread thread-blue" style={{ top: '0%', left: '60%', animationDelay: '2s' }}></div>
         <div className="thread thread-gold" style={{ top: '50%', left: '-10%', animationDelay: '5s' }}></div>
         <div className="thread thread-blue" style={{ top: '40%', left: '80%', animationDelay: '8s' }}></div>
      </div>


      {/* ================= IZQUIERDA (AZUL ACERO) ================= */}
      <div className="relative flex flex-col justify-center items-center p-10 text-slate-900 border-r border-slate-300">
        
        {/* CAPA 0: FONDO DE COLOR (Detrás de los hilos) */}
        <div className="absolute inset-0 bg-slate-200 z-0"></div>
        {/* Patrón sutil */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] z-0"></div>
        {/* Círculo decorativo */}
        <div className="absolute w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-40 -top-10 -left-10 animate-pulse z-0"></div>

        {/* CAPA 3: CONTENIDO (Delante de los hilos) */}
        <div className="relative z-30 flex flex-col items-center text-center space-y-6">
            <div className="relative w-72 h-48 drop-shadow-2xl">
                <Image 
                    src="/awana-logo.jpg" 
                    alt="Awana Logo" 
                    fill 
                    className="object-contain mix-blend-multiply" 
                    priority
                />
            </div>
            
            <div className="space-y-3">
                <h2 className="text-5xl font-bold tracking-tight text-[#1e3a8a] font-serif drop-shadow-sm">
                  AWANA
                </h2>
                <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full shadow-sm"></div>
                <p className="text-lg text-slate-600 font-bold tracking-widest uppercase mt-4">
                  Gestión Textil Inteligente
                </p>
            </div>
        </div>
      </div>


      {/* ================= DERECHA (DORADO CHAMPAGNE) ================= */}
      <div className="relative flex items-center justify-center p-8">
        
        {/* CAPA 0: FONDO DE COLOR (Detrás de los hilos) */}
        <div className="absolute inset-0 bg-amber-100 z-0"></div>
        {/* Mancha dorada */}
        <div className="absolute w-[500px] h-[500px] bg-amber-200 rounded-full blur-3xl opacity-50 bottom-0 right-0 z-0"></div>

        {/* CAPA 3: CONTENIDO (Delante de los hilos) */}
        {/* La tarjeta tiene z-30 para tapar los hilos que pasen por debajo de ella */}
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-2xl border-2 border-amber-200 relative z-30">
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#1e3a8a]">Bienvenido</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Ingresa tus credenciales para tejer el éxito.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 text-sm font-medium">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-[#1e3a8a] font-bold text-xs uppercase tracking-wide">Correo</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                    <Input
                    id="email"
                    type="email"
                    placeholder="usuario@awana.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 border-slate-300 text-slate-800 focus:border-[#1e3a8a] focus:ring-[#1e3a8a]/20 rounded-lg transition-all font-medium"
                    />
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-[#1e3a8a] font-bold text-xs uppercase tracking-wide">Contraseña</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                    <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 border-slate-300 text-slate-800 focus:border-[#1e3a8a] focus:ring-[#1e3a8a]/20 rounded-lg transition-all font-medium"
                    />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold tracking-wide shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 rounded-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "INGRESAR AL SISTEMA"}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 font-medium">© 2025 Awana. Plataforma segura.</p>
          </div>
        </div>
      </div>

    </div>
  )
}