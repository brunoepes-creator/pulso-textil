"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Calendar as CalendarIcon, Filter, Loader2 } from 'lucide-react'
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { supabase } from "@/lib/supabase"
import DashboardCharts from "./dashboard-charts"
import DashboardTable from "./dashboard-table"

// Transformador de datos robusto
const transformData = (row: any) => {
  const getVal = (keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined) return row[key];
    }
    return null;
  };

  return {
    id: getVal(["ID Pedido", "id_pedido", "id"]),
    fecha: getVal(["Fecha Orden", "fecha_orden", "created_at"]) || new Date().toISOString(),
    fechaStr: getVal(["Fecha Compra", "fecha_compra"]), 
    cliente: getVal(["Cliente", "cliente", "nombre_cliente"]) || "Cliente Invitado",
    clientId: getVal(["ID Cliente", "cliente_final_id"]),
    producto: getVal(["Producto", "nombre_producto"]),
    categoria: getVal(["Categoria", "nombre_categoria"]) || "Otros",
    talla: getVal(["Talla", "nombre_talla"]) || "U",
    genero: getVal(["Genero", "nombre_genero"]) || "Uni",
    estado: getVal(["Estado", "estado_pedido"]) || "PENDIENTE",
    total: Number(getVal(["Total", "total", "monto_total"])) || 0,
    cantidad: Number(getVal(["Cant.", "Cant", "cantidad"])) || 1,
    marca: getVal(["Marca", "nombre_marca"])
  }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("commercial")
  const [date, setDate] = useState<DateRange | undefined>({ 
    from: subYears(new Date(), 1), 
    to: new Date() 
  })
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [processedData, setProcessedData] = useState<any[]>([])

  // Carga de datos desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const fromISO = date?.from ? startOfDay(date.from).toISOString() : null
        const toISO = date?.to ? endOfDay(date.to).toISOString() : null

        console.log("📅 FILTRO DE FECHAS:", { fromISO, toISO })

        const { data: rawData, error } = await supabase
          .from('vista_reporte_cliente')
          .select('*')
          .order('Fecha Orden', { ascending: false })

        if (error) throw error

        console.log("🔍 DATOS CRUDOS DE SUPABASE:", rawData?.length, "registros")
        if (rawData && rawData.length > 0) {
          console.log("Primer registro:", rawData[0])
          console.log("Último registro:", rawData[rawData.length - 1])
        }

        // Transformar y filtrar datos
        const processed = (rawData || [])
          .map(transformData)
          .filter(item => {
             if (!fromISO || !toISO) return true
             return item.fecha >= fromISO && item.fecha <= toISO
          })

        console.log("✅ Datos procesados:", processed.length)
        if (processed.length > 0) {
          const fechas = processed.map(d => d.fecha).sort()
          console.log("📊 Rango de datos:", fechas[0], "→", fechas[fechas.length - 1])
        }

        setProcessedData(processed)

      } catch (error) { 
        console.error("❌ Error Dashboard:", error) 
      } finally { 
        setLoading(false) 
      }
    }
    fetchData()
  }, [date, chartView])

  // Manejador de filtros preestablecidos
  const handlePresetChange = (val: string) => {
    const today = new Date()
    
    switch(val) {
      case 'hoy':
        setDate({ from: startOfDay(today), to: endOfDay(today) })
        setChartView('daily')
        break
      case '7dias':
        setDate({ from: subDays(today, 7), to: today })
        setChartView('daily')
        break
      case 'este_mes':
        setDate({ from: startOfMonth(today), to: endOfMonth(today) })
        setChartView('daily')
        break
      case 'mes_anterior':
        const lastMonth = subMonths(today, 1)
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
        setChartView('daily')
        break
      case '3meses':
        setDate({ from: subMonths(today, 3), to: today })
        setChartView('monthly')
        break
      case '1anio':
        setDate({ from: subYears(today, 1), to: today })
        setChartView('monthly')
        break
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER CON FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard Comercial
          </h2>
          <p className="text-slate-500">
            Vista unificada de rendimiento.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Vista */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[150px] bg-white border-slate-300">
              <LayoutDashboard className="w-4 h-4 mr-2 text-slate-500"/>
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial">📊 Gráficos</SelectItem>
              <SelectItem value="tabla">📋 Datos</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Selector de Periodo */}
          <Select onValueChange={handlePresetChange} defaultValue="1anio">
            <SelectTrigger className="w-[150px] bg-white border-dashed border-slate-300">
              <Filter className="w-4 h-4 mr-2 text-slate-500"/>
              <SelectValue placeholder="Periodo"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="7dias">Últimos 7 Días</SelectItem>
              <SelectItem value="este_mes">Este Mes</SelectItem>
              <SelectItem value="mes_anterior">Mes Pasado</SelectItem>
              <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="1anio">Último Año</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Selector de Rango de Fechas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[220px] justify-start bg-white border-slate-300 font-normal">
                <CalendarIcon className="mr-2 h-4 w-4 text-slate-500"/>
                {date?.from ? (
                  <>
                    {format(date.from, "dd MMM yy", { locale: es })} - {date.to && format(date.to, "dd MMM yy", { locale: es })}
                  </>
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-xl rounded-xl z-50" align="end">
              <CalendarComponent 
                autoFocus 
                mode="range" 
                defaultMonth={date?.from} 
                selected={date} 
                onSelect={setDate} 
                numberOfMonths={2} 
                locale={es} 
                className="p-3 bg-white rounded-md"
                classNames={{
                  head_row: "flex w-full justify-between mb-2",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-2 justify-between",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md",
                  day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-700 focus:text-white"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600"/>
        </div>
      ) : (
        <>
          {viewMode === 'commercial' && (
            <DashboardCharts 
              data={processedData} 
              chartView={chartView} 
              setChartView={setChartView}
            />
          )}
          
          {viewMode === 'tabla' && (
            <DashboardTable data={processedData} />
          )}
        </>
      )}
    </div>
  )
}
