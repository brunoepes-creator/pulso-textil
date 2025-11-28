"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, FileText, Check, X, MapPin, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type OrderStatus = "pendiente" | "confirmado" | "rechazado"
type TrackingStatus = "confirmado" | "enviado" | "recibido"

interface Order {
  id: string
  phone: string
  customer: string
  amount: string
  status: OrderStatus
  date: string
  district: string
  address: string
  reference: string
  referencePhone?: string
  shippingStatus?: string
  trackingStatus?: TrackingStatus
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState("pendientes")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    orderId: string
    action: "aprobar" | "rechazar"
  } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [revertDialog, setRevertDialog] = useState<{
    isOpen: boolean
    orderId: string
  }>({
    isOpen: false,
    orderId: "",
  })

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1025",
      phone: "51964491182",
      referencePhone: "51998877665",
      customer: "Andrés Iniesta",
      amount: "150.00",
      status: "pendiente",
      date: "15/01/2025",
      district: "Miraflores",
      address: "Av. Larco 345, Edificio Los Alamos, Dpto 502",
      reference: "Frente al parque Kennedy, edificio color beige",
    },
    {
      id: "1024",
      phone: "51987654321",
      referencePhone: "51955443322",
      customer: "Juan Pérez",
      amount: "85.00",
      status: "pendiente",
      date: "14/01/2025",
      district: "San Isidro",
      address: "Calle Las Flores 123",
      reference: "Casa verde con portón negro",
    },
    {
      id: "1023",
      phone: "51912345678",
      referencePhone: "51966554433",
      customer: "Luca Modric",
      amount: "210.00",
      status: "pendiente",
      date: "13/01/2025",
      district: "Surco",
      address: "Av. Primavera 890",
      reference: "Al costado del supermercado",
    },
    {
      id: "1022",
      phone: "51998765432",
      referencePhone: "51977665544",
      customer: "Carlos García",
      amount: "320.00",
      status: "confirmado",
      trackingStatus: "enviado",
      date: "12/01/2025",
      district: "La Molina",
      address: "Calle Los Rosales 456",
      reference: "Conjunto residencial Las Praderas",
    },
    {
      id: "1021",
      phone: "51956789012",
      referencePhone: "51944332211",
      customer: "María López",
      amount: "175.00",
      status: "confirmado",
      trackingStatus: "confirmado",
      date: "11/01/2025",
      district: "San Borja",
      address: "Av. Aviación 789",
      reference: "Edificio corporativo piso 5",
    },
    {
      id: "1020",
      phone: "51943210987",
      referencePhone: "51922113344",
      customer: "Antonio Silva",
      amount: "95.00",
      status: "rechazado",
      date: "10/01/2025",
      district: "Barranco",
      address: "Jr. Cajamarca 234",
      reference: "Casa colonial color amarillo",
    },
  ])

  const tabs = [
    { id: "pendientes", label: "Pendientes" },
    { id: "confirmados", label: "Confirmados" },
    { id: "rechazados", label: "Rechazados" },
    { id: "todos", label: "Todos" },
  ]

  const filteredOrders = orders
    .filter((order) => {
      if (activeTab === "todos") return true
      if (activeTab === "pendientes") return order.status === "pendiente"
      if (activeTab === "confirmados") return order.status === "confirmado"
      if (activeTab === "rechazados") return order.status === "rechazado"
      return true
    })
    .filter(
      (order) =>
        order.id.includes(searchQuery) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery),
    )

  const handleConfirmAction = () => {
    if (!confirmAction) return

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === confirmAction.orderId) {
          if (confirmAction.action === "aprobar") {
            setSuccessMessage(`El pedido #${confirmAction.orderId} ha sido aprobado correctamente.`)
            setTimeout(() => setSuccessMessage(null), 5000)
            return {
              ...order,
              status: "confirmado" as OrderStatus,
              trackingStatus: "confirmado" as TrackingStatus,
            }
          } else if (confirmAction.action === "rechazar") {
            return {
              ...order,
              status: "rechazado" as OrderStatus,
            }
          }
        }
        return order
      }),
    )

    setConfirmAction(null)
  }

  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    isOpen: boolean
    orderId: string
    currentStatus: TrackingStatus
    newStatus: TrackingStatus
  }>({
    isOpen: false,
    orderId: "",
    currentStatus: "confirmado",
    newStatus: "confirmado",
  })

  const handleTrackingStatusChange = (orderId: string, newStatus: TrackingStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (order && order.trackingStatus !== newStatus) {
      setStatusChangeDialog({
        isOpen: true,
        orderId,
        currentStatus: order.trackingStatus || "confirmado",
        newStatus,
      })
    }
  }

  const confirmStatusChange = () => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === statusChangeDialog.orderId) {
          return {
            ...order,
            trackingStatus: statusChangeDialog.newStatus,
          }
        }
        return order
      }),
    )
    setStatusChangeDialog({ isOpen: false, orderId: "", currentStatus: "confirmado", newStatus: "confirmado" })
  }

  const handleRevertOrder = () => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === revertDialog.orderId) {
          setSuccessMessage(`El pedido #${revertDialog.orderId} ha sido revertido y está en el listado de pendientes.`)
          setTimeout(() => setSuccessMessage(null), 5000)
          return {
            ...order,
            status: "pendiente" as OrderStatus,
          }
        }
        return order
      }),
    )
    setRevertDialog({ isOpen: false, orderId: "" })
  }

  const isTrackingStatusActive = (order: Order, status: TrackingStatus): boolean => {
    const statusOrder: TrackingStatus[] = ["confirmado", "enviado", "recibido"]
    const currentIndex = statusOrder.indexOf(order.trackingStatus || "confirmado")
    const checkIndex = statusOrder.indexOf(status)
    return checkIndex <= currentIndex
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Gestión de Pedidos</h2>
        <p className="text-muted-foreground mt-2">Administra todos tus pedidos en un solo lugar</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-100 border border-emerald-600 rounded-lg flex items-center justify-between">
          <p className="text-emerald-800 font-medium">{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-800 hover:text-emerald-900">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID, cliente o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Order Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Pedido ID:</span>
                  <span className="text-sm font-semibold text-foreground">#{order.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Fecha:</span>
                  <span className="text-xs text-muted-foreground">{order.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <span className="text-sm text-foreground">{order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="text-sm font-medium text-foreground">{order.customer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Monto:</span>
                  <span className="text-lg font-bold text-primary">S/ {order.amount}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary/10 bg-transparent"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary/10 bg-transparent"
                    onClick={() => setSelectedVoucher(order.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Voucher
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary/10 bg-transparent"
                    onClick={() => setSelectedShipping(order.id)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Datos de Envío
                  </Button>
                </div>

                {order.status === "confirmado" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">Estado de Envío:</span>
                      </div>
                      <Select
                        value={order.trackingStatus || "confirmado"}
                        onValueChange={(value) => handleTrackingStatusChange(order.id, value as TrackingStatus)}
                      >
                        <SelectTrigger className="w-[160px] bg-white border-blue-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmado">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Confirmado
                            </div>
                          </SelectItem>
                          <SelectItem value="enviado">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              Enviado
                            </div>
                          </SelectItem>
                          <SelectItem value="recibido">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Recibido
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {order.status === "rechazado" && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-600 text-red-600 text-sm font-medium">
                      <X className="h-4 w-4" />
                      Rechazado
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 bg-transparent"
                      onClick={() => setRevertDialog({ isOpen: true, orderId: order.id })}
                    >
                      Revertir
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Details Modal */}
      <Dialog open={selectedOrder !== null} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalles de Productos - #{selectedOrder}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedOrder &&
              orderProducts[selectedOrder]?.map((product, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-3">{product.name}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Talla:</p>
                          <p className="text-sm font-medium">{product.size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Color:</p>
                          <p className="text-sm font-medium">{product.color}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Precio</p>
                        <p className="text-xl font-bold text-primary">S/ {product.price}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {selectedOrder && (
            <>
              {orders.find((o) => o.id === selectedOrder)?.status === "pendiente" && (
                <div className="mt-6 flex gap-3">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setConfirmAction({ orderId: selectedOrder, action: "aprobar" })
                      setSelectedOrder(null)
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar Pedido
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => {
                      setConfirmAction({ orderId: selectedOrder, action: "rechazar" })
                      setSelectedOrder(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Voucher Modal */}
      <Dialog open={selectedVoucher !== null} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Comprobante de Pago - #{selectedVoucher}</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedVoucher && (
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={voucherImages[selectedVoucher] || "/placeholder.svg?height=600&width=400&query=receipt voucher"}
                  alt="Comprobante de pago"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setSelectedVoucher(null)}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipping Data Modal */}
      <Dialog open={selectedShipping !== null} onOpenChange={() => setSelectedShipping(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Datos de Envío - #{selectedShipping}</DialogTitle>
          </DialogHeader>

          {selectedShipping && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                <p className="text-base font-medium text-foreground mt-1">
                  {orders.find((o) => o.id === selectedShipping)?.phone}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono de Referencia</label>
                <p className="text-base font-medium text-foreground mt-1">
                  {orders.find((o) => o.id === selectedShipping)?.referencePhone || "No especificado"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Distrito</label>
                <p className="text-base font-medium text-foreground mt-1">
                  {orders.find((o) => o.id === selectedShipping)?.district}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                <p className="text-base font-medium text-foreground mt-1">
                  {orders.find((o) => o.id === selectedShipping)?.address}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Referencia</label>
                <p className="text-base font-medium text-foreground mt-1">
                  {orders.find((o) => o.id === selectedShipping)?.reference}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={() => setSelectedShipping(null)}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for approve/reject actions */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "aprobar"
                ? `¿Estás seguro de aprobar el pedido #${confirmAction.orderId}? El pedido se moverá a la sección de confirmados.`
                : `¿Estás seguro de rechazar el pedido #${confirmAction?.orderId}? Esta acción moverá el pedido a rechazados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={statusChangeDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setStatusChangeDialog({ isOpen: false, orderId: "", currentStatus: "confirmado", newStatus: "confirmado" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de cambiar el estado de "
              {statusChangeDialog.currentStatus.charAt(0).toUpperCase() + statusChangeDialog.currentStatus.slice(1)}" a
              "{statusChangeDialog.newStatus.charAt(0).toUpperCase() + statusChangeDialog.newStatus.slice(1)}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog
        open={revertDialog.isOpen}
        onOpenChange={(open) => !open && setRevertDialog({ isOpen: false, orderId: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reversión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de revertir el pedido #{revertDialog.orderId}? El pedido se moverá de nuevo a la sección de
              pendientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertOrder} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const voucherImages: Record<string, string> = {
  "1025": "/receipt-payment-voucher.jpg",
  "1024": "/payment-receipt-proof.jpg",
  "1023": "/invoice-payment-document.jpg",
  "1022": "/receipt-transaction-proof.jpg",
  "1021": "/payment-voucher-document.jpg",
  "1020": "/invoice-receipt-payment.jpg",
}

const orderProducts: Record<
  string,
  Array<{
    name: string
    image: string
    size: string
    color: string
    price: string
  }>
> = {
  "1023": [
    {
      name: "Chompa Deportiva",
      image: "/chompa-deportiva.jpg",
      size: "XL",
      color: "Azul",
      price: "120.00",
    },
    {
      name: "Polo Premium",
      image: "/polo-premium.jpg",
      size: "M",
      color: "Gris",
      price: "90.00",
    },
  ],
  "1025": [
    {
      name: "Polo Básico",
      image: "/basic-tshirt.png",
      size: "L",
      color: "Blanco",
      price: "50.00",
    },
    {
      name: "Casaca Premium",
      image: "/denim-jeans.png",
      size: "M",
      color: "Negro",
      price: "100.00",
    },
  ],
  "1024": [
    {
      name: "Chompa Básica",
      image: "/chompa-deportiva.jpg",
      size: "S",
      color: "Gris",
      price: "85.00",
    },
  ],
  "1022": [
    {
      name: "Polo Premium",
      image: "/polo-premium.jpg",
      size: "XL",
      color: "Negro",
      price: "80.00",
    },
    {
      name: "Casaca Executive",
      image: "/denim-jeans.png",
      size: "L",
      color: "Bordo",
      price: "240.00",
    },
  ],
  "1021": [
    {
      name: "Polo Casual",
      image: "/basic-tshirt.png",
      size: "M",
      color: "Rojo",
      price: "65.00",
    },
    {
      name: "Chompa Deportiva",
      image: "/chompa-deportiva.jpg",
      size: "L",
      color: "Azul",
      price: "110.00",
    },
  ],
  "1020": [
    {
      name: "Polo Básico",
      image: "/basic-tshirt.png",
      size: "S",
      color: "Blanco",
      price: "45.00",
    },
    {
      name: "Polo Premium",
      image: "/polo-premium.jpg",
      size: "M",
      color: "Gris",
      price: "50.00",
    },
  ],
}
