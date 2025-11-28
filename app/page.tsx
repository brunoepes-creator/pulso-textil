"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Orders from "@/components/orders"
import Catalog from "@/components/catalog"
import Admin from "@/components/admin"
import Login from "@/components/login"
import Header from "@/components/header"

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onLogout={handleLogout} />

        <main className="flex-1 overflow-auto">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "orders" && <Orders />}
          {activePage === "catalog" && <Catalog />}
          {activePage === "admin" && <Admin />}
        </main>
      </div>
    </div>
  )
}
