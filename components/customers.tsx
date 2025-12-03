"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Eye,
  Phone,
  User,
  ArrowLeft,
  Package,
  MapPin,
  FileText,
  Pencil,
  ArrowUpDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  name: string
  quantity: number
  price: number
  variant: string
}

interface Order {
  id: string
  date: string
  total: number
  status: "pending" | "confirmed" | "rejected"
  items: OrderItem[]
  voucherUrls: string[] // NUEVO: Array para las URLs de los vouchers
}

interface Customer {
  id: string
  dbId: number
  firstName: string
  lastName: string
  phone: string
  referencePhone: string
  address: string
  reference: string
  location: string
  totalOrders: number
  orders: Order[]
}

export default function Customers() {
  const { toast } = useToast()
  
  const [searchName, setSearchName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  
  // NUEVOS ESTADOS PARA EL VOUCHER
  const [selectedVoucher, setSelectedVoucher] = useState<string[] | null>(null)
  const [selectedVoucherImageIndex, setSelectedVoucherImageIndex] = useState(0)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"name" | "phone" | "location" | "orders">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const itemsPerPage = 25

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    referencePhone: "",
    address: "",
    reference: "",
    location: "",
  })

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      // MODIFICADO: Agregamos 'comprobantes_pedido (url_comprobante)' a la consulta
      const { data, error } = await supabase
        .from('cliente_final')
        .select(`
          *,
          pedido (
            pedido_id,
            fecha_creacion,
            monto_total,
            estado_pedido,
            comprobantes_pedido ( url_comprobante ),
            detalle_pedido (
              cantidad,
              precio_unitario,
              variacion_producto (
                talla_producto (nombre_talla),
                color_producto (nombre_color),
                producto (nombre_producto)
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedCustomers: Customer[] = data.map((client: any) => {
          const fullName = client.nombre_cliente || ""
          const nameParts = fullName.split(" ")
          const firstName = nameParts[0] || ""
          const lastName = nameParts.slice(1).join(" ") || ""

          const clientOrders: Order[] = (client.pedido || []).map((p: any) => ({
            id: `#${p.pedido_id}`,
            date: new Date(p.fecha_creacion).toLocaleDateString("es-PE"),
            total: p.monto_total,
            status: p.estado_pedido === 'PENDIENTE_VALIDACION' ? 'pending' 
                   : p.estado_pedido === 'RECHAZADO' ? 'rejected' 
                   : 'confirmed',
            // MODIFICADO: Mapeamos los vouchers
            voucherUrls: p.comprobantes_pedido?.map((c: any) => c.url_comprobante) || [],
            items: (p.detalle_pedido || []).map((d: any) => ({
              name: d.variacion_producto?.producto?.nombre_producto || "Producto",
              quantity: d.cantidad,
              price: d.precio_unitario,
              variant: `${d.variacion_producto?.talla_producto?.nombre_talla || ""} - ${d.variacion_producto?.color_producto?.nombre_color || ""}`
            }))
          }))

          // Ordenamos los pedidos del más reciente al más antiguo para la vista
          clientOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          return {
            id: `C${client.cliente_final_id}`,
            dbId: client.cliente_final_id,
            firstName,
            lastName,
            phone: client.telefono_cliente,
            referencePhone: client.telefono_referencia || "",
            address: client.direccion_envio || "",
            reference: client.referencia_ubicacion || "",
            location: client.distrito || "",
            totalOrders: clientOrders.length,
            orders: clientOrders
          }
        })
        setCustomers(formattedCustomers)
      }
    } catch (error) {
      console.error("Error cargando clientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const searchResults = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
    const nameMatch = searchName
      ? fullName.includes(searchName.toLowerCase())
      : true
    const phoneMatch = searchPhone ? customer.phone.includes(searchPhone) : true

    return nameMatch && phoneMatch
  })

  const handleSort = (field: "name" | "phone" | "location" | "orders") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedResults = [...searchResults].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        break
      case "phone":
        comparison = a.phone.localeCompare(b.phone)
        break
      case "location":
        comparison = a.location.localeCompare(b.location)
        break
      case "orders":
        comparison = a.totalOrders - b.totalOrders
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage)
  const paginatedResults = sortedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "confirmed":
        return "Confirmado"
      case "rejected":
        return "Rechazado"
      default:
        return status
    }
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditForm({
        firstName: selectedCustomer.firstName,
        lastName: selectedCustomer.lastName,
        referencePhone: selectedCustomer.referencePhone,
        address: selectedCustomer.address,
        reference: selectedCustomer.reference,
        location: selectedCustomer.location,
      })
      setIsEditModalOpen(true)
    }
  }

  const handleSaveEdit = () => {
    setIsSaveConfirmOpen(true)
  }

  const confirmSaveEdit = async () => {
    if (!selectedCustomer) return
    
    setIsSaving(true)
    setIsSaveConfirmOpen(false)

    try {
      const fullName = `${editForm.firstName} ${editForm.lastName}`.trim()

      const { error } = await supabase
        .from('cliente_final')
        .update({
          nombre_cliente: fullName,
          telefono_referencia: editForm.referencePhone,
          distrito: editForm.location,
          direccion_envio: editForm.address,
          referencia_ubicacion: editForm.reference,
          updated_at: new Date().toISOString()
        })
        .eq('cliente_final_id', selectedCustomer.dbId)

      if (error) throw error

      const updatedCustomer = {
        ...selectedCustomer,
        ...editForm,
      }
      
      setCustomers(prev => prev.map(c => c.dbId === selectedCustomer.dbId ? updatedCustomer : c))
      setSelectedCustomer(updatedCustomer)
      
      setIsEditModalOpen(false)
      toast({
        title: "Actualizado",
        description: "Los datos del cliente se guardaron correctamente.",
      })

    } catch (error: any) {
      console.error("Error actualizando cliente:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente: " + error.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (selectedCustomer) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Button>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">Cliente ID: {selectedCustomer.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Package className="h-3 w-3 mr-1 inline" />
                    {selectedCustomer.totalOrders} pedidos
                  </Badge>
                  <Button onClick={handleEditCustomer} variant="outline" className="gap-2 bg-transparent">
                    <Pencil className="h-4 w-4" />
                    Editar Datos
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                    Información de Contacto
                  </h3>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Teléfono Principal</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Teléfono de Referencia</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.referencePhone || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                    Dirección de Entrega
                  </h3>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Ubicación</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.location || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Dirección</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.address || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Referencia</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.reference || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Historial de Pedidos
              </h2>

              <div className="space-y-3">
                {selectedCustomer.orders.length === 0 ? (
                    <p className="text-muted-foreground text-sm p-4 text-center bg-gray-50 rounded">Este cliente aún no tiene pedidos registrados.</p>
                ) : (
                    selectedCustomer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{order.id}</p>
                          <p className="text-xs text-gray-500">Fecha: {order.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                        <p className="text-xl font-bold text-blue-600">S/ {Number(order.total).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">PRODUCTOS ({order.items.length})</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-sm bg-gray-50 p-2.5 rounded">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.variant}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                              <p className="font-semibold text-gray-900">S/ {Number(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MODIFICADO: BOTONES DE ACCIÓN */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDetailOrder(order)} className="gap-2">
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedVoucher(order.voucherUrls)
                          setSelectedVoucherImageIndex(0)
                        }}
                        disabled={!order.voucherUrls || order.voucherUrls.length === 0}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Ver Voucher
                      </Button>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>

          {/* MODAL DETALLE PEDIDO */}
          <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Detalle del Pedido {detailOrder?.id}</DialogTitle>
                <DialogDescription>Información completa del pedido</DialogDescription>
              </DialogHeader>

              {detailOrder && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fecha del Pedido</p>
                      <p className="font-semibold text-gray-900">{detailOrder.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estado</p>
                      <Badge className={getStatusColor(detailOrder.status)}>{getStatusLabel(detailOrder.status)}</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                    <div className="space-y-3">
                      {detailOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500 mt-1">Variante: {item.variant}</p>
                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">S/ {Number(item.price).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">por unidad</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-900">Total del Pedido</p>
                      <p className="text-2xl font-bold text-blue-600">S/ {Number(detailOrder.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* MODAL VOUCHER (GALERÍA) */}
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
                    <div className="rounded-lg overflow-hidden border border-border bg-muted relative flex justify-center bg-black/5">
                      <img
                        src={selectedVoucher[selectedVoucherImageIndex] || "/placeholder.svg"}
                        alt={`Comprobante de pago ${selectedVoucherImageIndex + 1}`}
                        className="w-auto h-auto max-h-[500px] object-contain"
                      />

                      {selectedVoucher.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {selectedVoucherImageIndex + 1} / {selectedVoucher.length}
                        </div>
                      )}
                    </div>

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

                    {selectedVoucher.length > 1 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
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
                          size="sm"
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
                  onClick={() => setSelectedVoucher(null)}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* MODAL EDICIÓN CLIENTE */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Datos del Cliente</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">Nombres</Label>
                    <Input
                      id="edit-firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Apellidos</Label>
                    <Input
                      id="edit-lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Teléfono Principal</Label>
                  <Input id="edit-phone" value={selectedCustomer?.phone || ""} disabled className="bg-gray-100" />
                  <p className="text-xs text-gray-500">El teléfono principal no se puede editar</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-referencePhone">Teléfono de Referencia</Label>
                  <Input
                    id="edit-referencePhone"
                    value={editForm.referencePhone}
                    onChange={(e) => setEditForm({ ...editForm, referencePhone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Distrito / Ubicación</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">Dirección</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reference">Referencia</Label>
                  <Input
                    id="edit-reference"
                    value={editForm.reference}
                    onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Cambios</DialogTitle>
                <DialogDescription>¿Está seguro de guardar los cambios realizados al cliente?</DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmSaveEdit}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // VISTA PRINCIPAL (TABLA)
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Búsqueda de Clientes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <Input
              placeholder="Buscar por nombre..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <Input
              placeholder="Buscar por teléfono..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
      ) : searchResults.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Cliente
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "name" && (
                        <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center gap-2">
                      Teléfono
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "phone" && (
                        <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("location")}
                  >
                    <div className="flex items-center gap-2">
                      Ubicación
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "location" && (
                        <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("orders")}
                  >
                    <div className="flex items-center gap-2">
                      Pedidos
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "orders" && (
                        <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedResults.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {customer.location || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{customer.totalOrders} pedidos</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                        className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Ficha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, sortedResults.length)} de {sortedResults.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700 px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron clientes.</p>
          </div>
      )}
    </div>
  )
}