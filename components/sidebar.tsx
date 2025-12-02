"use client"

import { LayoutDashboard, ShoppingCart, Package, Settings, Menu, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
// 1. Importamos el componente Image de Next.js
import Image from "next/image"

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
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* 2. Modificamos el encabezado del Sidebar.
             - Cambiamos 'p-6' por 'p-4' para ajustar mejor el espacio vertical si es necesario.
             - Agregamos 'flex justify-center' para centrar el logo.
          */}
          <div className="p-6 border-b border-sidebar-border flex justify-center items-center">
            {/* Contenedor relativo para la imagen */}
            <div className="relative w-40 h-12">
              <Image 
                src="/logov2.jpg" 
                alt="AWANA Logo" 
                fill 
                className="object-contain" 
                priority
              />
            </div>

          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id)
                    if (window.innerWidth < 768) setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activePage === item.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}