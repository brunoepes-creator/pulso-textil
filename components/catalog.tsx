"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
// 1. IMPORTANTE: Importamos el cliente de Supabase
import { supabase } from "@/lib/supabase" 

// Definimos la interfaz para TypeScript basada en tu Vista SQL
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  images: string[]
  availableSizes: string[]
  availableColors: string[]
  // Nota: unavailableSizes/Colors requeriría lógica más compleja, 
  // por ahora usaremos arrays vacíos o calculados en el futuro.
  unavailableSizes?: string[] 
  unavailableColors?: string[]
}

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // 2. Estado para guardar los productos que vienen de la BD
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 3. Función para cargar datos desde Supabase
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true)
      // Consultamos la VISTA que creamos en el Paso 1
      const { data, error } = await supabase
        .from('vista_catalogo_simple') 
        .select('*')

      if (error) {
        console.error('Error cargando catálogo:', error)
      } else {
        // Mapeamos los datos para asegurar que coincidan con la interfaz
        const formattedProducts = data.map((item: any) => ({
          ...item,
          // Aseguramos que images sea un array válido
          images: item.images && item.images.length > 0 ? item.images : ["/placeholder.svg"],
          unavailableSizes: [], // Por ahora vacío
          unavailableColors: [] // Por ahora vacío
        }))
        setProducts(formattedProducts)
      }
      setIsLoading(false)
    }

    fetchCatalog()
  }, [])

  // Extraemos las categorías dinámicamente de los productos cargados
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)))
  const categories = ["Todos", ...uniqueCategories]

  const getStockColor = (stock: number) => {
    if (stock >= 40) return "text-emerald-600 bg-emerald-50"
    if (stock >= 20) return "text-blue-600 bg-blue-50"
    return "text-orange-600 bg-orange-50"
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const selectedProductData = products.find((p) => p.id === selectedProduct)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Inventario de Productos</h2>
        <p className="text-muted-foreground mt-2">Visualiza el stock real de tu base de datos</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3">Categorías</h3>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10">Cargando productos del sistema...</div>
      )}

      {/* Products Table */}
      {!isLoading && (
        <div className="bg-card rounded-lg border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_2fr_2fr_0.5fr] gap-4 p-4 bg-muted/50 font-semibold text-sm">
            <div>Producto</div>
            <div>Categoría</div>
            <div>Precio (desde)</div>
            <div>Stock Total</div>
            <div>Tallas</div>
            <div>Colores</div>
            <div>Detalles</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_2fr_2fr_0.5fr] gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
              >
                <div className="font-medium">{product.name}</div>
                <div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    {product.category}
                  </Badge>
                </div>
                <div className="font-semibold text-blue-600">S/ {product.price.toFixed(2)}</div>
                <div>
                  <Badge className={`${getStockColor(product.stock)} font-semibold`}>{product.stock} unid.</Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {product.availableSizes?.slice(0, 3).map((size) => (
                    <Badge key={size} variant="secondary" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                  {(product.availableSizes?.length || 0) > 3 && <span className="text-xs">...</span>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {product.availableColors?.slice(0, 2).map((color) => (
                    <Badge key={color} variant="secondary" className="text-xs">
                      {color}
                    </Badge>
                  ))}
                  {(product.availableColors?.length || 0) > 2 && <span className="text-xs">...</span>}
                </div>
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(product.id)}>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog (Modal) - Mismo código lógico, solo renderizado condicionalmente */}
      <Dialog
        open={selectedProduct !== null}
        onOpenChange={() => {
          setSelectedProduct(null)
          setSelectedImageIndex(0)
        }}
      >
        <DialogContent className="max-w-2xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedProductData?.name}</DialogTitle>
          </DialogHeader>

          {selectedProductData && (
            <div className="grid md:grid-cols-2 gap-6 py-4">
              {/* Product Images Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                   {/* Usamos una imagen por defecto si la URL viene vacía */}
                  <Image
                    src={selectedProductData.images[selectedImageIndex]?.startsWith('http') 
                          ? selectedProductData.images[selectedImageIndex] 
                          : "/placeholder.svg"}
                    alt={selectedProductData.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {selectedProductData.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProductData.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index ? "border-blue-600" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={image.startsWith('http') ? image : "/placeholder.svg"}
                          alt={`View ${index}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Categoría</h3>
                  <p className="text-base">{selectedProductData.category}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Precio Base</h3>
                  <p className="text-3xl font-bold text-blue-600">S/ {selectedProductData.price.toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Stock Total</h3>
                  <p className="text-base">{selectedProductData.stock} unidades</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tallas</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProductData.availableSizes?.map((size) => (
                      <Badge key={size} className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Colores</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProductData.availableColors?.map((color) => (
                      <Badge key={color} className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {color}
                      </Badge>
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