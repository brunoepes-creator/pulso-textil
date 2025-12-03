"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, Clock, Star, ShoppingBag, Users, 
  Repeat, AlertTriangle, Download, LayoutDashboard, 
  BarChart3, CalendarRange, Loader2
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { supabase } from "@/lib/supabase"
// Usamos date-fns para formateo seguro de fechas
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("commercial") 
  
  // Estado para los KPIs
  const [kpis, setKpis] = useState({
    ventas_mes: 0,
    pedidos_pendientes: 0,
    producto_top: "N/A",
    ticket_promedio: 0,
    total_clientes: 0,
    clientes_recurrentes: 0,
    stock_critico: 0
  })

  const [topProductsData, setTopProductsData] = useState<any[]>([])
  const [salesTrendData, setSalesTrendData] = useState<any[]>([])

  useEffect(() => {
    const calculateMetrics = async () => {
      setLoading(true)
      try {
        // 1. TRAER DATOS DE SUPABASE
        // Pedidos
        const { data: pedidos } = await supabase.from('pedido').select('*')
        
        // Clientes
        const { count: numClientes, data: clientes } = await supabase
          .from('cliente_final')
          .select('cliente_final_id', { count: 'exact' })

        // Stock (Variaciones)
        const { data: stockItems } = await supabase
          .from('vista_catalogo_simple')
          .select('stock')
        
        // Detalles (para Producto Top)
        const { data: detalles } = await supabase
          .from('detalle_pedido')
          .select(`
            cantidad,
            variacion_producto (
              producto ( nombre_producto )
            )
          `)

        // 2. PROCESAMIENTO DE DATOS (Lógica de Negocio)

        // -- Filtrar Ventas Confirmadas (Flujo logístico completo)
        const ventasConfirmadas = pedidos?.filter((p: any) => 
          ['PENDIENTE_ENVIO', 'ENVIADO', 'RECIBIDO'].includes(p.estado_pedido)
        ) || []

        const totalVentas = ventasConfirmadas.reduce((sum: number, p: any) => sum + Number(p.monto_total), 0)
        
        // -- Pedidos por atender (Solo validación pendiente)
        const numPendientes = pedidos?.filter((p: any) => p.estado_pedido === 'PENDIENTE_VALIDACION').length || 0
        
        const ticketPromedio = ventasConfirmadas.length > 0 ? totalVentas / ventasConfirmadas.length : 0

        // -- Stock Crítico (< 5 unidades)
        const itemsBajos = stockItems?.filter((i: any) => i.stock < 20).length || 0

        // -- Clientes Recurrentes
        // Mapeamos IDs de clientes que han comprado
        const clientesConCompra = ventasConfirmadas.map((p: any) => p.cliente_final_id).filter(Boolean)
        
        // Contamos cuántas veces aparece cada ID
        const frecuenciaClientes: Record<string, number> = {}
        clientesConCompra.forEach((id: number) => {
            frecuenciaClientes[id] = (frecuenciaClientes[id] || 0) + 1
        })
        // Filtramos los que tienen > 1 compra
        const recurrentes = Object.values(frecuenciaClientes).filter(count => count > 1).length


        // -- Ranking Producto Estrella
        const conteoProductos: Record<string, number> = {}
        if (detalles) {
          detalles.forEach((d: any) => {
            // Navegación segura en caso de datos nulos
            const nombre = d.variacion_producto?.producto?.nombre_producto || "Desconocido"
            conteoProductos[nombre] = (conteoProductos[nombre] || 0) + d.cantidad
          })
        }
        
        const sortedProducts = Object.entries(conteoProductos)
          .map(([name, ventas]) => ({ name, ventas }))
          .sort((a, b) => b.ventas - a.ventas)
        
        const topName = sortedProducts.length > 0 ? sortedProducts[0].name : "N/A"
        setTopProductsData(sortedProducts.slice(0, 5)) // Top 5


        // -- Tendencia Mensual (Ordenada Cronológicamente)
        const tendenciaMap: Record<string, { total: number, mesNum: number }> = {}
        
        ventasConfirmadas.forEach((p: any) => {
            const fecha = p.fecha_confirmacion ? parseISO(p.fecha_confirmacion) : parseISO(p.created_at)
            // Clave: "Ene 2024"
            const mesLabel = format(fecha, 'MMM yyyy', { locale: es })
            // Clave ordenamiento: 202401 (AñoMes)
            const mesSortKey = parseInt(format(fecha, 'yyyyMM'))
            
            if (!tendenciaMap[mesLabel]) {
                tendenciaMap[mesLabel] = { total: 0, mesNum: mesSortKey }
            }
            tendenciaMap[mesLabel].total += Number(p.monto_total)
        })

        // Convertir a array y ordenar por el número de mes
        const tendenciaArray = Object.entries(tendenciaMap)
            .map(([name, data]) => ({ name, total: data.total, sortKey: data.mesNum }))
            .sort((a, b) => a.sortKey - b.sortKey)

        setSalesTrendData(tendenciaArray)

        // -- SETEAR ESTADOS FINALES
        setKpis({
            ventas_mes: totalVentas,
            pedidos_pendientes: numPendientes,
            producto_top: topName,
            ticket_promedio: ticketPromedio,
            total_clientes: numClientes || 0,
            clientes_recurrentes: recurrentes,
            stock_critico: itemsBajos
        })

      } catch (error) {
        console.error("Error calculando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    calculateMetrics()
  }, [])

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "INDICADOR,VALOR\n"
      + `Ventas Totales,S/ ${kpis.ventas_mes}\n`
      + `Pedidos Pendientes,${kpis.pedidos_pendientes}\n`
      + `Ticket Promedio,S/ ${kpis.ticket_promedio}\n`
      + `Producto Estrella,${kpis.producto_top}\n`
      + `Alertas Stock,${kpis.stock_critico}\n`
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "Reporte_PulsoTextil.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Componente de Tarjeta KPI reutilizable
  const KpiCard = ({ title, value, icon: Icon, colorClass, helpText }: any) => (
    <Card className="border-l-4 border-l-transparent hover:border-l-blue-600 transition-all shadow-sm hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 truncate" title={String(value)}>{value}</div>
        {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[260px] bg-white shadow-sm">
              <LayoutDashboard className="w-4 h-4 mr-2 text-muted-foreground"/>
              <SelectValue placeholder="Seleccionar Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial">💰 Ventas y Rendimiento</SelectItem>
              <SelectItem value="customers">👥 Métricas de Clientes</SelectItem>
              <SelectItem value="visual">📊 Análisis Visual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white shadow-sm hover:bg-slate-100" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* VISTA COMERCIAL (DEFAULT) */}
          {viewMode === 'commercial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Resumen Financiero</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Ventas Históricas" value={`S/ ${kpis.ventas_mes.toLocaleString()}`} icon={DollarSign} colorClass="text-emerald-600" helpText="Ingresos confirmados" />
                <KpiCard title="Pedidos Pendientes" value={kpis.pedidos_pendientes} icon={Clock} colorClass="text-orange-500" helpText="Requieren validación" />
                <KpiCard title="Ticket Promedio" value={`S/ ${kpis.ticket_promedio.toFixed(2)}`} icon={ShoppingBag} colorClass="text-blue-600" helpText="Gasto por cliente" />
                <KpiCard title="Producto Estrella" value={kpis.producto_top} icon={Star} colorClass="text-yellow-500" helpText="Más vendido" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                 <div className="col-span-1"><KpiCard title="Alertas Stock" value={kpis.stock_critico} icon={AlertTriangle} colorClass="text-red-600" helpText="Productos < 20 unid." /></div>
                 <Card className="col-span-2 bg-blue-50 border-blue-100 shadow-sm">
                    <CardHeader><CardTitle className="text-blue-800 text-base">💡 Estado Comercial</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-700">
                            Tu negocio está en marcha. Actualmente tienes <strong>{kpis.pedidos_pendientes} pedidos</strong> esperando validación. 
                            Asegúrate de revisar el stock de tus <strong>{kpis.stock_critico} productos en alerta</strong>.
                        </p>
                    </CardContent>
                 </Card>
              </div>
            </div>
          )}

          {/* VISTA CLIENTES */}
          {viewMode === 'customers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Clientes</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <KpiCard title="Total Clientes" value={kpis.total_clientes} icon={Users} colorClass="text-indigo-600" helpText="Base de datos" />
                <KpiCard title="Clientes Recurrentes" value={kpis.clientes_recurrentes} icon={Repeat} colorClass="text-purple-600" helpText="Más de 1 compra" />
                <Card className="bg-gradient-to-br from-white to-indigo-50 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground uppercase">Tasa de Fidelidad</p>
                            <div className="text-3xl font-bold text-indigo-700 mt-2">
                                {kpis.total_clientes > 0 ? ((kpis.clientes_recurrentes / kpis.total_clientes) * 100).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">De tus clientes vuelven a comprar.</p>
                        </div>
                    </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VISTA GRÁFICOS */}
          {viewMode === 'visual' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Gráficos</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-blue-600"/> Ranking Productos</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    {topProductsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsData} layout="vertical" margin={{top: 5, right: 30, left: 80, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={130} style={{fontSize: '11px', fontWeight: '500'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px' }} />
                          <Legend />
                          <Bar name="Unidades" dataKey="ventas" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sin datos de ventas aún.</div>}
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarRange className="h-5 w-5 text-emerald-600"/> Tendencia Mensual</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    {salesTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesTrendData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => `S/ ${Number(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px' }} />
                          <Legend />
                          <Bar name="Ventas (S/)" dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sin historial de ventas.</div>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}