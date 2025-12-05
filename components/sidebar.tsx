"use client"

import { LayoutDashboard, ShoppingCart, Package, Settings, Menu, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils" 

interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingCart },
    { id: "customers", label: "Clientes", icon: Users }, 
    { id: "catalog", label: "Inventario", icon: Package },
    { id: "admin", label: "Administración", icon: Settings },
  ]

  return (
    <>
      {/* Botón móvil (Azul tenue sobre fondo claro) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-slate-700 hover:bg-amber-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          fixed md:static inset-y-0 left-0 z-40 w-64 
          transition-transform duration-300 ease-in-out md:translate-x-0
          shadow-xl flex flex-col
          /* --- COLOR DE FONDO: DORADO CREMA MUY TENUE --- */
          bg-[#fffbeb] /* Amber-50: Elegante y suave */
          border-r border-amber-200
        `}
      >
        <div className="flex flex-col h-full">
          
          {/* Encabezado con Logo */}
          <div className="p-6 border-b border-amber-200/50 flex justify-center items-center bg-amber-100/30">
            <div className="relative w-36 h-14 drop-shadow-sm">
              <Image 
                src="/awana-logo2.jpg" // Asegúrate de usar el nombre correcto
                alt="AWANA Logo" 
                fill 
                className="object-contain mix-blend-multiply opacity-90" // Opacidad leve para integrarlo mejor
                priority
              />
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id)
                    if (window.innerWidth < 768) setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                    ${isActive
                      ? "bg-slate-800 text-amber-50 shadow-md translate-x-1" // Activo: Azul Oscuro Suave (Slate-800) con texto crema
                      : "text-slate-600 hover:bg-amber-100 hover:text-slate-900" // Inactivo: Gris Azulado Tenue
                    }
                  `}
                >
                  {/* Icono: Dorado si está activo, Gris azulado si no */}
                  <Icon className={`h-5 w-5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                  
                  {/* Indicador sutil de activo */}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              )
            })}
          </nav>

          {/* Pie del Sidebar */}
          <div className="p-4 text-center border-t border-amber-200/50">
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              © 2025 Awana System
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}