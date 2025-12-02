"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, Pencil, Trash2, Upload, AlertCircle, X, Check, Loader2, 
  ChevronLeft, ChevronRight, ArrowUpDown 
} from "lucide-react"
import Image from "next/image"
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
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

// --- INTERFACES ---
interface Product {
  id: number
  name: string
  category: string
  categoryId: number
  price: number
  stock: number
  image: string
  description?: string
  brand?: string
  material?: string
  variants?: Variant[]
}

interface Variant {
  id?: number
  size: string
  sizeId: number
  color: string
  colorId: number
  sku: string
  price: number
  stock: number
  image?: string
}

interface Category {
  id: number
  name: string
  image: string
  productCount: number
  description?: string
}

interface Size {
  id: number
  name: string
  // Eliminada descripción de la interfaz de Talla
}

interface Color {
  id: number
  name: string
}

type SortKey = "name" | "category" | "price" | "stock" | "productCount" | "description"

export default function AdminPanel() {
  const { toast } = useToast()
  const EMPRENDEDOR_ID = 1

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "sizes" | "colors">("products")
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sizesList, setSizesList] = useState<Size[]>([])
  const [colorsList, setColorsList] = useState<Color[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  })

  // Modales
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [isNewSizeModalOpen, setIsNewSizeModalOpen] = useState(false)
  const [isEditSizeModalOpen, setIsEditSizeModalOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)

  const [newColor, setNewColor] = useState("")

  // Alertas
  const [deleteError, setDeleteError] = useState<string>("")
  const [showDeleteError, setShowDeleteError] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: number } | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string>("")
  const [validationError, setValidationError] = useState("")

  // --- ESTADOS DE FORMULARIO ---
  const [newProductName, setNewProductName] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [newProductCategory, setNewProductCategory] = useState<string>("")
  const [newProductBrand, setNewProductBrand] = useState("Propia")
  const [newProductMaterial, setNewProductMaterial] = useState("Algodón")
  
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  
  const [bulkPrice, setBulkPrice] = useState<string>("")
  const [bulkStock, setBulkStock] = useState<string>("")

  // Estados auxiliares
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>("")

  // --- CARGA INICIAL ---
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: catsData } = await supabase.from('producto_categoria').select('*')
      const { data: sizesData } = await supabase.from('talla_producto').select('*')
      const { data: colorsData } = await supabase.from('color_producto').select('*')
      const { data: prodsData } = await supabase
        .from('producto')
        .select(`
          *,
          producto_categoria (nombre_categoria),
          marca_producto (nombre_marca),
          variacion_producto (
            variacion_producto_id,
            precio_producto,
            stock_cantidad_producto,
            codigo_producto,
            talla_producto (talla_producto_id, nombre_talla),
            color_producto (color_producto_id, nombre_color)
          )
        `)
        .order('producto_id', { ascending: false })
      
      if (catsData) {
        const catsWithCount = await Promise.all(catsData.map(async (cat: any) => {
          const { count } = await supabase.from('producto').select('*', { count: 'exact', head: true }).eq('producto_categoria_id', cat.producto_categoria_id)
          return {
            id: cat.producto_categoria_id,
            name: cat.nombre_categoria,
            image: cat.imagen_categoria || "", 
            description: "Categoría",
            productCount: count || 0
          }
        }))
        setCategories(catsWithCount)
      }

      if (sizesData) {
        setSizesList(sizesData.map((s: any) => ({ 
          id: s.talla_producto_id, 
          name: s.nombre_talla
        })))
      }

      if (colorsData) {
        setColorsList(colorsData.map((c: any) => ({ id: c.color_producto_id, name: c.nombre_color })))
      }

      if (prodsData) {
        const formattedProds: Product[] = prodsData.map((p: any) => {
          const vars = p.variacion_producto || []
          const totalStock = vars.reduce((acc: number, v: any) => acc + (v.stock_cantidad_producto || 0), 0)
          const avgPrice = vars.length > 0 ? vars[0].precio_producto : 0
          
          return {
            id: p.producto_id,
            name: p.nombre_producto,
            description: p.descripcion_producto,
            category: p.producto_categoria?.nombre_categoria || "Sin categoría",
            categoryId: p.producto_categoria_id,
            brand: p.marca_producto?.nombre_marca || "Propia",
            material: p.material_producto,
            price: avgPrice,
            stock: totalStock,
            image: "/placeholder.svg",
            variants: vars.map((v: any) => ({
              id: v.variacion_producto_id,
              size: v.talla_producto?.nombre_talla,
              sizeId: v.talla_producto?.talla_producto_id,
              color: v.color_producto?.nombre_color,
              colorId: v.color_producto?.color_producto_id,
              sku: v.codigo_producto,
              price: v.precio_producto,
              stock: v.stock_cantidad_producto
            }))
          }
        })
        setProducts(formattedProds)
      }

    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSortConfig({ key: "name", direction: "asc" })
  }, [activeTab])

  // --- HELPERS ---
  const sortData = <T extends Product | Category | Size>(data: T[]) => {
    const sortedData = [...data]
    sortedData.sort((a: any, b: any) => {
      if (!sortConfig.key) return 0
      
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      if (aValue === undefined || aValue === null) aValue = ""
      if (bValue === undefined || bValue === null) bValue = ""

      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
    return sortedData
  }

  const getPaginatedData = (data: any[]) => {
    const sorted = sortData(data)
    const totalPages = Math.ceil(sorted.length / itemsPerPage)
    const paginatedItems = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    return { paginatedItems, totalPages }
  }

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const goToPage = (page: number, totalPages: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // --- RESET FORM ---
  const resetForm = () => {
    setNewProductName("")
    setNewProductDescription("")
    setNewProductCategory("")
    setSelectedSizes([])
    setSelectedColors([])
    setVariants([])
    setBulkPrice("")
    setBulkStock("")
    setEditingProduct(null)
    setFormName("")
    setFormDesc("")
    // Variables de imagen reseteadas correctamente
    setCategoryImageFile(null)
    setCategoryImagePreview("")
    setImageUploadError("")
    setValidationError("")
    setEditingCategory(null)
    setEditingSize(null)
  }

  // --- HANDLERS IMAGEN ---
  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        setImageUploadError("Solo JPG/PNG.")
        return
      }
      setImageUploadError("")
      setCategoryImageFile(file)
      setCategoryImagePreview(URL.createObjectURL(file))
    }
  }

  // --- LOGICA VARIANTES ---
  const generateVariants = () => {
    const newVariants: Variant[] = []
    selectedSizes.forEach((sizeId) => {
      selectedColors.forEach((colorId) => {
        const sizeObj = sizesList.find(s => s.id === sizeId)
        const colorObj = colorsList.find(c => c.id === colorId)
        if (sizeObj && colorObj) {
          const sku = `POL-${sizeObj.name}-${colorObj.name.substring(0, 3).toUpperCase()}`
          newVariants.push({
            size: sizeObj.name, sizeId: sizeObj.id,
            color: colorObj.name, colorId: colorObj.id,
            sku, price: 0, stock: 0,
          })
        }
      })
    })
    setVariants(newVariants)
  }

  useEffect(() => {
    if (isNewProductModalOpen && selectedSizes.length > 0 && selectedColors.length > 0) {
      generateVariants()
    }
  }, [selectedSizes, selectedColors, isNewProductModalOpen])

  const toggleSize = (sizeId: number) => { setSelectedSizes((prev) => (prev.includes(sizeId) ? prev.filter((s) => s !== sizeId) : [...prev, sizeId])) }
  const toggleColor = (colorId: number) => { setSelectedColors((prev) => (prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId])) }
  const applyBulkPricing = () => {
    const price = parseFloat(bulkPrice) || 0
    const stock = parseInt(bulkStock) || 0
    setVariants((prev) => prev.map((v) => ({ ...v, price, stock })))
  }
  const updateVariant = (index: number, field: "price" | "stock", value: number) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  // --- CRUD ---
  const handleSaveProduct = async () => {
    if (!newProductName || !newProductCategory || variants.length === 0) {
      setValidationError("Completa los campos obligatorios y genera variantes.")
      return
    }
    setIsSaving(true)
    setValidationError("")
    try {
      const { data: prodData, error: prodError } = await supabase.from('producto').insert([{
          nombre_producto: newProductName, descripcion_producto: newProductDescription,
          material_producto: newProductMaterial, producto_categoria_id: parseInt(newProductCategory),
          marca_producto_id: 1, emprendedor_id: EMPRENDEDOR_ID
      }]).select()
      if (prodError) throw prodError
      const newProdId = prodData[0].producto_id
      const variantsToInsert = variants.map(v => ({
        producto_id: newProdId, talla_producto_id: v.sizeId, color_producto_id: v.colorId,
        precio_producto: v.price, stock_cantidad_producto: v.stock, codigo_producto: v.sku,
        estaciones_producto_id: 1, emprendedor_id: EMPRENDEDOR_ID
      }))
      const { error: varError } = await supabase.from('variacion_producto').insert(variantsToInsert)
      if (varError) throw varError
      toast({ title: "Éxito", description: "Producto creado correctamente" }); setIsNewProductModalOpen(false); resetForm(); fetchData()
    } catch (error: any) { setValidationError(error.message) } finally { setIsSaving(false) }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || !newProductName) return
    setIsSaving(true)
    try {
      await supabase.from('producto').update({
          nombre_producto: newProductName, descripcion_producto: newProductDescription,
          producto_categoria_id: parseInt(newProductCategory), material_producto: newProductMaterial
      }).eq('producto_id', editingProduct.id)
      for (const v of variants) {
        if (v.id) { await supabase.from('variacion_producto').update({ precio_producto: v.price, stock_cantidad_producto: v.stock }).eq('variacion_producto_id', v.id) }
      }
      toast({ title: "Éxito", description: "Producto actualizado" }); setIsEditProductModalOpen(false); resetForm(); fetchData()
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleSaveCategory = async () => {
    if(!formName) return
    setIsSaving(true)
    const imageUrl = categoryImageFile ? categoryImageFile.name : "/placeholder.svg"
    try {
      await supabase.from('producto_categoria').insert([{ 
          nombre_categoria: formName, imagen_categoria: imageUrl, 
          emprendedor_id: EMPRENDEDOR_ID, producto_genero_id: 1 
      }])
      setIsNewCategoryModalOpen(false); resetForm(); fetchData()
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleUpdateCategory = async () => {
    if(!editingCategory || !formName) return
    setIsSaving(true)
    const imageUrl = categoryImageFile ? categoryImageFile.name : editingCategory.image
    try {
      await supabase.from('producto_categoria').update({ nombre_categoria: formName, imagen_categoria: imageUrl }).eq('producto_categoria_id', editingCategory.id)
      setIsEditCategoryModalOpen(false); resetForm(); fetchData()
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleSaveSize = async () => {
    if(!formName) return
    setIsSaving(true)
    try {
      const nextOrder = sizesList.length + 1
      await supabase.from('talla_producto').insert([{ nombre_talla: formName, emprendedor_id: EMPRENDEDOR_ID }])
      setIsNewSizeModalOpen(false); resetForm(); fetchData()
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleUpdateSize = async () => {
    if(!editingSize || !formName) return
    setIsSaving(true)
    try {
      await supabase.from('talla_producto').update({ nombre_talla: formName }).eq('talla_producto_id', editingSize.id)
      setIsEditSizeModalOpen(false); resetForm(); fetchData()
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleAddColor = async () => {
    if (!newColor.trim()) return
    await supabase.from('color_producto').insert([{ nombre_color: newColor, emprendedor_id: EMPRENDEDOR_ID }])
    setNewColor(""); fetchData()
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    const { type, id } = itemToDelete
    setShowDeleteError(false)
    try {
      if (type === 'product') {
        const { data: vars } = await supabase.from('variacion_producto').select('variacion_producto_id').eq('producto_id', id)
        const vIds = vars?.map(v => v.variacion_producto_id) || []
        if (vIds.length > 0) {
            const { count } = await supabase.from('detalle_pedido').select('*', { count: 'exact', head: true }).in('variacion_producto_id', vIds)
            if (count && count > 0) { setDeleteError(`No se puede eliminar este producto porque está presente en ${count} pedido(s).`); setShowDeleteError(true); setItemToDelete(null); return }
        }
        await supabase.from('variacion_producto').delete().eq('producto_id', id)
        await supabase.from('producto').delete().eq('producto_id', id)
      } else if (type === 'category') {
        const { count } = await supabase.from('producto').select('*', { count: 'exact', head: true }).eq('producto_categoria_id', id)
        if (count && count > 0) { setDeleteError(`No se puede eliminar esta categoría porque tiene ${count} productos asociados.`); setShowDeleteError(true); setItemToDelete(null); return }
        await supabase.from('producto_categoria').delete().eq('producto_categoria_id', id)
      } else if (type === 'size') {
         const { count } = await supabase.from('variacion_producto').select('*', { count: 'exact', head: true }).eq('talla_producto_id', id)
         if (count && count > 0) { setDeleteError("No se puede eliminar esta talla porque está en uso en productos."); setShowDeleteError(true); setItemToDelete(null); return }
         await supabase.from('talla_producto').delete().eq('talla_producto_id', id)
      } else if (type === 'color') {
        const { count } = await supabase.from('variacion_producto').select('*', { count: 'exact', head: true }).eq('color_producto_id', id)
        if (count && count > 0) { setDeleteError("No se puede eliminar este color porque está en uso en productos."); setShowDeleteError(true); setItemToDelete(null); return }
        await supabase.from('color_producto').delete().eq('color_producto_id', id)
      }
      toast({ title: "Eliminado", description: "Elemento eliminado correctamente" }); fetchData()
    } catch (error: any) { toast({ title: "Error", description: "Error al eliminar", variant: "destructive" }) }
    setItemToDelete(null)
  }

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod); setNewProductName(prod.name); setNewProductDescription(prod.description || "")
    setNewProductCategory(prod.categoryId.toString()); setNewProductMaterial(prod.material || "")
    setVariants(prod.variants || []); setIsEditProductModalOpen(true)
  }
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat); setFormName(cat.name); setFormDesc(cat.description || "")
    setCategoryImagePreview(cat.image.startsWith('http') ? cat.image : "/placeholder.svg")
    setIsEditCategoryModalOpen(true)
  }
  const openEditSize = (size: Size) => { 
    setEditingSize(size); setFormName(size.name); setFormDesc("") 
    setIsEditSizeModalOpen(true) 
  }

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => (
    <div className="px-4 py-4 border-t flex items-center justify-between bg-white">
        <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
    </div>
  )

  const SortableHeader = ({ label, sortKey, currentConfig, onSort }: { label: string, sortKey: SortKey, currentConfig: any, onSort: (k: SortKey) => void }) => (
    <th className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground uppercase tracking-wider" onClick={() => onSort(sortKey)}>
        <div className="flex items-center gap-2">
            {label}
            <ArrowUpDown className={`h-4 w-4 ${currentConfig.key === sortKey ? "text-primary" : "text-muted-foreground/50"}`} />
        </div>
    </th>
  )

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Administración</h2>
        <p className="text-muted-foreground mt-2">Gestiona tu inventario, categorías y atributos.</p>
      </div>

      <div className="mb-6 border-b">
        <div className="flex gap-8 overflow-x-auto">
          {['products', 'categories', 'sizes', 'colors'].map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 px-1 font-medium transition-colors relative capitalize ${activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
               {tab === 'products' ? 'Productos' : tab === 'categories' ? 'Categorías' : tab === 'sizes' ? 'Tallas' : 'Colores'}
               {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
             </button>
          ))}
        </div>
      </div>

      {isLoading ? ( <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> ) : (
        <>
        {/* --- PRODUCTOS --- */}
        {activeTab === "products" && (() => {
             const { paginatedItems, totalPages } = getPaginatedData(products)
             return (
                <>
                <div className="mb-6"><Button className="bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setIsNewProductModalOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nuevo Producto</Button></div>
                <Card>
                    <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">Imágenes</th>
                            <SortableHeader label="Producto" sortKey="name" currentConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Categoría" sortKey="category" currentConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Precio" sortKey="price" currentConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Stock" sortKey="stock" currentConfig={sortConfig} onSort={handleSort} />
                            <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {paginatedItems.map((p: Product) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-4"><div className="w-12 h-12 bg-muted rounded-md overflow-hidden"><Image src={p.image} alt={p.name} width={48} height={48} className="w-full h-full object-cover" /></div></td>
                            <td className="p-4 font-medium text-gray-900">{p.name}</td>
                            <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{p.category}</span></td>
                            <td className="p-4 font-medium text-gray-900">S/ {p.price.toFixed(2)}</td>
                            <td className="p-4 text-gray-500">{p.stock}</td>
                            <td className="p-4 flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditProduct(p)} className="text-primary hover:text-primary/80"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: 'product', id: p.id }) }} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => goToPage(p, totalPages)} />}
                    </CardContent>
                </Card>
                </>
             )
        })()}

        {/* --- CATEGORIAS --- */}
        {activeTab === "categories" && (() => {
            const { paginatedItems, totalPages } = getPaginatedData(categories)
            return (
             <>
             <div className="mb-6"><Button className="bg-primary" onClick={() => { resetForm(); setIsNewCategoryModalOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nueva Categoría</Button></div>
             <Card>
                 <CardContent className="p-0">
                 <table className="w-full">
                     <thead className="bg-gray-50 border-b border-gray-200"><tr>
                         <SortableHeader label="Nombre" sortKey="name" currentConfig={sortConfig} onSort={handleSort} />
                         <SortableHeader label="Productos" sortKey="productCount" currentConfig={sortConfig} onSort={handleSort} />
                         <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">Acciones</th>
                     </tr></thead>
                     <tbody className="divide-y divide-gray-200">
                     {paginatedItems.map((c: Category) => (
                         <tr key={c.id} className="hover:bg-gray-50">
                         <td className="p-4 font-medium flex items-center gap-3 text-gray-900">
                             <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                                <img src={c.image.startsWith('http') ? c.image : "/placeholder.svg"} alt="" className="w-full h-full object-cover"/>
                             </div>
                             {c.name}
                         </td>
                         <td className="p-4 text-gray-500">{c.productCount}</td>
                         <td className="p-4 flex gap-2">
                             <Button variant="ghost" size="sm" onClick={() => openEditCategory(c)} className="text-primary hover:text-primary/80"><Pencil className="w-4 h-4" /></Button>
                             <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: 'category', id: c.id }) }} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                         </td>
                         </tr>
                     ))}
                     </tbody>
                 </table>
                 {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => goToPage(p, totalPages)} />}
                 </CardContent>
             </Card>
             </>
            )
        })()}

        {/* --- TALLAS --- */}
        {activeTab === "sizes" && (() => {
             const { paginatedItems, totalPages } = getPaginatedData(sizesList)
             return (
             <>
             <div className="mb-6"><Button className="bg-primary" onClick={() => { resetForm(); setIsNewSizeModalOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nueva Talla</Button></div>
             <Card>
                 <CardContent className="p-0">
                 <table className="w-full">
                     <thead className="bg-gray-50 border-b border-gray-200"><tr>
                         <SortableHeader label="Nombre" sortKey="name" currentConfig={sortConfig} onSort={()=>{}} />
                         <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">Acciones</th>
                     </tr></thead>
                     <tbody className="divide-y divide-gray-200">
                     {paginatedItems.map((s: Size) => (
                         <tr key={s.id} className="hover:bg-gray-50">
                         <td className="p-4 font-medium text-gray-900">{s.name}</td>
                         <td className="p-4 flex gap-2">
                             <Button variant="ghost" size="sm" onClick={() => openEditSize(s)} className="text-primary hover:text-primary/80"><Pencil className="w-4 h-4" /></Button>
                             <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: 'size', id: s.id }) }} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                         </td>
                         </tr>
                     ))}
                     </tbody>
                 </table>
                 {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => goToPage(p, totalPages)} />}
                 </CardContent>
             </Card>
             </>
             )
        })()}

        {/* --- COLORES --- */}
        {activeTab === "colors" && (
            <Card>
            <CardHeader><CardTitle>Gestión de Colores</CardTitle><CardDescription>Agrega o elimina colores disponibles</CardDescription></CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-6">
                <Input placeholder="Ej: Azul Noche" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="max-w-sm" />
                <Button onClick={handleAddColor}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                {colorsList.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border text-sm font-medium">
                    <span>{c.name}</span>
                    <button onClick={() => { setItemToDelete({ type: 'color', id: c.id }) }} className="text-muted-foreground hover:text-red-600 ml-1"><X className="h-4 w-4" /></button>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>
        )}
        </>
      )}

      {/* --- MODALES DE CREACIÓN --- */}
      {/* Modal Nuevo Producto (Manteniendo tu lógica existente) */}
      <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
            {validationError && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">{validationError}</div>}
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre *</Label><Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Categoría *</Label>
                        <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2"><Label>Descripción</Label><Textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} /></div>
                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">Variantes</h3>
                     <div className="space-y-2"><Label>Tallas *</Label><div className="flex flex-wrap gap-2">{sizesList.map(s => (<Button key={s.id} size="sm" variant={selectedSizes.includes(s.id) ? "default" : "outline"} onClick={() => {setSelectedSizes(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}}>{s.name}</Button>))}</div></div>
                    <div className="space-y-2"><Label>Colores *</Label><div className="flex flex-wrap gap-2">{colorsList.map(c => (<Button key={c.id} size="sm" variant={selectedColors.includes(c.id) ? "default" : "outline"} onClick={() => {setSelectedColors(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}}>{c.name}</Button>))}</div></div>
                    
                    {variants.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-lg border mt-4">
                             <div className="flex gap-2 mb-4 items-end"><div className="flex-1"><Label>Precio Masivo</Label><Input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} /></div><div className="flex-1"><Label>Stock Masivo</Label><Input type="number" value={bulkStock} onChange={e => setBulkStock(e.target.value)} /></div><Button onClick={applyBulkPricing}>Aplicar</Button></div>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                {variants.map((v, idx) => (
                                    <div key={idx} className="flex gap-4 items-center text-sm border-b pb-2">
                                        <span className="w-32 font-medium">{v.size} - {v.color}</span>
                                        <Input className="w-24" type="number" placeholder="Precio" value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value))} />
                                        <Input className="w-24" type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value))} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsNewProductModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveProduct} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" /> : "Guardar Producto"}</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Producto */}
      <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
             <div className="space-y-6 py-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Categoría</Label>
                        <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2"><Label>Descripción</Label><Textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} /></div>
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Variantes Existentes</h4>
                    {variants.map((v, idx) => (
                        <div key={idx} className="flex gap-4 items-center text-sm border-b pb-2 mb-2">
                            <span className="w-32 font-medium">{v.size} - {v.color}</span>
                            <Input className="w-24" type="number" value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value))} />
                            <Input className="w-24" type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value))} />
                        </div>
                    ))}
                </div>
             </div>
             <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsEditProductModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateProduct} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" /> : "Actualizar"}</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Modal Categoria (Nuevo/Editar) */}
      <Dialog open={isNewCategoryModalOpen || isEditCategoryModalOpen} onOpenChange={(open) => !open && (isNewCategoryModalOpen ? setIsNewCategoryModalOpen(false) : setIsEditCategoryModalOpen(false))}>
        <DialogContent>
            <DialogHeader><DialogTitle>{isNewCategoryModalOpen ? "Nueva" : "Editar"} Categoría</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
                <div className="space-y-2">
                    <Label>Imagen de Categoría</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary cursor-pointer bg-muted/30 relative">
                      <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleCategoryImageUpload} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"/>
                      {categoryImagePreview ? <div className="flex justify-center"><img src={categoryImagePreview} alt="" className="h-32 object-contain"/></div> : <div className="flex flex-col items-center"><Upload className="h-8 w-8 text-muted-foreground mb-2"/><p className="text-sm text-muted-foreground">Clic para subir (JPG/PNG)</p></div>}
                    </div>
                    {imageUploadError && <p className="text-red-500 text-xs">{imageUploadError}</p>}
                </div>
                <Button className="w-full" onClick={isNewCategoryModalOpen ? handleSaveCategory : handleUpdateCategory} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : (isNewCategoryModalOpen ? "Guardar" : "Actualizar")}
                </Button>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal Talla (Nuevo/Editar) */}
      <Dialog open={isNewSizeModalOpen || isEditSizeModalOpen} onOpenChange={(open) => !open && (isNewSizeModalOpen ? setIsNewSizeModalOpen(false) : setIsEditSizeModalOpen(false))}>
        <DialogContent>
            <DialogHeader><DialogTitle>{isNewSizeModalOpen ? "Nueva" : "Editar"} Talla</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre (Ej: XL)</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
                <Button className="w-full" onClick={isNewSizeModalOpen ? handleSaveSize : handleUpdateSize} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : (isNewSizeModalOpen ? "Guardar" : "Actualizar")}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Alertas */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteError} onOpenChange={setShowDeleteError}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle className="text-red-600 flex gap-2"><AlertCircle className="h-5 w-5"/> Error</AlertDialogTitle><AlertDialogDescription>{deleteError}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogAction onClick={() => setShowDeleteError(false)}>Entendido</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}