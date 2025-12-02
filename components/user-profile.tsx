"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// 1. Agregamos el icono 'X' para cerrar el mensaje
import { AlertCircle, User, FileText, Phone, Mail, Wallet, Loader2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  nombres: string
  apellidos: string
  tipoDocumento: string
  numeroDocumento: string
  telefonoPersonal: string
  emailPersonal: string
  telefonoBilletera: string
  nombreBilletera: string
}

export default function UserProfile() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // 2. Nuevo estado para controlar el mensaje verde de éxito
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // ID del emprendedor hardcodeado para el ejemplo
  const EMPRENDEDOR_ID = 1 

  const [userData, setUserData] = useState<UserData>({
    nombres: "",
    apellidos: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    telefonoPersonal: "",
    emailPersonal: "",
    telefonoBilletera: "",
    nombreBilletera: "",
  })

  const [tempData, setTempData] = useState<UserData>(userData)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('emprendedor_perfil')
          .select('*')
          .eq('emprendedor_id', EMPRENDEDOR_ID)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error("Error cargando perfil:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del perfil.",
            variant: "destructive",
          })
        }

        if (data) {
          const loadedData: UserData = {
            nombres: data.nombres || "",
            apellidos: data.apellidos || "",
            tipoDocumento: data.tipo_documento || "DNI",
            numeroDocumento: data.num_documento || "",
            telefonoPersonal: data.telefono_personal || "",
            emailPersonal: data.email_personal || "",
            telefonoBilletera: data.telefono_yape || "",
            nombreBilletera: data.nombre_yape || "",
          }
          setUserData(loadedData)
          setTempData(loadedData)
        }
      } catch (err) {
        console.error("Error inesperado:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleEdit = () => {
    setTempData(userData)
    setIsEditing(true)
    setShowSuccessMessage(false) // Ocultar mensaje si se vuelve a editar
  }

  const handleCancel = () => {
    setTempData(userData)
    setIsEditing(false)
  }

  const handleSaveClick = () => {
    setShowConfirmDialog(true)
  }

  // --- FUNCIÓN PRINCIPAL DE GUARDADO ---
  const handleConfirmSave = async () => {
    setIsSaving(true)
    setShowConfirmDialog(false)

    try {
      const profileData = {
        emprendedor_id: EMPRENDEDOR_ID,
        nombres: tempData.nombres,
        apellidos: tempData.apellidos,
        tipo_documento: tempData.tipoDocumento,
        num_documento: tempData.numeroDocumento,
        telefono_personal: tempData.telefonoPersonal,
        email_personal: tempData.emailPersonal,
        telefono_yape: tempData.telefonoBilletera,
        nombre_yape: tempData.nombreBilletera,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('emprendedor_perfil')
        .upsert(profileData, { onConflict: 'emprendedor_id' })

      if (error) throw error

      setUserData(tempData)
      setIsEditing(false)
      
      // 3. ACTIVAR EL MENSAJE DE ÉXITO
      setShowSuccessMessage(true)
      
      // Opcional: También mostramos el toast flotante por si acaso
      toast({ title: "Éxito", description: "Datos guardados correctamente." })

      // 4. Temporizador para ocultar el mensaje automáticamente después de 5 segundos
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)

    } catch (error: any) {
      console.error("Error guardando perfil:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    setTempData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        
        {/* 5. Renderizado Condicional del Mensaje de Éxito */}
        {showSuccessMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-green-500 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-medium text-green-800">Datos actualizados correctamente.</p>
            <button onClick={() => setShowSuccessMessage(false)} className="text-green-800 hover:text-green-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Datos</h1>
            <p className="text-sm text-muted-foreground">Visualiza y edita tu información personal</p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} variant="default">
              Editar Datos
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Información Personal */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Información Personal</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={isEditing ? tempData.nombres : userData.nombres}
                  onChange={(e) => handleInputChange("nombres", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={isEditing ? tempData.apellidos : userData.apellidos}
                  onChange={(e) => handleInputChange("apellidos", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Documento de Identidad */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Documento de Identidad</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                {isEditing ? (
                  <Select
                    value={tempData.tipoDocumento}
                    onValueChange={(value) => handleInputChange("tipoDocumento", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="tipoDocumento" value={userData.tipoDocumento} disabled className="mt-1" />
                )}
              </div>
              <div>
                <Label htmlFor="numeroDocumento">Número de Documento</Label>
                <Input
                  id="numeroDocumento"
                  value={isEditing ? tempData.numeroDocumento : userData.numeroDocumento}
                  onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Información de Contacto</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="telefonoPersonal">Teléfono Personal</Label>
                <Input
                  id="telefonoPersonal"
                  value={isEditing ? tempData.telefonoPersonal : userData.telefonoPersonal}
                  onChange={(e) => handleInputChange("telefonoPersonal", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emailPersonal">
                  <Mail className="mr-1 inline-block h-4 w-4" />
                  Email Personal
                </Label>
                <Input
                  id="emailPersonal"
                  type="email"
                  value={isEditing ? tempData.emailPersonal : userData.emailPersonal}
                  onChange={(e) => handleInputChange("emailPersonal", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Billetera Digital */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Billetera Digital</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nombreBilletera">Nombre de Billetera Digital</Label>
                <Input
                  id="nombreBilletera"
                  value={isEditing ? tempData.nombreBilletera : userData.nombreBilletera}
                  onChange={(e) => handleInputChange("nombreBilletera", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="Ej: Yape, Plin, etc."
                />
              </div>
              <div>
                <Label htmlFor="telefonoBilletera">Teléfono de Billetera Digital</Label>
                <Input
                  id="telefonoBilletera"
                  value={isEditing ? tempData.telefonoBilletera : userData.telefonoBilletera}
                  onChange={(e) => handleInputChange("telefonoBilletera", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción al editar */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSaveClick} variant="default" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirmar Cambios
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de guardar los cambios realizados en sus datos personales?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}