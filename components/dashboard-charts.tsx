"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, ShoppingCart, Wallet, Package, TrendingUp, Star, Box, 
  Ruler, Shirt, Flame
} from 'lucide-react'
import { 
  Bar, BarChart, Line, LineChart, PieChart, Pie, Cell, 
  CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip 
} from "recharts"
import { format, parseISO, getDay, getHours, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

const THEME = {
  primary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  charts: ["#6366f1", "#06b6d4", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981"]
}

interface DashboardChartsProps {
  data: any[]
  chartView: "daily" | "weekly" | "monthly" | "yearly"
  setChartView: (view: "daily" | "weekly" | "monthly" | "yearly") => void
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const textAnchor = Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end';
  
  return (
    <g>
      <text 
        x={x} 
        y={y} 
        fill="#0f172a" 
        textAnchor={textAnchor} 
        dominantBaseline="central"
        style={{pointerEvents: 'none'}}
      >
        <tspan fontSize="14" fontWeight="800">{`${(percent * 100).toFixed(0)}%`}</tspan>
      </text>
      <text 
        x={x} 
        y={y + 14} 
        fill="#64748b" 
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{pointerEvents: 'none'}}
      >
        <tspan fontSize="10" fontWeight="600">{name}</tspan>
      </text>
    </g>
  );
};

export default function DashboardCharts({ data, chartView, setChartView }: DashboardChartsProps) {
  const [kpis, setKpis] = useState({ venta: 0, ticket: 0, upt: 0, efectividad: 0, pedidos: 0 })
  const [trendData, setTrendData] = useState<any[]>([])
  const [catData, setCatData] = useState<any[]>([])
  const [sizeData, setSizeData] = useState<any[]>([])
  const [genderData, setGenderData] = useState<any[]>([])
  const [brandData, setBrandData] = useState<any[]>([])
  const [topProds, setTopProds] = useState<any[]>([])
  const [cashFlowData, setCashFlowData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(0).map(() => Array(24).fill(0)))

  useEffect(() => {
    if (!data.length) return;

    // KPIs
    const totalVenta = data.reduce((sum, item) => sum + item.total, 0)
    const uniqueOrders = new Set(data.map(item => item.id)).size
    const totalUnits = data.reduce((sum, item) => sum + item.cantidad, 0)

    let real = 0, pendiente = 0
    data.forEach(item => {
    const st = String(item.estado).toUpperCase()
    
    // Clasificación más robusta
    if (st.includes('ENTREGADO') || st.includes('PAGADO') || st.includes('COMPLETADO')) {
        real += item.total
    } else if (st.includes('PENDIENTE') || st.includes('PROCESO') || st.includes('EN_CAMINO')) {
        pendiente += item.total
    } else if (st.includes('RECIBIDO') || st.includes('ENVIADO')) {
        real += item.total
    } else {
        // Por defecto, si no coincide con nada, va a pendiente
        pendiente += item.total
    }
    })

    console.log("💰 Flujo de Caja DEBUG:", {
    real,
    pendiente,
    total: real + pendiente,
    estados: [...new Set(data.map(d => d.estado))]
    })

    setKpis({
      venta: totalVenta,
      pedidos: uniqueOrders,
      ticket: uniqueOrders > 0 ? totalVenta / uniqueOrders : 0,
      upt: uniqueOrders > 0 ? totalUnits / uniqueOrders : 0,
      efectividad: totalVenta > 0 ? (real / totalVenta * 100) : 0,
    })

    setCashFlowData([
      { name: 'Ingresado', value: real, color: THEME.success },
      { name: 'Pendiente', value: pendiente, color: THEME.warning }
    ].filter(d => d.value > 0))

    // Distribuciones
    const cats: any = {}, sizes: any = {}, genders: any = {}, brands: any = {}
    data.forEach(item => {
      cats[item.categoria] = (cats[item.categoria] || 0) + item.cantidad
      sizes[item.talla] = (sizes[item.talla] || 0) + item.cantidad
      genders[item.genero] = (genders[item.genero] || 0) + item.cantidad
      if (item.marca) brands[item.marca] = (brands[item.marca] || 0) + item.cantidad
    })

    const sortObj = (obj: any) => Object.entries(obj).map(([name, value]: any) => ({ name, value })).sort((a, b) => b.value - a.value)

    setCatData(sortObj(cats))
    setSizeData(sortObj(sizes))
    setGenderData(sortObj(genders))
    setBrandData(sortObj(brands))

    // Top Productos
    const prods: any = {}
    data.forEach(item => {
      prods[item.producto] = (prods[item.producto] || 0) + item.total
    })
    setTopProds(sortObj(prods).slice(0, 5))

    // Tendencia y Heatmap
    const trend: any = {}
    const grid = Array(7).fill(0).map(() => Array(24).fill(0))

    data.forEach(item => {
      const d = parseISO(item.fecha)
      if (isValid(d)) {
        grid[getDay(d)][getHours(d)] += 1

        let key = format(d, 'dd MMM', { locale: es })
        let sort = parseInt(format(d, 'yyyyMMdd'))
        if (chartView === 'weekly') { key = `Sem ${format(d, 'w')}`; sort = parseInt(format(d, 'yyyyww')) }
        if (chartView === 'monthly') { key = format(d, 'MMM yy', { locale: es }); sort = parseInt(format(d, 'yyyyMM')) }
        if (chartView === 'yearly') { key = format(d, 'yyyy'); sort = parseInt(format(d, 'yyyy')) }

        if (!trend[key]) trend[key] = { name: key, total: 0, sort }
        trend[key].total += item.total
      }
    })
    setHeatmapData(grid)
    setTrendData(Object.values(trend).sort((a: any, b: any) => a.sort - b.sort))

  }, [data, chartView])

  const axisStyle = { fontSize: 12, fill: '#64748b', fontWeight: 500 }
  const daysLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const hoursLabels = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* FILA 1: KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Venta Total" value={`S/ ${kpis.venta.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" sub="Ingresos brutos" />
        <KpiCard title="Total Pedidos" value={kpis.pedidos} icon={ShoppingCart} color="text-blue-600" sub="Transacciones" />
        <KpiCard title="Ticket Promedio" value={`S/ ${kpis.ticket.toFixed(0)}`} icon={Wallet} color="text-purple-600" sub="Por cliente" />
        <KpiCard title="UPT (Unid/Tx)" value={kpis.upt.toFixed(1)} icon={Package} color="text-orange-500" sub="Artículos por venta" />
      </div>

      {/* FILA 2: EVOLUCIÓN + FLUJO */}
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
              <TrendingUp className="h-5 w-5 text-indigo-600" /> Evolución de Ventas
            </CardTitle>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {["daily", "weekly", "monthly", "yearly"].map(v =>
                <button
                  key={v}
                  onClick={() => setChartView(v as any)}
                  className={cn("px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all",
                    chartView === v ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  {v === 'daily' ? 'Día' : v === 'weekly' ? 'Sem' : v === 'monthly' ? 'Mes' : 'Año'}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `S/${v / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(val) => [`S/ ${Number(val).toLocaleString()}`, "Ventas"]} />
                <Line type="monotone" dataKey="total" stroke={THEME.primary} strokeWidth={4} dot={{ r: 4, fill: THEME.primary, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
                <Wallet className="h-5 w-5 text-amber-500" /> Flujo de Caja
              </CardTitle>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">
                Efec: {kpis.efectividad.toFixed(0)}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cashFlowData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {cashFlowData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} stroke="white" strokeWidth={3} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `S/ ${Number(v).toLocaleString()}`} contentStyle={{ fontSize: '12px', borderRadius: '8px', padding: '8px 12px' }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-0.6em" fontSize="11" fill="#94a3b8" fontWeight="600">Venta Total</tspan>
                    <tspan x="50%" dy="1.4em" fontSize="16" fontWeight="800" fill="#0f172a">S/{(kpis.venta / 1000).toFixed(1)}k</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>}
          </CardContent>
        </Card>
      </div>

      {/* FILA 3: TOP PRODUCTOS + CATEGORÍAS */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
              <Star className="h-5 w-5 text-amber-500" /> Top Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topProds} margin={{ left: 0, right: 40, bottom: 0, top: 5 }}>
                <CartesianGrid horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={axisStyle} tickFormatter={(v) => `S/${v / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => `S/ ${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill={THEME.warning} radius={[0, 6, 6, 0]} barSize={28}>
                  <Cell fill={THEME.charts[4]} />
                  <Cell fill={THEME.charts[1]} />
                  <Cell fill={THEME.charts[0]} />
                  <Cell fill={THEME.charts[2]} />
                  <Cell fill={THEME.charts[3]} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
              <Box className="h-5 w-5 text-indigo-600" /> Top Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={catData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '8px 12px' }} />
                  <Bar dataKey="value" fill={THEME.primary} radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>}
          </CardContent>
        </Card>
      </div>

      {/* FILA 4: ANILLOS */}
      <div className="grid gap-8 md:grid-cols-3">
        <ChartCard title="Talla" icon={Ruler} color={THEME.success}>
          {sizeData.length > 0 ? (
            <PieChart>
              <Pie
                data={sizeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {sizeData.map((e, i) => <Cell key={`cell-${i}`} fill={THEME.charts[i % 6]} stroke="white" strokeWidth={3} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', padding: '8px 12px' }} formatter={(v, name) => [`${v} unidades`, name]} />
            </PieChart>
          ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>}
        </ChartCard>

        <ChartCard title="Género" icon={Shirt} color="#ec4899">
          {genderData.length > 0 ? (
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {genderData.map((e, i) => <Cell key={`cell-${i}`} fill={[THEME.charts[0], THEME.charts[2], THEME.charts[4]][i]} stroke="white" strokeWidth={3} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', padding: '8px 12px' }} formatter={(v, name) => [`${v} unidades`, name]} />
            </PieChart>
          ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>}
        </ChartCard>

        <ChartCard title="Marca" icon={Star} color="#8b5cf6">
          {brandData.length > 0 ? (
            <PieChart>
              <Pie
                data={brandData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {brandData.map((e, i) => <Cell key={`cell-${i}`} fill={THEME.charts[i % 6]} stroke="white" strokeWidth={3} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', padding: '8px 12px' }} formatter={(v, name) => [`${v} unidades`, name]} />
            </PieChart>
          ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>}
        </ChartCard>
      </div>

      {/* FILA 5: HEATMAP */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
              <Flame className="h-5 w-5 text-orange-500" /> Mapa de Calor (Tráfico)
            </CardTitle>
            <div className="flex gap-3 text-xs font-semibold text-slate-600 items-center">
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-emerald-100 rounded"></span>Bajo</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-400 rounded"></span>Medio</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-rose-500 rounded"></span>Alto</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex mb-2 ml-10">
              {hoursLabels.map(h => <div key={h} className="flex-1 text-[10px] text-center text-slate-400 font-semibold">{h % 2 === 0 ? h : ''}</div>)}
            </div>
            <div className="space-y-1">
              {daysLabels.map((day, dIdx) => {
                const max = Math.max(...heatmapData.flat()) || 1;
                const third = max / 3;

                return (
                  <div key={day} className="flex items-center">
                    <div className="w-10 text-xs font-bold text-slate-600">{day}</div>
                    {heatmapData[dIdx]?.map((val: any, hIdx: any) => {
                      let bgColor = '#f8fafc';
                      let textColor = 'transparent';
                      let intensity = '';

                      if (val > 0) {
                        if (val <= third) {
                          bgColor = '#d1fae5';
                          textColor = '#065f46';
                          intensity = 'Bajo';
                        } else if (val <= third * 2) {
                          bgColor = '#fbbf24';
                          textColor = '#78350f';
                          intensity = 'Medio';
                        } else {
                          bgColor = '#f43f5e';
                          textColor = '#ffffff';
                          intensity = 'Alto';
                        }
                      }

                      return (
                        <div key={hIdx} className="flex-1 h-10 mx-[1px] rounded-sm flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 hover:shadow-lg relative group cursor-default"
                          style={{ backgroundColor: bgColor, color: textColor }}>
                          {val > 0 && val}
                          {val > 0 && <span className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded z-50 whitespace-nowrap">{day} {hIdx}:00 • {val} Ops • {intensity}</span>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// Subcomponentes
const KpiCard = ({ title, value, icon: Icon, color, sub }: any) => (
  <Card className={cn("border-l-4 shadow-sm hover:shadow-md transition-all", color.replace('text-', 'border-'))}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
      <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</CardTitle>
      <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </CardHeader>
    <CardContent className="pl-4">
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      </div>
      <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
    </CardContent>
  </Card>
)

const ChartCard = ({ title, icon: Icon, color, children }: any) => (
  <Card className="shadow-sm border-slate-200 relative">
    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/30">
      <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <Icon className="h-4 w-4" style={{ color: color }} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-4">
      <div style={{ width: '100%', height: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)