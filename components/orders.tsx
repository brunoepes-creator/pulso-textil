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
import { supabase } from "@/lib/supabase"

// 1. ACTUALIZACIÓN DE TIPOS CON TU NUEVA LÓGICA
type OrderStatus = "PENDIENTE_VALIDACION" | "PENDIENTE_ENVIO" | "ENVIADO" | "RECIBIDO" | "RECHAZADO"

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
  
  const [currentOrderDetails, setCurrentOrderDetails] = useState<OrderDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

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

  // Diálogo para cambiar estados de envío
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    isOpen: boolean
    orderId: string
    currentStatus: OrderStatus
    newStatus: OrderStatus
  }>({
    isOpen: false,
    orderId: "",
    currentStatus: "PENDIENTE_ENVIO",
    newStatus: "PENDIENTE_ENVIO",
  })

  const tabs = [
    { id: "pendientes", label: "Pendientes" },
    { id: "confirmados", label: "Confirmados" },
    { id: "rechazados", label: "Rechazados" },
    { id: "todos", label: "Todos" },
  ]

  

  // 2. LÓGICA DE FILTRADO (TABULADORES) CORREGIDA
  const filteredOrders = orders
    .filter((order) => {
      if (activeTab === "todos") return true
      
      // Tab Pendientes = Solo los que esperan validación del voucher
      if (activeTab === "pendientes") {
        return order.status === "PENDIENTE_VALIDACION"
      }
      
      // Tab Confirmados = Todo el flujo logístico (Por enviar, Enviado, Recibido)
      if (activeTab === "confirmados") {
        return ["PENDIENTE_ENVIO", "ENVIADO", "RECIBIDO"].includes(order.status)
      }
      
      if (activeTab === "rechazados") {
        return order.status === "RECHAZADO"
      }
      
      return true
    })
    .filter(
      (order) =>
        order.id.includes(searchQuery) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery),
    )

  // 3. CARGA DE PEDIDOS
  const fetchOrders = async () => {
    setIsLoading(true)
    try {
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
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedOrders: Order[] = data.map((item: any) => ({
          id: item.pedido_id.toString(),
          phone: item.cliente_final?.telefono_cliente || "",
          customer: item.cliente_final?.nombre_cliente || "Cliente Desconocido",
          referencePhone: item.cliente_final?.telefono_referencia || "",
          amount: item.monto_total.toFixed(2),
          // Mapeo directo del estado de la BD
          status: item.estado_pedido as OrderStatus,
          date: new Date(item.fecha_creacion).toLocaleDateString('es-PE'),
          district: item.cliente_final?.distrito || "",
          address: item.cliente_final?.direccion_envio || "",
          reference: item.cliente_final?.referencia_ubicacion || "",
          voucherUrl: item.url_voucher_img,
        }))
        setOrders(formattedOrders)
      }
    } catch (error) {
      console.error("Error cargando pedidos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

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
      .eq('pedido_id', orderId)

    if (!error && data) {
      const details = data.map((item: any) => ({
        name: item.variacion_producto?.producto?.nombre_producto,
        image: item.variacion_producto?.producto?.producto_categoria?.imagen_categoria || "/placeholder.svg",
        size: item.variacion_producto?.talla_producto?.nombre_talla,
        color: item.variacion_producto?.color_producto?.nombre_color,
        price: item.precio_unitario.toFixed(2),
        quantity: item.cantidad
      }))
      setCurrentOrderDetails(details)
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder)
    } else {
      setCurrentOrderDetails([])
    }
  }, [selectedOrder])

  // 4. APROBAR (Pasa a PENDIENTE_ENVIO) O RECHAZAR
  const handleConfirmAction = async () => {
    if (!confirmAction) return

    // CAMBIO CLAVE: Al aprobar, pasa al primer estado del flujo de confirmados
    const newStatus: OrderStatus = confirmAction.action === "aprobar" ? "PENDIENTE_ENVIO" : "RECHAZADO"

    try {
      const { error } = await supabase
        .from('pedido')
        .update({ estado_pedido: newStatus })
        .eq('pedido_id', confirmAction.orderId)

      if (error) throw error

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === confirmAction.orderId) {
            setSuccessMessage(
              confirmAction.action === "aprobar" 
                ? `Pedido #${confirmAction.orderId} validado. Pasa a estado "Por Enviar".`
                : `Pedido #${confirmAction.orderId} rechazado.`
            )
            setTimeout(() => setSuccessMessage(null), 5000)
            return { ...order, status: newStatus }
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

  // 5. CAMBIAR ESTADO DE ENVÍO (Dropdown)
  const handleTrackingStatusChange = (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId)
    const statusTyped = newStatus as OrderStatus

    if (order && order.status !== statusTyped) {
      setStatusChangeDialog({
        isOpen: true,
        orderId,
        currentStatus: order.status,
        newStatus: statusTyped,
      })
    }
  }

  const confirmStatusChange = async () => {
    try {
      const { error } = await supabase
        .from('pedido')
        .update({ estado_pedido: statusChangeDialog.newStatus })
        .eq('pedido_id', statusChangeDialog.orderId)

      if (error) throw error

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === statusChangeDialog.orderId) {
            return {
              ...order,
              status: statusChangeDialog.newStatus,
            }
          }
          return order
        })
      )
    } catch(err) {
      console.error(err)
      alert("Error al cambiar el estado")
    }
    
    setStatusChangeDialog({ isOpen: false, orderId: "", currentStatus: "PENDIENTE_ENVIO", newStatus: "PENDIENTE_ENVIO" })
  }

  // 6. REVERTIR (Regresa a PENDIENTE_VALIDACION)
  const handleRevertOrder = async () => {
    try {
      const { error } = await supabase
        .from('pedido')
        .update({ estado_pedido: 'PENDIENTE_VALIDACION' })
        .eq('pedido_id', revertDialog.orderId)
      
      if(error) throw error

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === revertDialog.orderId) {
            setSuccessMessage(`Pedido #${revertDialog.orderId} revertido a Pendiente de Validación.`)
            setTimeout(() => setSuccessMessage(null), 5000)
            return { ...order, status: "PENDIENTE_VALIDACION" }
          }
          return order
        })
      )
    } catch(err) {
      console.error(err)
    }
    setRevertDialog({ isOpen: false, orderId: "" })
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
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

      <div className="space-y-4">
        {isLoading ? (
            <div className="text-center py-10">Cargando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No se encontraron pedidos en esta sección.</div>
        ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                    onClick={() => setSelectedVoucher(order.voucherUrl || null)}
                    disabled={!order.voucherUrl}
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

                {/* MOSTRAR DROPDOWN DE ESTADO SOLO SI ESTÁ CONFIRMADO 
                   (Es decir, si está en el flujo logístico)
                */}
                {["PENDIENTE_ENVIO", "ENVIADO", "RECIBIDO"].includes(order.status) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">Estado:</span>
                      </div>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleTrackingStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[180px] bg-white border-blue-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDIENTE_ENVIO">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              Por Enviar
                            </div>
                          </SelectItem>
                          <SelectItem value="ENVIADO">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Enviado
                            </div>
                          </SelectItem>
                          <SelectItem value="RECIBIDO">
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

                {order.status === "RECHAZADO" && (
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
        )))}
      </div>

      {/* MODALES Y DIÁLOGOS DE CONFIRMACIÓN */}
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
                    <div className="flex items-center justify-center px-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Cant.</p>
                        <p className="text-2xl font-bold text-foreground">{product.quantity}</p>
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
              {orders.find((o) => o.id === selectedOrder)?.status === "PENDIENTE_VALIDACION" && (
                <div className="mt-6 flex gap-3">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setConfirmAction({ orderId: selectedOrder, action: "aprobar" })
                      setSelectedOrder(null)
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                   Aprobar
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

      <Dialog open={selectedVoucher !== null} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedVoucher ? (
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <img src={selectedVoucher} alt="Comprobante de pago" className="w-full h-auto" />
              </div>
            ) : (
                <p className="text-center py-8 text-muted-foreground">No hay imagen de voucher disponible.</p>
            )}
          </div>
          <div className="mt-4">
            <Button onClick={() => setSelectedVoucher(null)} className="w-full bg-primary hover:bg-primary/90 text-white">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button onClick={() => setSelectedShipping(null)} className="w-full bg-primary hover:bg-primary/90 text-white">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "aprobar"
                ? `¿Estás seguro de aprobar el pedido #${confirmAction.orderId}? Pasará a la sección Confirmados en estado "Por Enviar".`
                : `¿Estás seguro de rechazar el pedido #${confirmAction?.orderId}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={statusChangeDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setStatusChangeDialog({ ...statusChangeDialog, isOpen: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cambiar estado de envío a "{statusChangeDialog.newStatus}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revertDialog.isOpen}
        onOpenChange={(open) => !open && setRevertDialog({ isOpen: false, orderId: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reversión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de revertir el pedido #{revertDialog.orderId} a "Pendiente de Validación"?
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