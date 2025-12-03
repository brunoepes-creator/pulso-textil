"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Package,
  TrendingUp,
  Palette,
  AlertCircle,
  Loader2,
  ChevronDown
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

// Interfaz alineada con tu vista SQL
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  images: string[]
  availableSizes: string[]
  availableColors: string[]
  // Campos opcionales para compatibilidad futura
  unavailableSizes?: string[]
  unavailableColors?: string[]
}

type StockFilterType = "all" | "low" | "medium" | "high"
type SortFieldType = "name" | "category" | "price" | "stock"

export default function Catalog() {
  // --- ESTADOS DE DATOS ---
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["Todos"])
  const [allColors, setAllColors] = useState<string[]>(["Todos"])
  const [isLoading, setIsLoading] = useState(true)

  // --- ESTADOS DE FILTRO Y ORDENAMIENTO ---
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [stockFilter, setStockFilter] = useState<StockFilterType>("all")

  
  const [sortField, setSortField] = useState<SortFieldType>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // --- ESTADOS DE UI ---
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // 1. CARGAR DATOS DESDE SUPABASE
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from('vista_catalogo_simple').select('*')

        if (error) throw error

        if (data) {
          const formattedProducts: Product[] = data.map((item: any) => ({
            ...item,
            images: item.images && item.images.length > 0 ? item.images : ["/placeholder.svg"],
            availableSizes: item.availableSizes || [],
            availableColors: item.availableColors || []
          }))
          
          setProducts(formattedProducts)
          
          // Extraer categorías únicas
          const uniqueCats = Array.from(new Set(formattedProducts.map(p => p.category))).sort()
          setCategories(["Todos", ...uniqueCats])

          // Extraer colores únicos
          const uniqueCols = Array.from(new Set(formattedProducts.flatMap(p => p.availableColors))).sort()
          setAllColors(["Todos", ...uniqueCols])
        }
      } catch (error) {
        console.error('Error cargando catálogo:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  // 2. HELPERS
  const getStockLevel = (stock: number): "low" | "medium" | "high" => {
    if (stock < 20) return "low"
    if (stock < 40) return "medium"
    return "high"
  }

  const getStockColor = (stock: number) => {
    if (stock >= 40) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (stock >= 20) return "text-blue-600 bg-blue-50 border-blue-200"
    return "text-orange-600 bg-orange-50 border-orange-200" // Rojo/Naranja para bajo stock
  }

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const clearAllFilters = () => {
    setSelectedCategory("Todos")
    setStockFilter("all")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const hasActiveFilters =
    selectedCategory !== "Todos" || stockFilter !== "all" || searchQuery !== ""


  // 3. LÓGICA DE FILTRADO Y ORDENAMIENTO
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStock = stockFilter === "all" || getStockLevel(product.stock) === stockFilter


      return matchesCategory && matchesSearch && matchesStock
    })
  }, [products, selectedCategory, searchQuery, stockFilter])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "price":
          comparison = a.price - b.price
          break
        case "stock":
          comparison = a.stock - b.stock
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredProducts, sortField, sortDirection])

  // 4. PAGINACIÓN
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Reset página al filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, stockFilter, searchQuery])

  const selectedProductData = products.find((p) => p.id === selectedProduct)


  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Inventario de Productos</h2>
        <p className="text-muted-foreground mt-2">Visualiza el stock real de tu base de datos</p>
      </div>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* --- SECCIÓN DE FILTROS --- */}
      <div className="mb-6 space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-5">
          
          {/* Header filtros */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="h-4 w-4 mr-1" /> Limpiar filtros
              </Button>
            )}
          </div>

          {/* Badges de filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== "Todos" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <span>Cat: {selectedCategory}</span>
                  <button onClick={() => setSelectedCategory("Todos")} className="hover:bg-blue-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              )}
              {stockFilter !== "all" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <span>Stock: {stockFilter === "low" ? "Bajo" : stockFilter === "medium" ? "Medio" : "Alto"}</span>
                  <button onClick={() => setStockFilter("all")} className="hover:bg-green-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              )}
            
            </div>
          )}

          {/* Botones Categorías */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2.5 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Categorías</h4>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full transition-all ${selectedCategory === category ? "shadow-sm" : "hover:border-gray-400"}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros Dropdown (Stock y Color) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Stock */}
             <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2.5 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Nivel de Stock</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button variant={stockFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("all")} className="rounded-full">Todos</Button>
                  <Button variant={stockFilter === "low" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("low")} className={`rounded-full ${stockFilter === "low" ? "bg-red-600 hover:bg-red-700" : ""}`}><AlertCircle className="h-3.5 w-3.5 mr-1.5"/> Poco Stock (&lt; 20)</Button>
                  <Button variant={stockFilter === "medium" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("medium")} className={`rounded-full ${stockFilter === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}>Medio (20-39)</Button>
                  <Button variant={stockFilter === "high" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("high")} className={`rounded-full ${stockFilter === "high" ? "bg-green-600 hover:bg-green-700" : ""}`}>Alto (≥ 40)</Button>
                </div>
             </div>
             
            
          </div>

        </div>
      </div>

      {/* --- TABLA DE RESULTADOS --- */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-2">Producto <ArrowUpDown className="h-4 w-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("category")}>
                  <div className="flex items-center gap-2">Categoría <ArrowUpDown className="h-4 w-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("price")}>
                  <div className="flex items-center gap-2">Precio <ArrowUpDown className="h-4 w-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("stock")}>
                  <div className="flex items-center gap-2">Stock <ArrowUpDown className="h-4 w-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tallas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 font-normal">{product.category}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-blue-600">S/ {product.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={`${getStockColor(product.stock)} font-medium border`}>
                      {product.stock} unid.
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.availableSizes.slice(0, 3).map((size) => (
                        <Badge key={size} variant="secondary" className="text-xs bg-white border-gray-200 text-gray-600 font-normal">{size}</Badge>
                      ))}
                      {product.availableSizes.length > 3 && <span className="text-xs text-gray-400">...</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.availableColors.slice(0, 2).map((color) => (
                        <Badge key={color} variant="secondary" className="text-xs bg-white border-gray-200 text-gray-600 font-normal">{color}</Badge>
                      ))}
                      {product.availableColors.length > 2 && <span className="text-xs text-gray-400">...</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => {setSelectedProduct(product.id); setSelectedImageIndex(0)}} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, sortedProducts.length)} de {sortedProducts.length} productos
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="px-4 py-2 text-sm">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle */}
      <Dialog open={selectedProduct !== null} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-bold">{selectedProductData?.name}</DialogTitle>
          </DialogHeader>

          {selectedProductData && (
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Images */}
              <div className="bg-gray-50 p-6 flex flex-col gap-4 border-r border-gray-100">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                  <Image
                    src={selectedProductData.images[selectedImageIndex] || "/placeholder.svg"}
                    alt={selectedProductData.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                {selectedProductData.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                    {selectedProductData.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                        } bg-white`}
                      >
                        <Image src={image} alt="" fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-base px-3 py-1 font-normal">{selectedProductData.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</h3>
                        <p className="text-3xl font-bold text-gray-900">S/ {selectedProductData.price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Total</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${selectedProductData.stock < 20 ? 'text-orange-600' : 'text-emerald-600'}`}>{selectedProductData.stock}</span>
                            <span className="text-sm text-gray-500">unid.</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Tallas</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProductData.availableSizes.map((size) => (
                      <div key={size} className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 font-medium text-gray-700 bg-white">{size}</div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Colores</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProductData.availableColors.map((color) => (
                      <Badge key={color} variant="outline" className="px-3 py-1.5 text-sm font-normal border-gray-300 bg-white">{color}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}