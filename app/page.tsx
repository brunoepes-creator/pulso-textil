"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// --- IMPORTACIONES DE TUS COMPONENTES ---
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Orders from "@/components/orders"
import Catalog from "@/components/catalog"
import Admin from "@/components/admin"
import Login from "@/components/login"
import Header from "@/components/header"
import Customers from "@/components/customers"
import UserProfile from "@/components/user-profile"

// --- IMPORTACIONES PARA SEGURIDAD ---
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog"
import { Clock } from "lucide-react"

export default function Home() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // --- ESTADOS DE SEGURIDAD ---
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  
  // Referencia para guardar la hora del último movimiento (No provoca re-renders)
  const lastActivityRef = useRef(Date.now())

  // CONFIGURACIÓN DE TIEMPOS (En milisegundos)
  // 2 minutos para alerta
  const TIEMPO_ADVERTENCIA = 50000
  // 3 minutos totales para salir (2 min de espera + 1 min de gracia)
  const TIEMPO_LIMITE_TOTAL = 50000

  // ==========================================================================
  // 1. LÓGICA DE SESIÓN Y PERSISTENCIA
  // ==========================================================================

  useEffect(() => {
    const session = localStorage.getItem("awana_session")
    if (session === "active") {
      setIsAuthenticated(true)
      lastActivityRef.current = Date.now() // Resetear reloj al cargar
    }
  }, [])

  const handleLogin = () => {
    localStorage.setItem("awana_session", "active")
    setIsAuthenticated(true)
    lastActivityRef.current = Date.now() // Resetear reloj al entrar
  }

  // Función Logout segura
  const handleLogout = useCallback(() => {
    localStorage.removeItem("awana_session")
    setIsAuthenticated(false)
    setShowInactivityModal(false)
    setActivePage("dashboard")
  }, [])

  const handleNavigate = (page: string) => {
    setActivePage(page)
  }

  // ==========================================================================
  // 2. SISTEMA DE SEGURIDAD (RELOJ MAESTRO)
  // ==========================================================================

  // A. Escuchar actividad del usuario
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      // SOLO actualizamos la hora si la alerta NO está abierta.
      // Si la alerta está abierta, el usuario DEBE hacer clic en el botón, mover el mouse no sirve.
      if (!showInactivityModal) {
        lastActivityRef.current = Date.now()
      }
    }

    const eventos = ['mousemove', 'keypress', 'click', 'scroll']
    eventos.forEach(e => window.addEventListener(e, updateActivity))
    
    return () => eventos.forEach(e => window.removeEventListener(e, updateActivity))
  }, [isAuthenticated, showInactivityModal])

  // B. Intervalo de Chequeo (El "Policía" que revisa cada segundo)
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = setInterval(() => {
      const ahora = Date.now()
      const tiempoInactivo = ahora - lastActivityRef.current

      // Chequeo 1: ¿Ya pasamos el tiempo total (3 min)? -> Cerrar sesión
      if (tiempoInactivo >= TIEMPO_LIMITE_TOTAL) {
        handleLogout()
      } 
      // Chequeo 2: ¿Pasamos el tiempo de advertencia (2 min) pero no el total? -> Mostrar alerta
      else if (tiempoInactivo >= TIEMPO_ADVERTENCIA) {
        if (!showInactivityModal) setShowInactivityModal(true)
      }

    }, 1000) // Revisa cada 1 segundo

    return () => clearInterval(intervalId)
  }, [isAuthenticated, showInactivityModal, handleLogout])

  // Acción del botón "¡Sigo aquí!"
  const confirmarSeguirAqui = () => {
    lastActivityRef.current = Date.now() // Reiniciamos el reloj a cero
    setShowInactivityModal(false)        // Cerramos el modal
  }


  // ==========================================================================
  // 3. RENDERIZADO
  // ==========================================================================

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onLogout={handleLogout} onNavigate={handleNavigate} />

        <main className="flex-1 overflow-auto bg-slate-50/50">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "orders" && <Orders />}
          {activePage === "customers" && <Customers />}
          {activePage === "catalog" && <Catalog />}
          {activePage === "admin" && <Admin />}
          {activePage === "profile" && <UserProfile />}
        </main>
      </div>

      {/* Modal de Seguridad (Inactividad) */}
      <AlertDialog open={showInactivityModal}>
        <AlertDialogContent className="max-w-md border-l-8 border-l-amber-500 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-slate-800 text-xl">
              <Clock className="h-6 w-6 text-amber-500 animate-pulse" /> 
              ¿Sigues ahí?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 pt-2">
              Hemos detectado inactividad por 2 minutos. 
              <br/><br/>
              Por seguridad, la sesión se cerrará automáticamente en <strong>1 minuto</strong> si no confirmas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button 
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-600 mr-4 underline underline-offset-4"
            >
                Cerrar sesión ahora
            </button>
            <AlertDialogAction 
              onClick={confirmarSeguirAqui}
              className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold px-6"
            >
              ¡Sigo aquí!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}