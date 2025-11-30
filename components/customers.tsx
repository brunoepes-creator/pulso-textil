"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { useState } from "react"
import { Search, Eye, Phone, User, ArrowLeft, Package, MapPin, FileText, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Customer {
  id: string
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

interface Order {
  id: string
  date: string
  total: number
  status: "pending" | "confirmed" | "rejected"
  items: {
    name: string
    quantity: number
    price: number
    variant: string
  }[]
}

const mockCustomers: Customer[] = [
  {
    id: "C001",
    firstName: "Juan",
    lastName: "Pérez",
    phone: "51987654321",
    referencePhone: "51912345678",
    address: "Av. Los Alamos 123, Dpto 302",
    reference: "Edificio azul, al costado del parque",
    location: "San Isidro, Lima",
    totalOrders: 3,
    orders: [
      {
        id: "#1024",
        date: "14/01/2025",
        total: 85.0,
        status: "pending",
        items: [{ name: "Polo Básico", quantity: 2, price: 42.5, variant: "M - Azul" }],
      },
      {
        id: "#1015",
        date: "10/01/2025",
        total: 150.0,
        status: "confirmed",
        items: [{ name: "Casaca Premium", quantity: 1, price: 150.0, variant: "L - Negro" }],
      },
      {
        id: "#1008",
        date: "05/01/2025",
        total: 95.0,
        status: "confirmed",
        items: [{ name: "Polo Premium", quantity: 1, price: 95.0, variant: "S - Blanco" }],
      },
    ],
  },
  {
    id: "C002",
    firstName: "Luca",
    lastName: "Modric",
    phone: "51912345678",
    referencePhone: "51987654321",
    address: "Jr. Las Begonias 456, Casa 10",
    reference: "Portón negro, frente a la tienda",
    location: "Miraflores, Lima",
    totalOrders: 2,
    orders: [
      {
        id: "#1023",
        date: "13/01/2025",
        total: 210.0,
        status: "confirmed",
        items: [{ name: "Casaca Executive", quantity: 1, price: 210.0, variant: "XL - Gris" }],
      },
      {
        id: "#1012",
        date: "08/01/2025",
        total: 120.0,
        status: "confirmed",
        items: [{ name: "Polo Casual", quantity: 2, price: 60.0, variant: "M - Verde" }],
      },
    ],
  },
  {
    id: "C003",
    firstName: "Andrés",
    lastName: "Iniesta",
    phone: "51964491182",
    referencePhone: "51923456789",
    address: "Calle Los Eucaliptos 789",
    reference: "Casa amarilla con reja blanca",
    location: "Surco, Lima",
    totalOrders: 1,
    orders: [
      {
        id: "#1025",
        date: "15/01/2025",
        total: 150.0,
        status: "pending",
        items: [{ name: "Chompa Deportiva", quantity: 1, price: 150.0, variant: "L - Azul" }],
      },
    ],
  },
  {
    id: "C004",
    firstName: "María",
    lastName: "García",
    phone: "51998765432",
    referencePhone: "51934567890",
    address: "Av. Javier Prado 234, Of. 501",
    reference: "Edificio corporativo, Torre A",
    location: "San Borja, Lima",
    totalOrders: 4,
    orders: [
      {
        id: "#1020",
        date: "12/01/2025",
        total: 180.0,
        status: "confirmed",
        items: [{ name: "Casaca Premium", quantity: 1, price: 180.0, variant: "M - Negro" }],
      },
      {
        id: "#1018",
        date: "11/01/2025",
        total: 95.0,
        status: "confirmed",
        items: [{ name: "Polo Premium", quantity: 1, price: 95.0, variant: "S - Rojo" }],
      },
    ],
  },
]

export default function Customers() {
  const [searchName, setSearchName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    referencePhone: "",
    address: "",
    reference: "",
    location: "",
  })

  const handleSearch = () => {
    const filtered = mockCustomers.filter((customer) => {
      const nameMatch = searchName
        ? `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchName.toLowerCase())
        : true
      const phoneMatch = searchPhone ? customer.phone.includes(searchPhone) : true

      return nameMatch && phoneMatch
    })

    setSearchResults(filtered)
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

  const confirmSaveEdit = () => {
    if (selectedCustomer) {
      const updatedCustomer = {
        ...selectedCustomer,
        ...editForm,
      }
      setSelectedCustomer(updatedCustomer)
      setIsSaveConfirmOpen(false)
      setIsEditModalOpen(false)
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
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.referencePhone}</p>
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
                      <p className="text-xs text-gray-500 mb-0.5">Distrito</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Distrito</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Referencia</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.reference}</p>
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
                {selectedCustomer.orders.map((order) => (
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
                        <p className="text-xl font-bold text-blue-600">S/ {order.total.toFixed(2)}</p>
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
                              <p className="font-semibold text-gray-900">S/ {item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setDetailOrder(order)} className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalle Completo
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                            <p className="font-bold text-lg text-blue-600">S/ {item.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">por unidad</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-900">Total del Pedido</p>
                      <p className="text-2xl font-bold text-blue-600">S/ {detailOrder.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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
                  <Label htmlFor="edit-location">Distrito</Label>
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
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ... existing save confirmation dialog ... */}
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

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">Busca y administra la información de tus clientes</p>
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

          <Button onClick={handleSearch} className="w-full md:w-auto gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>

        {/* ... existing search results table ... */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distrito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
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
                          {customer.location}
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
                          className="gap-2"
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
          </div>
        )}

        {searchResults.length === 0 && (searchName || searchPhone) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron clientes con los criterios de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}
