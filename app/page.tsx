"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Orders from "@/components/orders"
import Catalog from "@/components/catalog"
import Admin from "@/components/admin"
import Login from "@/components/login"
import Header from "@/components/header"
import Customers from "@/components/customers"
import UserProfile from "@/components/user-profile"

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  const handleNavigate = (page: string) => {
    setActivePage(page)
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onLogout={handleLogout} onNavigate={handleNavigate} />

        <main className="flex-1 overflow-auto">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "orders" && <Orders />}
          {activePage === "customers" && <Customers />}
          {activePage === "catalog" && <Catalog />}
          {activePage === "admin" && <Admin />}
          {activePage === "profile" && <UserProfile />}
        </main>
      </div>
    </div>
  )
}
