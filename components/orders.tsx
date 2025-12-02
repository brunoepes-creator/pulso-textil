"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, FileText, Check, X, MapPin, Package, ChevronLeft, ChevronRight } from "lucide-react"
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

// 1. Tipos de estado actualizados
type OrderStatus = "PENDIENTE_VALIDACION" | "PENDIENTE_ENVIO" | "ENVIADO" | "RECIBIDO" | "RECHAZADO" | "REPROGRAMADO"

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
  voucherUrls?: string[] // Array de URLs para los comprobantes
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
  
  // Estado para el voucher ahora soporta array de imágenes
  const [selectedVoucher, setSelectedVoucher] = useState<string[] | null>(null)
  const [selectedVoucherImageIndex, setSelectedVoucherImageIndex] = useState(0)
  
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

  // 2. Lógica de filtrado por Pestañas
  const filteredOrders = orders
    .filter((order) => {
      if (activeTab === "todos") {
        return ["PENDIENTE_VALIDACION", "PENDIENTE_ENVIO", "ENVIADO", "RECIBIDO", "RECHAZADO", "REPROGRAMADO"].includes(order.status)
      }
      
      if (activeTab === "pendientes") {
        return order.status === "PENDIENTE_VALIDACION"
      }
      
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

  // 3. Cargar Pedidos desde Supabase
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
          comprobantes_pedido (
            url_comprobante
          ),
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
          status: item.estado_pedido as OrderStatus,
          date: new Date(item.fecha_creacion).toLocaleDateString('es-PE'),
          district: item.cliente_final?.distrito || "",
          address: item.cliente_final?.direccion_envio || "",
          reference: item.cliente_final?.referencia_ubicacion || "",
          // Mapeamos el array de comprobantes a un array de strings (URLs)
          voucherUrls: item.comprobantes_pedido?.map((c: any) => c.url_comprobante) || [],
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

  // Aprobar o Rechazar
  const handleConfirmAction = async () => {
    if (!confirmAction) return

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
                ? `El pedido #${confirmAction.orderId} ha sido aprobado.`
                : `El pedido #${confirmAction.orderId} ha sido rechazado.`
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

  // Cambiar Estado Logístico
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

  // Revertir Pedido
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
            setSuccessMessage(`El pedido #${revertDialog.orderId} ha sido revertido a Pendientes.`)
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
                    onClick={() => {
                        setSelectedVoucher(order.voucherUrls || [])
                        setSelectedVoucherImageIndex(0)
                    }}
                    disabled={!order.voucherUrls || order.voucherUrls.length === 0}
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

      {/* Voucher Modal - Gallery with Multiple Images */}
      <Dialog
        open={selectedVoucher !== null}
        onOpenChange={() => {
          setSelectedVoucher(null)
          setSelectedVoucherImageIndex(0)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Comprobante de Pago</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedVoucher && selectedVoucher.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image Display */}
                <div className="rounded-lg overflow-hidden border border-border bg-muted relative flex justify-center bg-black/5">
                  <img
                    src={selectedVoucher[selectedVoucherImageIndex] || "/placeholder.svg"}
                    alt={`Comprobante de pago ${selectedVoucherImageIndex + 1}`}
                    className="w-auto h-auto max-h-[500px] object-contain"
                  />

                  {/* Image Counter Badge */}
                  {selectedVoucher.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedVoucherImageIndex + 1} / {selectedVoucher.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {selectedVoucher.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedVoucher.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVoucherImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedVoucherImageIndex === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation Buttons */}
                {selectedVoucher.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSelectedVoucherImageIndex((prev) =>
                          prev === 0 ? selectedVoucher.length - 1 : prev - 1,
                        )
                      }
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSelectedVoucherImageIndex((prev) =>
                          prev === selectedVoucher.length - 1 ? 0 : prev + 1,
                        )
                      }
                      className="flex-1"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
                <p className="text-center py-8 text-muted-foreground">No hay imágenes disponibles.</p>
            )}
          </div>

          <div className="mt-4">
            <Button
              onClick={() => {
                setSelectedVoucher(null)
                setSelectedVoucherImageIndex(0)
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
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
                ? `¿Validar el pago del pedido #${confirmAction.orderId}? Pasará a estado "Por Enviar".`
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