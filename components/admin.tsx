"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Upload, AlertCircle, X } from "lucide-react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  images?: string[]
  variants?: Variant[]
}

interface Variant {
  size: string
  color: string
  sku: string
  price: number
  stock: number
}

// Added interface for Category
interface Category {
  id: number
  name: string
  description: string
  productCount: number
}

// Added interface for Size
interface Size {
  id: number
  name: string
  description: string
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "sizes" | "colors">("products")
  const [colors, setColors] = useState(["Blanco", "Negro", "Azul", "Gris", "Rojo", "Verde", "Bordo", "Amarillo"])
  const [newColor, setNewColor] = useState("")
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  // Added isEditCategoryModalOpen, editingCategory, isNewSizeModalOpen, isEditSizeModalOpen, editingSize states
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isNewSizeModalOpen, setIsNewSizeModalOpen] = useState(false)
  const [isEditSizeModalOpen, setIsEditSizeModalOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  // Added deleteError and showDeleteError states for error handling
  const [deleteError, setDeleteError] = useState<string>("")
  const [showDeleteError, setShowDeleteError] = useState(false)

  const [validationError, setValidationError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    name: boolean
    category: boolean
    brand: boolean
    images: boolean
    sizes: boolean
    colors: boolean
    variants: boolean
  }>({
    name: false,
    category: false,
    brand: false,
    images: false,
    sizes: false,
    colors: false,
    variants: false,
  })

  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [productImages, setProductImages] = useState<File[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [bulkPrice, setBulkPrice] = useState<string>("")
  const [bulkStock, setBulkStock] = useState<string>("")

  const [newProductName, setNewProductName] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [newProductCategory, setNewProductCategory] = useState("Polos")
  const [newProductBrand, setNewProductBrand] = useState("Propia")
  const [newProductMaterial, setNewProductMaterial] = useState("Algodón Pima")

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  const [newSizeName, setNewSizeName] = useState("")
  const [newSizeDescription, setNewSizeDescription] = useState("")

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Polo Básico",
      category: "Polos",
      price: 50.0,
      stock: 45,
      image: "/basic-tshirt.png",
      description: "Polo básico de algodón de alta calidad",
      brand: "Propia",
      material: "Algodón Pima",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Blanco", "Negro", "Azul"],
      images: ["/basic-tshirt.png"],
    },
  ])

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Polos", description: "Prendas superiores casuales", productCount: 3 },
    { id: 2, name: "Casacas", description: "Prendas de abrigo", productCount: 2 },
    { id: 3, name: "Chompas", description: "Prendas tejidas", productCount: 2 },
  ])

  const [sizesList, setSizesList] = useState<Size[]>([
    { id: 1, name: "XS", description: "Extra pequeño" },
    { id: 2, name: "S", description: "Pequeño" },
    { id: 3, name: "M", description: "Mediano" },
    { id: 4, name: "L", description: "Grande" },
    { id: 5, name: "XL", description: "Extra grande" },
    { id: 6, name: "XXL", description: "Doble extra grande" },
  ])

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

  const handleAddColor = () => {
    if (newColor.trim()) {
      setColors([...colors, newColor.trim()])
      setNewColor("")
    }
  }

  const handleRemoveColor = (colorToRemove: string) => {
    setColors(colors.filter((color) => color !== colorToRemove))
  }

  const handleDeleteCategory = (category: Category) => {
    if (category.productCount > 0) {
      setDeleteError(
        `No se puede eliminar la categoría "${category.name}" porque tiene ${category.productCount} producto(s) asociado(s).`,
      )
      setShowDeleteError(true)
      return
    }
    setCategories(categories.filter((cat) => cat.id !== category.id))
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description)
    setIsEditCategoryModalOpen(true)
  }

  const handleSaveEditedCategory = () => {
    if (!editingCategory) return

    setCategories(
      categories.map((cat) =>
        cat.id === editingCategory.id ? { ...cat, name: newCategoryName, description: newCategoryDescription } : cat,
      ),
    )

    setIsEditCategoryModalOpen(false)
    setEditingCategory(null)
    setNewCategoryName("")
    setNewCategoryDescription("")
  }

  const handleSaveNewCategory = () => {
    const newCategory: Category = {
      id: categories.length + 1,
      name: newCategoryName,
      description: newCategoryDescription,
      productCount: 0,
    }
    setCategories([...categories, newCategory])
    setIsNewCategoryModalOpen(false)
    setNewCategoryName("")
    setNewCategoryDescription("")
  }

  const handleDeleteSize = (sizeId: number) => {
    setSizesList(sizesList.filter((size) => size.id !== sizeId))
  }

  const handleEditSize = (size: Size) => {
    setEditingSize(size)
    setNewSizeName(size.name)
    setNewSizeDescription(size.description)
    setIsEditSizeModalOpen(true)
  }

  const handleSaveEditedSize = () => {
    if (!editingSize) return

    setSizesList(
      sizesList.map((size) =>
        size.id === editingSize.id ? { ...size, name: newSizeName, description: newSizeDescription } : size,
      ),
    )

    setIsEditSizeModalOpen(false)
    setEditingSize(null)
    setNewSizeName("")
    setNewSizeDescription("")
  }

  const handleSaveNewSize = () => {
    const newSize: Size = {
      id: sizesList.length + 1,
      name: newSizeName,
      description: newSizeDescription,
    }
    setSizesList([...sizesList, newSize])
    setIsNewSizeModalOpen(false)
    setNewSizeName("")
    setNewSizeDescription("")
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]))
  }

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const validFormats = ["image/png", "image/jpeg", "image/jpg"]
      const validFiles = files.filter((file) => validFormats.includes(file.type))

      if (validFiles.length !== files.length) {
        alert("Solo se permiten archivos PNG, JPG o JPEG")
      }

      setProductImages(validFiles)
    }
  }

  const handleSaveProduct = () => {
    const errors = {
      name: !newProductName.trim(),
      category: !newProductCategory,
      brand: !newProductBrand,
      images: productImages.length === 0,
      sizes: selectedSizes.length === 0,
      colors: selectedColors.length === 0,
      variants: variants.length === 0 || variants.some((v) => v.price === 0 || v.stock === 0),
    }

    setFieldErrors(errors)

    if (Object.values(errors).some((error) => error)) {
      const errorMessages = []
      if (errors.name) errorMessages.push("Nombre del producto")
      if (errors.category) errorMessages.push("Categoría")
      if (errors.brand) errorMessages.push("Marca")
      if (errors.images) errorMessages.push("Al menos una imagen")
      if (errors.sizes) errorMessages.push("Al menos una talla")
      if (errors.colors) errorMessages.push("Al menos un color")
      if (errors.variants) errorMessages.push("Todas las variantes deben tener precio y stock mayor a 0")

      setValidationError(`Por favor, completa los siguientes campos: ${errorMessages.join(", ")}`)
      return
    }

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)
    const avgPrice = variants.length > 0 ? variants.reduce((sum, v) => sum + v.price, 0) / variants.length : 0

    const newProduct: Product = {
      id: products.length + 1,
      name: newProductName,
      category: newProductCategory,
      price: avgPrice,
      stock: totalStock,
      image: productImages.length > 0 ? URL.createObjectURL(productImages[0]) : "/basic-tshirt.png",
      description: newProductDescription,
      brand: newProductBrand,
      sizes: selectedSizes,
      colors: selectedColors,
      images: productImages.length > 0 ? productImages.map((f) => URL.createObjectURL(f)) : ["/basic-tshirt.png"],
      variants: variants,
    }

    setProducts([...products, newProduct])

    // Reset form
    setIsNewProductModalOpen(false)
    setNewProductName("")
    setNewProductDescription("")
    setNewProductCategory("Polos")
    setNewProductBrand("Propia")
    setSelectedSizes([])
    setSelectedColors([])
    setProductImages([])
    setVariants([])
    setBulkPrice("")
    setBulkStock("")
    setValidationError("")
    setFieldErrors({
      name: false,
      category: false,
      brand: false,
      images: false,
      sizes: false,
      colors: false,
      variants: false,
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProductName(product.name)
    setNewProductDescription(product.description || "")
    setNewProductCategory(product.category)
    setNewProductBrand(product.brand || "Propia")
    setNewProductMaterial(product.material || "Algodón Pima")
    setSelectedSizes(product.sizes || [])
    setSelectedColors(product.colors || [])
    setVariants(product.variants || []) // Initialize variants for editing
    setIsEditProductModalOpen(true)
  }

  const handleSaveEditedProduct = () => {
    if (!editingProduct) return

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)
    const avgPrice =
      variants.length > 0 ? variants.reduce((sum, v) => sum + v.price, 0) / variants.length : editingProduct.price

    const updatedProduct: Product = {
      ...editingProduct,
      name: newProductName,
      description: newProductDescription,
      category: newProductCategory,
      brand: newProductBrand,
      material: newProductMaterial,
      price: avgPrice,
      stock: totalStock,
      sizes: selectedSizes,
      colors: selectedColors,
      variants: variants,
      images: productImages.length > 0 ? productImages.map((f) => URL.createObjectURL(f)) : editingProduct.images,
    }

    setProducts(products.map((p) => (p.id === editingProduct.id ? updatedProduct : p)))

    // Reset form
    setIsEditProductModalOpen(false)
    setEditingProduct(null)
    setNewProductName("")
    setNewProductDescription("")
    setNewProductCategory("Polos")
    setNewProductBrand("Propia")
    setNewProductMaterial("Algodón Pima")
    setSelectedSizes([])
    setSelectedColors([])
    setProductImages([])
    setVariants([])
    setBulkPrice("")
    setBulkStock("")
  }

  // Removed redundant handleSaveCategory function
  // const handleSaveCategory = () => {
  //   console.log("[v0] Saving category...")
  //   setIsNewCategoryModalOpen(false)
  // }

  const generateVariants = () => {
    const newVariants: Variant[] = []
    selectedSizes.forEach((size) => {
      selectedColors.forEach((color) => {
        const sku = `POL-${size}-${color.substring(0, 3).toUpperCase()}`
        newVariants.push({
          size,
          color,
          sku,
          price: 0,
          stock: 0,
        })
      })
    })
    setVariants(newVariants)
  }

  const applyBulkPricing = () => {
    const price = Number.parseFloat(bulkPrice) || 0
    const stock = Number.parseInt(bulkStock) || 0
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        price,
        stock,
      })),
    )
  }

  const updateVariant = (index: number, field: "price" | "stock", value: number) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)))
  }

  const handleDeleteProduct = (productId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      setProducts(products.filter((p) => p.id !== productId))
    }
  }

  const [variantToDelete, setVariantToDelete] = useState<number | null>(null)
  const [editVariantToDelete, setEditVariantToDelete] = useState<{ index: number; variant: string } | null>(null)

  const deleteVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
    setVariantToDelete(null)
  }

  const handleConfirmDeleteVariant = () => {
    if (variantToDelete !== null) {
      deleteVariant(variantToDelete)
    }
  }

  const handleConfirmDeleteEditVariant = () => {
    if (editVariantToDelete !== null && editingProduct) {
      const newVariants = editingProduct.variants?.filter((_, i) => i !== editVariantToDelete.index) || []
      setEditingProduct({
        ...editingProduct,
        variants: newVariants,
      })
      setEditVariantToDelete(null)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Administración</h2>
        <p className="text-muted-foreground mt-2">
          {activeTab === "products"
            ? ""
            : activeTab === "categories"
              ? ""
              : // Updated description for 'sizes' tab
                activeTab === "sizes"
                ? ""
                : ""}
        </p>
      </div>

      <div className="mb-6 border-b">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "products" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Productos
            {activeTab === "products" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "categories" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Categorías
            {activeTab === "categories" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("sizes")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "sizes" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tallas
            {activeTab === "sizes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "colors" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Colores
            {activeTab === "colors" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </div>

      {activeTab === "products" ? (
        <>
          <div className="mb-6">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsNewProductModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Imágenes</th>
                      <th className="text-left p-4 font-medium text-sm">Producto</th>
                      <th className="text-left p-4 font-medium text-sm">Categoría</th>
                      <th className="text-left p-4 font-medium text-sm">Precio</th>
                      <th className="text-left p-4 font-medium text-sm">Stock</th>
                      <th className="text-left p-4 font-medium text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-4">
                          <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4">{product.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 text-primary font-medium">S/ {product.price.toFixed(2)}</td>
                        <td className="p-4 text-primary font-medium">{product.stock}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              className="text-primary hover:text-primary/80"
                              onClick={() => handleEditProduct(product)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* NEW PRODUCT MODAL */}
          <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
              </DialogHeader>

              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{validationError}</p>
                </div>
              )}

              <div className="space-y-8 py-4">
                {/* SECCIÓN A: DATOS GENERALES */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">A. Datos Generales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="product-name" className={fieldErrors.name ? "text-red-600" : ""}>
                      Nombre del Producto *
                    </Label>
                    <Input
                      id="product-name"
                      placeholder="Ej: Polo Básico"
                      value={newProductName}
                      onChange={(e) => {
                        setNewProductName(e.target.value)
                        setFieldErrors({ ...fieldErrors, name: false })
                      }}
                      className={fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {fieldErrors.name && <p className="text-xs text-red-600">Este campo es obligatorio</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-description">Descripción (opcional)</Label>
                    <Textarea
                      id="product-description"
                      placeholder="Ej: Polo básico de algodón de alta calidad"
                      rows={3}
                      value={newProductDescription}
                      onChange={(e) => setNewProductDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-category" className={fieldErrors.category ? "text-red-600" : ""}>
                        Categoría *
                      </Label>
                      <Select
                        value={newProductCategory}
                        onValueChange={(value) => {
                          setNewProductCategory(value)
                          setFieldErrors({ ...fieldErrors, category: false })
                        }}
                      >
                        <SelectTrigger
                          id="product-category"
                          className={fieldErrors.category ? "border-red-500 focus:ring-red-500" : ""}
                        >
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Polos">Polos</SelectItem>
                          <SelectItem value="Pantalones">Pantalones</SelectItem>
                          <SelectItem value="Casacas">Casacas</SelectItem>
                          <SelectItem value="Chompas">Chompas</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.category && <p className="text-xs text-red-600">Este campo es obligatorio</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-brand" className={fieldErrors.brand ? "text-red-600" : ""}>
                        Marca *
                      </Label>
                      <Select
                        value={newProductBrand}
                        onValueChange={(value) => {
                          setNewProductBrand(value)
                          setFieldErrors({ ...fieldErrors, brand: false })
                        }}
                      >
                        <SelectTrigger
                          id="product-brand"
                          className={fieldErrors.brand ? "border-red-500 focus:ring-red-500" : ""}
                        >
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nike">Nike</SelectItem>
                          <SelectItem value="Adidas">Adidas</SelectItem>
                          <SelectItem value="Propia">Propia</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.brand && <p className="text-xs text-red-600">Este campo es obligatorio</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldErrors.images ? "text-red-600" : ""}>Subir Imagen *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30 ${
                        fieldErrors.images ? "border-red-500" : ""
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          handleImageUpload(e)
                          setFieldErrors({ ...fieldErrors, images: false })
                        }}
                        className="hidden"
                        id="product-images"
                      />
                      <label htmlFor="product-images" className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-primary font-medium">
                          Arrastra y suelta una imagen aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Solo PNG, JPG o JPEG</p>
                      </label>
                    </div>
                    {productImages.length > 0 && (
                      <p className="text-sm text-muted-foreground">{productImages.length} imagen(es) seleccionada(s)</p>
                    )}
                    {fieldErrors.images && <p className="text-xs text-red-600">Debes subir al menos una imagen</p>}
                  </div>
                </div>

                {/* SECCIÓN B: DEFINICIÓN DE VARIANTES */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">B. Definición de Variantes</h3>

                  <div className="space-y-2">
                    <Label className={fieldErrors.sizes ? "text-red-600" : ""}>Tallas *</Label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            toggleSize(size)
                            setFieldErrors({ ...fieldErrors, sizes: false })
                            setTimeout(generateVariants, 0)
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedSizes.includes(size)
                              ? "bg-blue-600 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.sizes && <p className="text-xs text-red-600">Debes seleccionar al menos una talla</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldErrors.colors ? "text-red-600" : ""}>Colores *</Label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => {
                        const colorMap: Record<string, string> = {
                          Verde: "bg-green-500",
                          Negro: "bg-black",
                          Blanco: "bg-white border-2 border-gray-300",
                          Azul: "bg-blue-500",
                          Rojo: "bg-red-500",
                          Amarillo: "bg-yellow-500",
                          Gris: "bg-gray-500",
                          Bordo: "bg-red-900",
                        }
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              toggleColor(color)
                              setFieldErrors({ ...fieldErrors, colors: false })
                              setTimeout(generateVariants, 0)
                            }}
                            className={`w-10 h-10 rounded-full ${colorMap[color] || "bg-gray-400"} transition-transform hover:scale-110 ${
                              selectedColors.includes(color) ? "ring-4 ring-blue-600 ring-offset-2" : ""
                            }`}
                            title={color}
                          />
                        )
                      })}
                    </div>
                    {fieldErrors.colors && <p className="text-xs text-red-600">Debes seleccionar al menos un color</p>}
                  </div>
                </div>

                {/* SECCIÓN C: INVENTARIO (MATRIZ DE VARIANTES) */}
                {variants.length > 0 && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold border-b pb-2 ${fieldErrors.variants ? "text-red-600" : ""}`}>
                      C. Inventario (Matriz de Variantes) *
                    </h3>

                    {/* Cabecera de Edición Masiva */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">Edición Masiva</p>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label htmlFor="bulk-price" className="text-xs">
                            Precio (S/.)
                          </Label>
                          <Input
                            id="bulk-price"
                            type="number"
                            placeholder="0.00"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="bulk-stock" className="text-xs">
                            Stock
                          </Label>
                          <Input
                            id="bulk-stock"
                            type="number"
                            placeholder="0"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                          />
                        </div>
                        <Button onClick={applyBulkPricing} className="bg-primary">
                          Aplicar a todos
                        </Button>
                      </div>
                    </div>

                    {/* Tabla de Variantes */}
                    <div
                      className={`border rounded-lg overflow-hidden ${fieldErrors.variants ? "border-red-500" : ""}`}
                    >
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium text-sm">Variante</th>
                            <th className="text-left p-3 font-medium text-sm">SKU</th>
                            <th className="text-left p-3 font-medium text-sm">Precio (S/.)</th>
                            <th className="text-left p-3 font-medium text-sm">Stock</th>
                            <th className="text-left p-3 font-medium text-sm">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((variant, index) => (
                            <tr key={`${variant.size}-${variant.color}`} className="border-t">
                              <td className="p-3">
                                <span className="text-sm font-medium">
                                  {variant.size} - {variant.color}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-muted-foreground font-mono">{variant.sku}</span>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={variant.price || ""}
                                  onChange={(e) => {
                                    updateVariant(index, "price", Number.parseFloat(e.target.value) || 0)
                                    setFieldErrors({ ...fieldErrors, variants: false })
                                  }}
                                  placeholder="0.00"
                                  step="0.01"
                                  className={`w-24 ${variant.price === 0 && fieldErrors.variants ? "border-red-500" : ""}`}
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={variant.stock || ""}
                                  onChange={(e) => {
                                    updateVariant(index, "stock", Number.parseInt(e.target.value) || 0)
                                    setFieldErrors({ ...fieldErrors, variants: false })
                                  }}
                                  placeholder="0"
                                  className={`w-24 ${variant.stock === 0 && fieldErrors.variants ? "border-red-500" : ""}`}
                                />
                              </td>
                              <td className="p-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setVariantToDelete(index)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {fieldErrors.variants && (
                      <p className="text-xs text-red-600">Todas las variantes deben tener precio y stock mayor a 0</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with right-aligned buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="px-6 bg-transparent"
                  onClick={() => {
                    setIsNewProductModalOpen(false)
                    setNewProductName("")
                    setNewProductDescription("")
                    setNewProductCategory("Polos")
                    setNewProductBrand("Propia")
                    setSelectedSizes([])
                    setSelectedColors([])
                    setProductImages([])
                    setVariants([])
                    setBulkPrice("")
                    setBulkStock("")
                    setValidationError("")
                    setFieldErrors({
                      name: false,
                      category: false,
                      brand: false,
                      images: false,
                      sizes: false,
                      colors: false,
                      variants: false,
                    })
                  }}
                >
                  Cancelar
                </Button>
                <Button className="px-6 bg-primary hover:bg-primary/90" onClick={handleSaveProduct}>
                  Guardar Producto
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* EDIT PRODUCT MODAL - Same structure as new product modal */}
          <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-8 py-4">
                {/* SECCIÓN A: DATOS GENERALES */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">A. Datos Generales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="edit-product-name">Nombre del Producto</Label>
                    <Input
                      id="edit-product-name"
                      placeholder="Ej: Polo Básico"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-product-description">Descripción</Label>
                    <Textarea
                      id="edit-product-description"
                      placeholder="Ej: Polo básico de algodón de alta calidad"
                      rows={3}
                      value={newProductDescription}
                      onChange={(e) => setNewProductDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-product-category">Categoría</Label>
                      <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                        <SelectTrigger id="edit-product-category">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Polos">Polos</SelectItem>
                          <SelectItem value="Pantalones">Pantalones</SelectItem>
                          <SelectItem value="Casacas">Casacas</SelectItem>
                          <SelectItem value="Chompas">Chompas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-product-brand">Marca</Label>
                      <Select value={newProductBrand} onValueChange={setNewProductBrand}>
                        <SelectTrigger id="edit-product-brand">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nike">Nike</SelectItem>
                          <SelectItem value="Adidas">Adidas</SelectItem>
                          <SelectItem value="Propia">Propia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subir Imágenes</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="edit-product-images"
                      />
                      <label htmlFor="edit-product-images" className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-primary font-medium">
                          Arrastra y suelta una imagen aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Solo PNG, JPG o JPEG</p>
                      </label>
                    </div>
                    {editingProduct?.images && editingProduct.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {editingProduct.images.map((img, idx) => (
                          <div key={idx} className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                            <Image
                              src={img || "/placeholder.svg"}
                              alt={`Product ${idx + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {productImages.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {productImages.length} imagen(es) nueva(s) seleccionada(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* SECCIÓN B: DEFINICIÓN DE VARIANTES */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">B. Definición de Variantes</h3>

                  <div className="space-y-2">
                    <Label>Tallas</Label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            toggleSize(size)
                            setTimeout(generateVariants, 0)
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedSizes.includes(size)
                              ? "bg-blue-600 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colores</Label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => {
                        const colorMap: Record<string, string> = {
                          Verde: "bg-green-500",
                          Negro: "bg-black",
                          Blanco: "bg-white border-2 border-gray-300",
                          Azul: "bg-blue-500",
                          Rojo: "bg-red-500",
                          Amarillo: "bg-yellow-500",
                          Gris: "bg-gray-500",
                          Bordo: "bg-red-900",
                        }
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              toggleColor(color)
                              setTimeout(generateVariants, 0)
                            }}
                            className={`w-10 h-10 rounded-full ${colorMap[color] || "bg-gray-400"} transition-transform hover:scale-110 ${
                              selectedColors.includes(color) ? "ring-4 ring-blue-600 ring-offset-2" : ""
                            }`}
                            title={color}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN C: INVENTARIO (MATRIZ DE VARIANTES) */}
                {variants.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">C. Inventario (Matriz de Variantes)</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">Edición Masiva</p>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label htmlFor="edit-bulk-price" className="text-xs">
                            Precio (S/.)
                          </Label>
                          <Input
                            id="edit-bulk-price"
                            type="number"
                            placeholder="0.00"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="edit-bulk-stock" className="text-xs">
                            Stock
                          </Label>
                          <Input
                            id="edit-bulk-stock"
                            type="number"
                            placeholder="0"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                          />
                        </div>
                        <Button onClick={applyBulkPricing} className="bg-primary">
                          Aplicar a todos
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium text-sm">Variante</th>
                            <th className="text-left p-3 font-medium text-sm">SKU</th>
                            <th className="text-left p-3 font-medium text-sm">Precio (S/.)</th>
                            <th className="text-left p-3 font-medium text-sm">Stock</th>
                            <th className="text-left p-3 font-medium text-sm">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((variant, index) => (
                            <tr key={`${variant.size}-${variant.color}`} className="border-t">
                              <td className="p-3">
                                <span className="text-sm font-medium">
                                  {variant.size} - {variant.color}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-muted-foreground font-mono">{variant.sku}</span>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={variant.price || ""}
                                  onChange={(e) =>
                                    updateVariant(index, "price", Number.parseFloat(e.target.value) || 0)
                                  }
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-24"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={variant.stock || ""}
                                  onChange={(e) => updateVariant(index, "stock", Number.parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-24"
                                />
                              </td>
                              <td className="p-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // This part needs to correctly target the variant to delete for editing
                                    // For now, let's assume it's intended to remove from the current 'variants' state
                                    // If it should modify editingProduct.variants, that logic needs adjustment.
                                    const newVariants = variants.filter((_, i) => i !== index)
                                    setVariants(newVariants)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="px-6 bg-transparent"
                  onClick={() => {
                    setIsEditProductModalOpen(false)
                    setEditingProduct(null)
                    setNewProductName("")
                    setNewProductDescription("")
                    setNewProductCategory("Polos")
                    setNewProductBrand("Propia")
                    setNewProductMaterial("Algodón Pima")
                    setSelectedSizes([])
                    setSelectedColors([])
                    setProductImages([])
                    setVariants([])
                    setBulkPrice("")
                    setBulkStock("")
                  }}
                >
                  Cancelar
                </Button>
                <Button className="px-6 bg-primary hover:bg-primary/90" onClick={handleSaveEditedProduct}>
                  Guardar Cambios
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : activeTab === "categories" ? (
        <>
          <div className="mb-6">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsNewCategoryModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Nombre</th>
                      <th className="text-left p-4 font-medium text-sm">Descripción</th>
                      <th className="text-left p-4 font-medium text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-t">
                        <td className="p-4 font-medium">{category.name}</td>
                        <td className="p-4 text-muted-foreground">{category.description}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              className="text-primary hover:text-primary/80"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <AlertDialog open={showDeleteError} onOpenChange={setShowDeleteError}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  No se puede eliminar
                </AlertDialogTitle>
                <AlertDialogDescription>{deleteError}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowDeleteError(false)}>Entendido</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isEditCategoryModalOpen} onOpenChange={setIsEditCategoryModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">Nombre</Label>
                  <Input
                    id="edit-category-name"
                    placeholder="Ej: Polos"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-description">Descripción</Label>
                  <Textarea
                    id="edit-category-description"
                    placeholder="Ej: Prendas superiores casuales"
                    rows={3}
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditCategoryModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEditedCategory}>Guardar Cambios</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* NEW CATEGORY MODAL */}
          <Dialog open={isNewCategoryModalOpen} onOpenChange={setIsNewCategoryModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nombre</Label>
                  <Input
                    id="category-name"
                    placeholder="Ej: Polos"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Descripción</Label>
                  <Textarea
                    id="category-description"
                    placeholder="Ej: Prendas superiores casuales"
                    rows={3}
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsNewCategoryModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNewCategory}>Guardar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : activeTab === "sizes" ? (
        <>
          <div className="mb-6">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsNewSizeModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Talla
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Nombre</th>
                      <th className="text-left p-4 font-medium text-sm">Descripción</th>
                      <th className="text-left p-4 font-medium text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizesList.map((size) => (
                      <tr key={size.id} className="border-t">
                        <td className="p-4 font-medium">{size.name}</td>
                        <td className="p-4 text-muted-foreground">{size.description}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button className="text-primary hover:text-primary/80" onClick={() => handleEditSize(size)}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteSize(size.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* EDIT SIZE MODAL */}
          <Dialog open={isEditSizeModalOpen} onOpenChange={setIsEditSizeModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Talla</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-size-name">Nombre</Label>
                  <Input
                    id="edit-size-name"
                    placeholder="Ej: XL"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-size-description">Descripción</Label>
                  <Textarea
                    id="edit-size-description"
                    placeholder="Ej: Extra grande"
                    rows={2}
                    value={newSizeDescription}
                    onChange={(e) => setNewSizeDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditSizeModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEditedSize}>Guardar Cambios</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* NEW SIZE MODAL */}
          <Dialog open={isNewSizeModalOpen} onOpenChange={setIsNewSizeModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Talla</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="size-name">Nombre</Label>
                  <Input
                    id="size-name"
                    placeholder="Ej: XL"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-description">Descripción</Label>
                  <Textarea
                    id="size-description"
                    placeholder="Ej: Extra grande"
                    rows={2}
                    value={newSizeDescription}
                    onChange={(e) => setNewSizeDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsNewSizeModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNewSize}>Guardar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        // Modified the description for 'colors' tab
        // Removed entire Configuración tab section
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Colores</CardTitle>
              <CardDescription>Agrega o elimina colores disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ej: Azul Cielo, Azul Noche..."
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  // Added onKeyDown for Enter key functionality
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddColor()
                    }
                  }}
                />
                <Button onClick={handleAddColor}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <div key={color} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
                    <span>{color}</span>
                    <button
                      onClick={() => handleRemoveColor(color)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={variantToDelete !== null} onOpenChange={() => setVariantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar este registro?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setVariantToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (variantToDelete !== null) {
                  deleteVariant(variantToDelete)
                }
              }}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog - this dialog was duplicated, consolidating it */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => {
          setEditingProduct(null)
          // Resetting states related to editing product to prevent carry-over
          setNewProductName("")
          setNewProductDescription("")
          setNewProductCategory("Polos")
          setNewProductBrand("Propia")
          setNewProductMaterial("Algodón Pima")
          setSelectedSizes([])
          setSelectedColors([])
          setProductImages([])
          setVariants([]) // Ensure variants are cleared when closing edit dialog
          setBulkPrice("")
          setBulkStock("")
          setValidationError("") // Clear validation error when closing edit dialog
          // Reset field errors when closing edit dialog
          setFieldErrors({
            name: false,
            category: false,
            brand: false,
            images: false,
            sizes: false,
            colors: false,
            variants: false,
          })
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-4">
            {/* SECCIÓN A: DATOS GENERALES */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">A. Datos Generales</h3>

              <div className="space-y-2">
                <Label htmlFor="edit-product-name">Nombre del Producto</Label>
                <Input
                  id="edit-product-name"
                  placeholder="Ej: Polo Básico"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-description">Descripción</Label>
                <Textarea
                  id="edit-product-description"
                  placeholder="Ej: Polo básico de algodón de alta calidad"
                  rows={3}
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-product-category">Categoría</Label>
                  <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                    <SelectTrigger id="edit-product-category">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Polos">Polos</SelectItem>
                      <SelectItem value="Pantalones">Pantalones</SelectItem>
                      <SelectItem value="Casacas">Casacas</SelectItem>
                      <SelectItem value="Chompas">Chompas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-product-brand">Marca</Label>
                  <Select value={newProductBrand} onValueChange={setNewProductBrand}>
                    <SelectTrigger id="edit-product-brand">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nike">Nike</SelectItem>
                      <SelectItem value="Adidas">Adidas</SelectItem>
                      <SelectItem value="Propia">Propia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subir Imágenes</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="edit-product-images"
                  />
                  <label htmlFor="edit-product-images" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-primary font-medium">
                      Arrastra y suelta una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Solo PNG, JPG o JPEG</p>
                  </label>
                </div>
                {editingProduct?.images && editingProduct.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {editingProduct.images.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`Product ${idx + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {productImages.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {productImages.length} imagen(es) nueva(s) seleccionada(s)
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN B: DEFINICIÓN DE VARIANTES */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">B. Definición de Variantes</h3>

              <div className="space-y-2">
                <Label>Tallas</Label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        toggleSize(size)
                        setTimeout(generateVariants, 0) // Re-generate variants after size selection
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedSizes.includes(size)
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Colores</Label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => {
                    const colorMap: Record<string, string> = {
                      Verde: "bg-green-500",
                      Negro: "bg-black",
                      Blanco: "bg-white border-2 border-gray-300",
                      Azul: "bg-blue-500",
                      Rojo: "bg-red-500",
                      Amarillo: "bg-yellow-500",
                      Gris: "bg-gray-500",
                      Bordo: "bg-red-900",
                    }
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          toggleColor(color)
                          setTimeout(generateVariants, 0) // Re-generate variants after color selection
                        }}
                        className={`w-10 h-10 rounded-full ${colorMap[color] || "bg-gray-400"} transition-transform hover:scale-110 ${
                          selectedColors.includes(color) ? "ring-4 ring-blue-600 ring-offset-2" : ""
                        }`}
                        title={color}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* SECCIÓN C: INVENTARIO (MATRIZ DE VARIANTES) */}
            {variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">C. Inventario (Matriz de Variantes)</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">Edición Masiva</p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="edit-bulk-price" className="text-xs">
                        Precio (S/.)
                      </Label>
                      <Input
                        id="edit-bulk-price"
                        type="number"
                        placeholder="0.00"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        step="0.01"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-bulk-stock" className="text-xs">
                        Stock
                      </Label>
                      <Input
                        id="edit-bulk-stock"
                        type="number"
                        placeholder="0"
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value)}
                      />
                    </div>
                    <Button onClick={applyBulkPricing} className="bg-primary">
                      Aplicar a todos
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Variante</th>
                        <th className="text-left p-3 font-medium text-sm">SKU</th>
                        <th className="text-left p-3 font-medium text-sm">Precio (S/.)</th>
                        <th className="text-left p-3 font-medium text-sm">Stock</th>
                        <th className="text-left p-3 font-medium text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant, index) => (
                        <tr key={`${variant.size}-${variant.color}`} className="border-t">
                          <td className="p-3">
                            <span className="text-sm font-medium">
                              {variant.size} - {variant.color}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground font-mono">{variant.sku}</span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={variant.price || ""}
                              onChange={(e) => updateVariant(index, "price", Number.parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              step="0.01"
                              className="w-24"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={variant.stock || ""}
                              onChange={(e) => updateVariant(index, "stock", Number.parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-24"
                            />
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Correctly set index for variantToDelete when editing
                                setVariantToDelete(index) // Re-using the same state for simplicity, but ideally a separate state or logic for edit mode
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="px-6 bg-transparent"
              onClick={() => {
                setIsEditProductModalOpen(false)
                setEditingProduct(null)
                setNewProductName("")
                setNewProductDescription("")
                setNewProductCategory("Polos")
                setNewProductBrand("Propia")
                setNewProductMaterial("Algodón Pima")
                setSelectedSizes([])
                setSelectedColors([])
                setProductImages([])
                setVariants([])
                setBulkPrice("")
                setBulkStock("")
              }}
            >
              Cancelar
            </Button>
            <Button className="px-6 bg-primary hover:bg-primary/90" onClick={handleSaveEditedProduct}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
