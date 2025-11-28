"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Upload, RefreshCw, Layers, Palette, Ruler, Sun, Tag, ArrowUpDown } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

// --- INTERFACES ---
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  image: string
  description?: string
  brand?: string
  material?: string
  sizes?: string[]
  colors?: string[]
  seasons?: string[]
  images?: string[]
  variants?: Variant[]
}

interface Variant {
  size: string
  color: string
  season: string
  sku: string
  price: number
  stock: number
  image?: string
}

interface Category { id: number; name: string }
interface Size { id: number; name: string }
interface Color { id: number; name: string }
interface Season { id: number; name: string }
interface Brand { id: number; name: string }

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "sizes" | "colors" | "seasons" | "brands">("products")
  const [sortCriteria, setSortCriteria] = useState("id-desc")

  // --- ESTADOS DE DATOS MAESTROS ---
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [sizesList, setSizesList] = useState<Size[]>([])
  const [colorsList, setColorsList] = useState<Color[]>([])
  const [seasonsList, setSeasonsList] = useState<Season[]>([])
  const [brandsList, setBrandsList] = useState<Brand[]>([])
  
  // --- ESTADOS DE PRODUCTOS ---
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // --- ESTADOS DE MODALES ---
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false)
  const [masterItemName, setMasterItemName] = useState("")
  const [editingMasterItem, setEditingMasterItem] = useState<{id: number, type: string} | null>(null)

  // --- FORMULARIO DE PRODUCTO ---
  const [newProductName, setNewProductName] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [newProductCategory, setNewProductCategory] = useState("")
  const [newProductBrand, setNewProductBrand] = useState("")
  const [newProductMaterial, setNewProductMaterial] = useState("Algodón")
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [bulkPrice, setBulkPrice] = useState<string>("")
  const [bulkStock, setBulkStock] = useState<string>("")
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("")

  // =================================================================================================
  // 1. CARGA DE DATOS (READ)
  // =================================================================================================
  
  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchSizes(),
      fetchColors(),
      fetchSeasons(),
      fetchBrands()
    ])
    setLoading(false)
  }

  useEffect(() => { fetchAllData() }, [sortCriteria]) 

  const fetchProducts = async () => {
    let orderBy = 'id'; let ascending = false
    switch (sortCriteria) {
      case 'id-desc': orderBy = 'id'; ascending = false; break;
      case 'id-asc': orderBy = 'id'; ascending = true; break;
      case 'name-asc': orderBy = 'name'; ascending = true; break;
      case 'name-desc': orderBy = 'name'; ascending = false; break;
      case 'cat-asc': orderBy = 'category'; ascending = true; break;
      case 'stock-asc': orderBy = 'stock'; ascending = true; break; 
      case 'stock-desc': orderBy = 'stock'; ascending = false; break;
      case 'price-asc': orderBy = 'price'; ascending = true; break; 
      case 'price-desc': orderBy = 'price'; ascending = false; break;
      default: orderBy = 'id'; ascending = false;
    }

    const { data } = await supabase.from('vista_admin_productos').select('*').order(orderBy, { ascending: ascending })
    if (data) {
      setProducts(data.map((item: any) => ({
        id: item.id, name: item.name, category: item.category || 'Sin categoría', price: item.price, stock: item.stock,
        image: item.image ? item.image : "/placeholder.svg", description: item.description, brand: item.brand,
        material: item.material, sizes: [], colors: [], seasons: item.seasons || [], variants: []
      })))
    }
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('producto_categoria').select('producto_categoria_id, nombre_categoria').order('producto_categoria_id', { ascending: true })
    if (data) setCategoriesList(data.map((i: any) => ({ id: i.producto_categoria_id, name: i.nombre_categoria })))
  }
  const fetchSizes = async () => {
    const { data } = await supabase.from('talla_producto').select('talla_producto_id, nombre_talla').order('talla_producto_id', { ascending: true })
    if (data) setSizesList(data.map((i: any) => ({ id: i.talla_producto_id, name: i.nombre_talla })))
  }
  const fetchColors = async () => {
    const { data } = await supabase.from('color_producto').select('color_producto_id, nombre_color').order('color_producto_id', { ascending: true })
    if (data) setColorsList(data.map((i: any) => ({ id: i.color_producto_id, name: i.nombre_color })))
  }
  const fetchSeasons = async () => {
    const { data } = await supabase.from('estaciones_producto').select('estaciones_producto_id, nombre_estaciones').order('estaciones_producto_id', { ascending: true })
    if (data) setSeasonsList(data.map((i: any) => ({ id: i.estaciones_producto_id, name: i.nombre_estaciones })))
  }
  const fetchBrands = async () => {
    const { data } = await supabase.from('marca_producto').select('marca_producto_id, nombre_marca').order('marca_producto_id', { ascending: true })
    if (data) setBrandsList(data.map((i: any) => ({ id: i.marca_producto_id, name: i.nombre_marca })))
  }

  // =================================================================================================
  // 2. GESTIÓN DE MAESTROS (LOGICA DE GUARDADO Y ELIMINADO REAL)
  // =================================================================================================

  const handleOpenMasterModal = (item?: {id: number, name: string}, type?: string) => {
    if (item) {
      setEditingMasterItem({ id: item.id, type: type || activeTab })
      setMasterItemName(item.name)
    } else {
      setEditingMasterItem(null)
      setMasterItemName("")
    }
    setIsMasterModalOpen(true)
  }

  const handleSaveMasterItem = async () => {
    if (!masterItemName.trim()) return
    const type = editingMasterItem ? editingMasterItem.type : activeTab
    
    // Configuración dinámica según la tabla
    let table = "", idField = "", nameField = "", extraFields = {}
    
    switch (type) {
      case "categories": 
        table = "producto_categoria"; idField = "producto_categoria_id"; nameField = "nombre_categoria"; 
        extraFields = { producto_genero_id: 2 }; // Default Genero Hombre
        break;
      case "sizes": 
        table = "talla_producto"; idField = "talla_producto_id"; nameField = "nombre_talla"; 
        break;
      case "colors": 
        table = "color_producto"; idField = "color_producto_id"; nameField = "nombre_color"; 
        break;
      case "seasons": 
        table = "estaciones_producto"; idField = "estaciones_producto_id"; nameField = "nombre_estaciones"; 
        break;
      case "brands": 
        table = "marca_producto"; idField = "marca_producto_id"; nameField = "nombre_marca"; 
        extraFields = { descripcion_marca: "Generada desde Admin" }; 
        break;
    }

    try {
      if (editingMasterItem) {
        // UPDATE
        const { error } = await supabase.from(table).update({ [nameField]: masterItemName }).eq(idField, editingMasterItem.id)
        if(error) throw error
      } else {
        // CREATE
        const payload: any = { 
            [nameField]: masterItemName, 
            emprendedor_id: 1, // Asumimos ID 1
            ...extraFields 
        }
        const { error } = await supabase.from(table).insert([payload])
        if(error) throw error
      }
      
      // Recargar la lista correspondiente
      if (type === "categories") fetchCategories()
      else if (type === "sizes") fetchSizes()
      else if (type === "colors") fetchColors()
      else if (type === "seasons") fetchSeasons()
      else if (type === "brands") fetchBrands()

      setIsMasterModalOpen(false)
      alert(editingMasterItem ? "Actualizado correctamente" : "Creado correctamente")
    } catch (error: any) {
      console.error(error)
      alert("Error al guardar: " + error.message)
    }
  }

  const handleDeleteMasterItem = async (id: number, type: string) => {
    let table = "", idField = ""
    switch (type) {
      case "categories": table = "producto_categoria"; idField = "producto_categoria_id"; break;
      case "sizes": table = "talla_producto"; idField = "talla_producto_id"; break;
      case "colors": table = "color_producto"; idField = "color_producto_id"; break;
      case "seasons": table = "estaciones_producto"; idField = "estaciones_producto_id"; break;
      case "brands": table = "marca_producto"; idField = "marca_producto_id"; break;
    }

    if (!confirm("¿Estás seguro de eliminar este elemento?")) return

    try {
        const { error } = await supabase.from(table).delete().eq(idField, id)
        
        if (error) {
            // Manejo de error de llave foránea (si el item está en uso)
            if (error.code === '23503') {
                alert("No se puede eliminar porque este elemento está siendo usado por uno o más productos. Elimina los productos primero.")
            } else {
                throw error
            }
        } else {
            if (type === "categories") fetchCategories()
            else if (type === "sizes") fetchSizes()
            else if (type === "colors") fetchColors()
            else if (type === "seasons") fetchSeasons()
            else if (type === "brands") fetchBrands()
            alert("Eliminado correctamente")
        }
    } catch (err: any) {
        alert("Error al eliminar: " + err.message)
    }
  }

  // =================================================================================================
  // 3. GESTIÓN DE PRODUCTOS
  // =================================================================================================

  const generateVariants = () => {
    const newVariants: Variant[] = []
    const activeSeasons = selectedSeasons.length > 0 ? selectedSeasons : (seasonsList[0] ? [seasonsList[0].name] : ["Verano"])

    selectedSizes.forEach(size => {
      selectedColors.forEach(color => {
        activeSeasons.forEach(season => {
          const existing = variants.find(v => v.size === size && v.color === color && v.season === season)
          const skuCode = newProductName.substring(0,3).toUpperCase() || "PROD"
          const sku = existing ? existing.sku : `${skuCode}-${size}-${color.substring(0, 3).toUpperCase()}-${season.substring(0,1).toUpperCase()}`
          
          newVariants.push({ 
            size, color, season, sku, 
            price: existing ? existing.price : 0, 
            stock: existing ? existing.stock : 0 
          })
        })
      })
    })
    setVariants(newVariants)
  }

  useEffect(() => {
    if (isNewProductModalOpen || (isEditProductModalOpen && variants.length > 0)) {
        generateVariants()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSizes, selectedColors, selectedSeasons])

  const handleSaveProduct = async (mode: 'create' | 'edit') => {
    if (!newProductName || variants.length === 0) {
      alert("Completa el nombre y selecciona variantes.")
      return
    }
    setUploading(true)
    try {
      let imageUrl = currentImageUrl
      if (productImageFile) {
        const fileName = `${Date.now()}-${productImageFile.name}`
        const { error } = await supabase.storage.from('productos').upload(fileName, productImageFile)
        if (error) throw error
        const { data } = supabase.storage.from('productos').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }

      const variantsForDb = variants.map(v => ({ ...v, image: imageUrl }))
      const rpcName = mode === 'create' ? 'crear_producto_completo' : 'editar_producto_completo'
      const payload: any = {
        p_nombre: newProductName,
        p_descripcion: newProductDescription,
        p_categoria: newProductCategory || (categoriesList[0]?.name || "General"),
        p_marca: newProductBrand || (brandsList[0]?.name || "Propia"),
        p_material: newProductMaterial,
        p_variantes: variantsForDb
      }
      if (mode === 'edit') payload.p_id = editingProductId

      const { error } = await supabase.rpc(rpcName, payload)
      if (error) throw error

      alert("¡Guardado correctamente!")
      setIsNewProductModalOpen(false)
      setIsEditProductModalOpen(false)
      resetForm()
      fetchProducts() 
    } catch (error: any) {
      console.error(error)
      alert("Error: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleEditProductClick = async (product: Product) => {
    setEditingProductId(product.id)
    setNewProductName(product.name)
    setNewProductDescription(product.description || "")
    setNewProductCategory(product.category)
    setNewProductBrand(product.brand || "")
    setNewProductMaterial(product.material || "")
    setCurrentImageUrl(product.image)
    setProductImageFile(null)

    const { data } = await supabase.from('variacion_producto')
      .select(`precio_producto, stock_cantidad_producto, codigo_producto, talla_producto(nombre_talla), color_producto(nombre_color), estaciones_producto(nombre_estaciones)`)
      .eq('producto_id', product.id)

    if (data) {
      const loaded: Variant[] = []
      const sSizes = new Set<string>(), sColors = new Set<string>(), sSeasons = new Set<string>()
      
      data.forEach((v: any) => {
        const sz = v.talla_producto?.nombre_talla; if(sz) sSizes.add(sz)
        const cl = v.color_producto?.nombre_color; if(cl) sColors.add(cl)
        const sn = v.estaciones_producto?.nombre_estaciones; if(sn) sSeasons.add(sn)
        
        loaded.push({
          size: sz, color: cl, season: sn, sku: v.codigo_producto,
          price: v.precio_producto, stock: v.stock_cantidad_producto, image: product.image
        })
      })
      setSelectedSizes(Array.from(sSizes))
      setSelectedColors(Array.from(sColors))
      setSelectedSeasons(Array.from(sSeasons))
      setVariants(loaded)
      setIsEditProductModalOpen(true)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm("¿Borrar producto?")) {
      await supabase.from('producto').delete().eq('producto_id', id)
      fetchProducts()
    }
  }

  const resetForm = () => {
    setNewProductName(""); setNewProductDescription(""); setProductImageFile(null); setCurrentImageUrl("");
    setSelectedSizes([]); setSelectedColors([]); setSelectedSeasons([]); setVariants([]); 
    setBulkPrice(""); setBulkStock(""); setEditingProductId(null);
  }

  // --- COMPONENTES VISUALES ---

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  )

  const MasterTable = ({ data, type, title }: any) => (
    <>
      <div className="mb-6"><Button onClick={() => handleOpenMasterModal(undefined, type)}><Plus className="w-4 h-4 mr-2" /> Nueva {title}</Button></div>
      <Card><CardContent className="p-0"><table className="w-full text-sm text-left"><thead className="bg-muted/50"><tr><th className="p-4">ID</th><th className="p-4">Nombre</th><th className="p-4">Acciones</th></tr></thead><tbody>
        {data.map((item: any) => (
          <tr key={item.id} className="border-t hover:bg-muted/10">
            <td className="p-4 w-16 text-muted-foreground">#{item.id}</td>
            <td className="p-4 font-medium">{item.name}</td>
            <td className="p-4 flex gap-2 w-32">
              <Button variant="ghost" size="sm" onClick={() => handleOpenMasterModal(item, type)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteMasterItem(item.id, type)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No hay registros.</td></tr>}
      </tbody></table></CardContent></Card>
    </>
  )

  const ProductFormContent = () => (
    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nombre</Label><Input value={newProductName} onChange={e => setNewProductName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Categoría</Label>
          <Select value={newProductCategory} onValueChange={setNewProductCategory}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>{categoriesList.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2"><Label>Marca</Label>
          <Select value={newProductBrand} onValueChange={setNewProductBrand}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>{brandsList.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2"><Label>Material</Label><Input value={newProductMaterial} onChange={e => setNewProductMaterial(e.target.value)} /></div>
        <div className="col-span-2 space-y-2"><Label>Descripción</Label><Textarea value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} rows={2} /></div>
        <div className="col-span-2 space-y-2 border-2 border-dashed p-4 rounded bg-muted/20 text-center">
          <Label className="cursor-pointer block"><Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <span className="text-primary hover:underline text-sm">{productImageFile ? "Archivo: " + productImageFile.name : "Subir imagen"}</span>
            <Input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setProductImageFile(e.target.files[0])} />
          </Label>
          {currentImageUrl && !productImageFile && <div className="mt-2 relative w-12 h-12 mx-auto rounded overflow-hidden border"><Image src={currentImageUrl} alt="Preview" fill className="object-cover" /></div>}
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-sm">Variantes</h3>
        {[
          { label: "Tallas", list: sizesList, selected: selectedSizes, set: setSelectedSizes },
          { label: "Colores", list: colorsList, selected: selectedColors, set: setSelectedColors },
          { label: "Estaciones", list: seasonsList, selected: selectedSeasons, set: setSelectedSeasons }
        ].map((group) => (
          <div key={group.label}>
            <Label className="mb-2 block text-xs uppercase text-muted-foreground">{group.label}</Label>
            <div className="flex flex-wrap gap-2">
              {group.list.map((item: any) => (
                <button key={item.id} onClick={() => {
                    const newList = group.selected.includes(item.name) ? group.selected.filter(x => x !== item.name) : [...group.selected, item.name]
                    group.set(newList)
                  }}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${group.selected.includes(item.name) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50'}`}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {variants.length > 0 && (
        <div className="space-y-2 bg-slate-50 p-3 rounded border">
          <div className="flex items-end gap-2 mb-2">
            <div className="flex-1"><Label className="text-xs">Precio Global</Label><Input type="number" className="h-8 bg-white" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} placeholder="0.00" /></div>
            <div className="flex-1"><Label className="text-xs">Stock Global</Label><Input type="number" className="h-8 bg-white" value={bulkStock} onChange={e => setBulkStock(e.target.value)} placeholder="0" /></div>
            <Button size="sm" onClick={() => setVariants(prev => prev.map(v => ({ ...v, price: parseFloat(bulkPrice)||0, stock: parseInt(bulkStock)||0 })))}>Aplicar</Button>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded bg-white">
            <table className="w-full text-xs"><thead className="bg-muted sticky top-0"><tr><th className="p-2 text-left">Variante</th><th className="p-2 w-20">Precio</th><th className="p-2 w-20">Stock</th></tr></thead>
              <tbody>{variants.map((v, i) => (
                <tr key={i} className="border-t"><td className="p-2">{v.size} - {v.color} ({v.season})</td>
                  <td className="p-2"><Input className="h-7 w-20" type="number" value={v.price} onChange={e => { const n = [...variants]; n[i].price = parseFloat(e.target.value); setVariants(n) }} /></td>
                  <td className="p-2"><Input className="h-7 w-20" type="number" value={v.stock} onChange={e => { const n = [...variants]; n[i].stock = parseInt(e.target.value); setVariants(n) }} /></td>
                </tr>))}</tbody></table>
          </div>
        </div>
      )}
    </div>
  )

  // =================================================================================================
  // RENDER PRINCIPAL
  // =================================================================================================
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div><h2 className="text-3xl font-bold">Administración</h2><p className="text-muted-foreground mt-1">Gestión integral del sistema</p></div>
        <Button variant="outline" onClick={fetchAllData} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar</Button>
      </div>

      <div className="mb-6 border-b flex gap-6 overflow-x-auto">
        <TabButton id="products" label="Productos" icon={Layers} />
        <TabButton id="categories" label="Categorías" icon={Layers} />
        <TabButton id="sizes" label="Tallas" icon={Ruler} />
        <TabButton id="colors" label="Colores" icon={Palette} />
        <TabButton id="seasons" label="Estaciones" icon={Sun} />
        <TabButton id="brands" label="Marcas" icon={Tag} />
      </div>

      {activeTab === "products" && (
        <>
          <div className="mb-6 flex gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { resetForm(); setIsNewProductModalOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nuevo Producto</Button>
            
            <Select value={sortCriteria} onValueChange={setSortCriteria}>
              <SelectTrigger className="w-[280px]">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground"/>
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id-desc">Más Recientes (ID Desc)</SelectItem>
                <SelectItem value="id-asc">Más Antiguos (ID Asc)</SelectItem>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="cat-asc">Categoría (A-Z)</SelectItem>
                <SelectItem value="stock-desc">Stock (Mayor a Menor)</SelectItem>
                <SelectItem value="stock-asc">Stock (Menor a Mayor)</SelectItem>
                <SelectItem value="price-desc">Precio (Mayor a Menor)</SelectItem>
                <SelectItem value="price-asc">Precio (Menor a Mayor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-muted/50"><tr><th className="p-4">Imagen</th><th className="p-4">Nombre</th><th className="p-4">Categoría</th><th className="p-4">Stock</th><th className="p-4">Precio</th><th className="p-4">Acciones</th></tr></thead><tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/20">
                <td className="p-4"><div className="w-10 h-10 bg-gray-100 rounded relative overflow-hidden"><Image src={p.image.startsWith('http') ? p.image : "/placeholder.svg"} alt="" fill className="object-cover" /></div></td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{p.category}</span></td>
                <td className="p-4 font-bold text-blue-600">{p.stock}</td>
                <td className="p-4">S/ {p.price.toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditProductClick(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody></table></CardContent></Card>
        </>
      )}

      {activeTab === "categories" && <MasterTable data={categoriesList} type="categories" title="Categoría" />}
      {activeTab === "sizes" && <MasterTable data={sizesList} type="sizes" title="Talla" />}
      {activeTab === "colors" && <MasterTable data={colorsList} type="colors" title="Color" />}
      {activeTab === "seasons" && <MasterTable data={seasonsList} type="seasons" title="Estación" />}
      {activeTab === "brands" && <MasterTable data={brandsList} type="brands" title="Marca" />}

      {/* MODAL MAESTROS */}
      <Dialog open={isMasterModalOpen} onOpenChange={setIsMasterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMasterItem ? "Editar" : "Nueva"} {
            activeTab === 'categories' ? 'Categoría' : 
            activeTab === 'sizes' ? 'Talla' : 
            activeTab === 'colors' ? 'Color' : 
            activeTab === 'seasons' ? 'Estación' : 'Marca'
          }</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={masterItemName} onChange={e => setMasterItemName(e.target.value)} placeholder="Ej: Nuevo Elemento" /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsMasterModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveMasterItem}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODALES DE PRODUCTO */}
      <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
          <ProductFormContent />
          <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => setIsNewProductModalOpen(false)}>Cancelar</Button><Button onClick={() => handleSaveProduct('create')} disabled={uploading} className="bg-blue-600">{uploading ? "Guardando..." : "Crear Producto"}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
          <ProductFormContent />
          <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => setIsEditProductModalOpen(false)}>Cancelar</Button><Button onClick={() => handleSaveProduct('edit')} disabled={uploading} className="bg-blue-600">{uploading ? "Guardando..." : "Guardar Cambios"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}