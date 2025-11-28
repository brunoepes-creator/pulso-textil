"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, Package, CalendarIcon } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

const sizeData = [
  { size: "XS", value: 45 },
  { size: "S", value: 75 },
  { size: "M", value: 120 },
  { size: "L", value: 100 },
  { size: "XL", value: 60 },
  { size: "XXL", value: 35 },
]

const productData = [
  { product: "Polo Casual", ventas: 2 },
  { product: "Polo Básico", ventas: 5 },
  { product: "Casaca Premium", ventas: 10 },
  { product: "Polo Premium", ventas: 15 },
]

const salesData = [
  { week: "Semana 1", value: 2500 },
  { week: "Semana 2", value: 3800 },
  { week: "Semana 3", value: 4800 },
  { week: "Semana 4", value: 6500 },
]

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 31),
  })
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("todas")

  const applyPreset = (preset: string) => {
    const today = new Date()
    let from = new Date()
    let to = new Date()

    switch (preset) {
      case "7days":
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        to = today
        break
      case "quarter":
        from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        to = today
        break
      case "year":
        from = new Date(today.getFullYear(), 0, 1)
        to = today
        break
    }

    setDateRange({ from, to })
    setIsOpen(false)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard de Bienvenida</h2>
          <p className="text-muted-foreground mt-1">Resumen general de tus operaciones</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              <SelectItem value="polos">Polos</SelectItem>
              <SelectItem value="chompas">Chompas</SelectItem>
              <SelectItem value="casacas">Casacas</SelectItem>
              <SelectItem value="pantalones">Pantalones</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango de fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="border-b p-3 space-y-2">
                <p className="text-sm font-medium mb-2">Rangos predeterminados</p>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset("7days")}
                    className="justify-start"
                  >
                    Últimos 7 días
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset("quarter")}
                    className="justify-start"
                  >
                    Último trimestre
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset("year")}
                    className="justify-start"
                  >
                    Este año
                  </Button>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                    setIsOpen(false)
                  }
                }}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pedidos Pendientes</p>
              <p className="text-3xl font-bold text-foreground mt-2">5</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ventas del Mes</p>
              <p className="text-3xl font-bold text-foreground mt-2">S/ 45,400</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Órdenes del Mes</p>
              <p className="text-3xl font-bold text-foreground mt-2">239</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Lo Más Consultado (Tallas)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                value: {
                  label: "Consultas",
                  color: "hsl(210, 100%, 50%)",
                },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="size"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(210, 100%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lo Más Vendido (Productos)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                ventas: {
                  label: "Ventas",
                  color: "hsl(25, 95%, 53%)",
                },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="horizontal" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 20]}
                  />
                  <YAxis
                    type="category"
                    dataKey="product"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={95}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ventas" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas en el Tiempo (Semanal)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer
            config={{
              value: {
                label: "Ventas (S/)",
                color: "hsl(180, 70%, 40%)",
              },
            }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(180, 70%, 40%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(180, 70%, 40%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
