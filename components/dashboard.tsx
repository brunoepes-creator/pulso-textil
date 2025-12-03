"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, Clock, Star, ShoppingBag, Users, 
  Repeat, AlertTriangle, Download, LayoutDashboard, 
  BarChart3, LineChart, CalendarRange
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("commercial") 
  
  // Estado para los KPIs (Sin valor inventario)
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

  // 1. CÁLCULO EN EL FRONTEND
  useEffect(() => {
    const calculateMetrics = async () => {
      setLoading(true)
      try {
        // TRAER TABLAS CRUDAS
        const { data: pedidos } = await supabase.from('pedido').select('*');
        const { data: clientes } = await supabase.from('cliente_final').select('*');
        const { data: stockItems } = await supabase.from('variacion_producto').select('*');
        
        const { data: detalles } = await supabase
          .from('detalle_pedido')
          .select(`
            cantidad,
            variacion_producto (
              producto ( nombre_producto )
            )
          `);

        // CÁLCULOS
        const ventasConfirmadas = pedidos?.filter((p: any) => p.estado_pedido === 'Confirmado') || [];
        const totalVentas = ventasConfirmadas.reduce((sum: number, p: any) => sum + Number(p.monto_total), 0);
        const numPendientes = pedidos?.filter((p: any) => p.estado_pedido === 'Pendiente').length || 0;
        const ticketPromedio = ventasConfirmadas.length > 0 ? totalVentas / ventasConfirmadas.length : 0;

        const itemsBajos = stockItems?.filter((i: any) => i.stock_cantidad_producto < 5).length || 0;

        const numClientes = clientes?.length || 0;
        const clientesConCompra = ventasConfirmadas.map((p: any) => p.cliente_final_id);
        const clientesUnicos = new Set(clientesConCompra);
        const recurrentes = clientesConCompra.length - clientesUnicos.size;

        // Ranking Producto
        const conteoProductos: Record<string, number> = {};
        if (detalles) {
          detalles.forEach((d: any) => {
            // @ts-ignore
            const nombre = d.variacion_producto?.producto?.nombre_producto || "Desconocido";
            conteoProductos[nombre] = (conteoProductos[nombre] || 0) + d.cantidad;
          });
        }
        const sortedProducts = Object.entries(conteoProductos)
          .map(([name, ventas]) => ({ name, ventas }))
          .sort((a, b) => b.ventas - a.ventas);
        
        const topName = sortedProducts.length > 0 ? sortedProducts[0].name : "N/A";
        setTopProductsData(sortedProducts.slice(0, 5));

        // Tendencia Mensual
        const tendenciaMap: Record<string, number> = {};
        ventasConfirmadas.forEach((p: any) => {
            const fecha = new Date(p.fecha_confirmacion || p.created_at); 
            const mes = fecha.toLocaleString('es-ES', { month: 'short' }); 
            tendenciaMap[mes] = (tendenciaMap[mes] || 0) + Number(p.monto_total);
        });
        const tendenciaArray = Object.entries(tendenciaMap).map(([name, total]) => ({ name, total }));
        setSalesTrendData(tendenciaArray);

        setKpis({
            ventas_mes: totalVentas,
            pedidos_pendientes: numPendientes,
            producto_top: topName,
            ticket_promedio: ticketPromedio,
            total_clientes: numClientes,
            clientes_recurrentes: recurrentes > 0 ? recurrentes : 0,
            stock_critico: itemsBajos
        })

      } catch (error) {
        console.error("Error calculando dashboard local:", error)
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
          <p className="text-muted-foreground">Resumen de operaciones PulsoTextil</p>
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
        <div className="text-center py-20 text-muted-foreground animate-pulse">Calculando datos...</div>
      ) : (
        <>
          {viewMode === 'commercial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Resumen Financiero</h3>
              {/* SE HA ELIMINADO LA TARJETA DE VALOR INVENTARIO Y AJUSTADO LAS COLUMNAS A 4 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Ventas Históricas" value={`S/ ${kpis.ventas_mes.toLocaleString()}`} icon={DollarSign} colorClass="text-emerald-600" helpText="Todo lo confirmado" />
                <KpiCard title="Pedidos Pendientes" value={kpis.pedidos_pendientes} icon={Clock} colorClass="text-orange-500" helpText="Por atender" />
                <KpiCard title="Ticket Promedio" value={`S/ ${kpis.ticket_promedio.toFixed(2)}`} icon={ShoppingBag} colorClass="text-blue-600" helpText="Gasto por cliente" />
                <KpiCard title="Producto Estrella" value={kpis.producto_top} icon={Star} colorClass="text-yellow-500" helpText="Más vendido" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                 <div className="col-span-1"><KpiCard title="Alertas Stock" value={kpis.stock_critico} icon={AlertTriangle} colorClass="text-red-600" helpText="Productos < 5" /></div>
                 <Card className="col-span-2 bg-blue-50 border-blue-100 shadow-sm">
                    <CardHeader><CardTitle className="text-blue-800 text-base">💡 Estado Comercial</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-700">
                            Actualmente tienes <strong>{kpis.pedidos_pendientes} pedidos por atender</strong>. 
                            Tu producto estrella es <strong>{kpis.producto_top}</strong>.
                        </p>
                    </CardContent>
                 </Card>
              </div>
            </div>
          )}

          {viewMode === 'customers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Clientes</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <KpiCard title="Total Clientes" value={kpis.total_clientes} icon={Users} colorClass="text-indigo-600" helpText="Base de datos" />
                <KpiCard title="Clientes Fieles" value={kpis.clientes_recurrentes} icon={Repeat} colorClass="text-purple-600" helpText="Recompra estimada" />
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

          {viewMode === 'visual' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Gráficos</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-blue-600"/> Ranking Productos</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    {topProductsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsData} layout="vertical" margin={{top: 5, right: 30, left: 100, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} style={{fontSize: '11px', fontWeight: 'bold'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} />
                          <Legend />
                          <Bar name="Unidades" dataKey="ventas" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-sm">Sin datos.</div>}
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarRange className="h-5 w-5 text-emerald-600"/> Tendencia Mensual</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    {salesTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesTrendData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => `S/ ${value}`} />
                          <Legend />
                          <Bar name="Ventas (S/)" dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-sm">Sin historial.</div>}
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
