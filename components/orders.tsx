"use client"

import { useState, useEffect } from "react"
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
// 1. IMPORTANTE: Importamos el cliente de Supabase
import { supabase } from "@/lib/supabase" 

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
  voucherUrl?: string
}

interface OrderDetail {
  name: string
  image: string
  size: string
  color: string
  price: string
  quantity: number
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

  // NUEVO: Estado para guardar los detalles del pedido que se abre en el modal
  const [currentOrderDetails, setCurrentOrderDetails] = useState<OrderDetail[]>([])

  // NUEVO: Estado de carga para mostrar "Cargando..."
  const [isLoading, setIsLoading] = useState(true)

  // MODIFICADO: Inicia orders vacío
  const [orders, setOrders] = useState<Order[]>([])

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

 const handleConfirmAction = async () => {
  if (!confirmAction) return

  const newStatus = confirmAction.action === "aprobar" ? "Confirmado" : "Rechazado"

  try {
    // 1. Mandamos la actualización a Supabase
    const { error } = await supabase
      .from('pedido')
      .update({ estado_pedido: newStatus })
      .eq('pedido_id', confirmAction.orderId)

    if (error) throw error

    // 2. Si todo sale bien, actualizamos la lista visualmente (tu código original adaptado)
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === confirmAction.orderId) {
          if (confirmAction.action === "aprobar") {
            setSuccessMessage(`El pedido #${confirmAction.orderId} aprobado.`)
            setTimeout(() => setSuccessMessage(null), 5000)
            return { ...order, status: "confirmado", trackingStatus: "confirmado" }
          } else {
            return { ...order, status: "rechazado" }
          }
        }
        return order
      })
    )
  } catch (error) {
    console.error("Error actualizando:", error)
    alert("No se pudo actualizar el pedido")
  }
  setConfirmAction(null)
}


const fetchOrders = async () => {
  setIsLoading(true)
  try {
    // Pedimos datos a la tabla 'pedido' y sus relaciones con 'cliente_final'
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        pedido_id,
        estado_pedido,
        monto_total,
        fecha_creacion,
        url_voucher_img,
        cliente_final (
          nombre_cliente,
          telefono_cliente,
          telefono_referencia,
          direccion_envio,
          distrito,
          referencia_ubicacion
        )
      `)
      .order('fecha_creacion', { ascending: false }) // Más recientes primero

    if (error) throw error

    if (data) {
      // Transformamos los datos crudos de la BD al formato de tu interfaz Order
      const formattedOrders: Order[] = data.map((item: any) => ({
        id: item.pedido_id.toString(),
        phone: item.cliente_final?.telefono_cliente || "",
        customer: item.cliente_final?.nombre_cliente || "Cliente Desconocido",
        referencePhone: item.cliente_final?.telefono_referencia || "",
        amount: item.monto_total.toFixed(2),
        // Convertimos 'Pendiente' (BD) a 'pendiente' (Frontend)
        status: item.estado_pedido.toLowerCase() as OrderStatus,
        date: new Date(item.fecha_creacion).toLocaleDateString('es-PE'),
        district: item.cliente_final?.distrito || "",
        address: item.cliente_final?.direccion_envio || "",
        reference: item.cliente_final?.referencia_ubicacion || "",
        voucherUrl: item.url_voucher_img,
        trackingStatus: "confirmado"
      }))
      setOrders(formattedOrders)
    }
  } catch (error) {
    console.error("Error cargando pedidos:", error)
  } finally {
    setIsLoading(false)
  }
}

// Ejecutamos esta función apenas carga la página
useEffect(() => {
  fetchOrders()
}, [])

// Cargar productos de un pedido específico
const fetchOrderDetails = async (orderId: string) => {
  const { data, error } = await supabase
    .from('detalle_pedido')
    .select(`
      cantidad,
      precio_unitario,
      variacion_producto (
        producto (
          nombre_producto,
          producto_categoria(imagen_categoria)
        ),
        talla_producto ( nombre_talla ),
        color_producto ( nombre_color )
      )
    `)
    .eq('pedido_id', orderId) // Filtramos por el ID del pedido seleccionado

  if (!error && data) {
    const details = data.map((item: any) => ({
      name: item.variacion_producto?.producto?.nombre_producto,
      // Usamos la imagen de la categoría como respaldo si no hay imagen específica
      image: item.variacion_producto?.producto?.producto_categoria?.imagen_categoria || "/placeholder.svg",
      size: item.variacion_producto?.talla_producto?.nombre_talla,
      color: item.variacion_producto?.color_producto?.nombre_color,
      price: item.precio_unitario.toFixed(2),
      quantity: item.cantidad
    }))
    setCurrentOrderDetails(details)
  }
}

// Este efecto se dispara cada vez que seleccionas un pedido diferente
useEffect(() => {
  if (selectedOrder) {
    fetchOrderDetails(selectedOrder)
  } else {
    setCurrentOrderDetails([])
  }
}, [selectedOrder])


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
                    // ... otras props ...
                    onClick={() => setSelectedVoucher(order.voucherUrl || null)}
                    disabled={!order.voucherUrl} // Deshabilitar si no hay foto
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
         {currentOrderDetails.length > 0 ? (
  currentOrderDetails.map((product, index) => (
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
  ))
) : (
  <p className="text-center py-4">Cargando detalles...</p>
)}
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
            <DialogTitle className="text-xl font-bold">Comprobante de Pago</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedVoucher ? (
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* CAMBIO CLAVE: 
                   Antes buscábamos en 'voucherImages[selectedVoucher]'.
                   Ahora usamos 'selectedVoucher' directamente porque YA es la URL.
                */}
                <img
                  src={selectedVoucher}
                  alt="Comprobante de pago"
                  className="w-full h-auto"
                />
              </div>
            ) : (
                <p className="text-center py-8 text-muted-foreground">No hay imagen de voucher disponible.</p>
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
