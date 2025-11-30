"use client"

import { useState } from "react"
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
import { AlertCircle, User, FileText, Phone, Mail, Wallet } from "lucide-react"

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
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    nombres: "Juan",
    apellidos: "Pérez",
    tipoDocumento: "DNI",
    numeroDocumento: "12345678",
    telefonoPersonal: "987654321",
    emailPersonal: "juan.perez@email.com",
    telefonoBilletera: "987654321",
    nombreBilletera: "Yape",
  })

  const [tempData, setTempData] = useState<UserData>(userData)

  const handleEdit = () => {
    setTempData(userData)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setTempData(userData)
    setIsEditing(false)
  }

  const handleSaveClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSave = () => {
    setUserData(tempData)
    setIsEditing(false)
    setShowConfirmDialog(false)
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    setTempData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
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
              <Button onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSaveClick} variant="default">
                Guardar Cambios
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
