"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, User, Store } from "lucide-react"
import { supabase } from "@/lib/supabase" 

interface HeaderProps {
  onLogout: () => void
  onNavigate: (page: string) => void
}

export default function Header({ onLogout, onNavigate }: HeaderProps) {
  const [userName, setUserName] = useState("Cargando...")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('emprendedor')
          .select('nombre_negocio')
          .limit(1)
          .single()

        if (error) {
          console.error("Error al obtener usuario:", error)
          setUserName("Emprendedor")
        } else if (data) {
          setUserName(data.nombre_negocio)
        }
      } catch (error) {
        console.error("Error:", error)
      }
    }

    fetchUser()
  }, [])

  return (
    // CAMBIO DE COLOR: Fondo Azul Acero (Slate-300) con borde un poco más oscuro
    <header className="border-b border-slate-400 bg-[#cbd5e1] px-6 py-4 shadow-sm">
      <div className="flex justify-end items-center">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              // Efecto hover más oscuro para que contraste con el fondo azulado
              className="flex items-center gap-3 hover:bg-slate-400/30 text-slate-900 transition-colors"
            >
              <div className="flex flex-col items-end">
                <span className="font-bold text-sm leading-none text-[#0f172a]">{userName}</span>
                <span className="text-xs text-slate-600 font-normal">Administrador</span>
              </div>
              
              {/* Avatar: Azul Oscuro con ícono blanco para resaltar */}
              <div className="h-8 w-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white border border-slate-500 shadow-sm">
                 <Store className="h-4 w-4" />
              </div>
              
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          
          {/* Menú desplegable blanco limpio */}
          <DropdownMenuContent align="end" className="w-56 border-slate-300 bg-white shadow-xl">
            <DropdownMenuItem onClick={() => onNavigate("profile")} className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
              <User className="mr-2 h-4 w-4 text-slate-500" />
              <span>Mis datos</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}