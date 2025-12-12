"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table as TableIcon, Download } from 'lucide-react'
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface DashboardTableProps {
  data: any[]
}

export default function DashboardTable({ data }: DashboardTableProps) {
  
  const handleDownload = () => {
    if (!data.length) return
    
    const headers = ["Fecha", "Cliente", "Producto", "Categoria", "Talla", "Total", "Estado"]
    const csv = "\uFEFF" + [
      headers.join(','), 
      ...data.map(r => 
        [r.fechaStr, r.cliente, r.producto, r.categoria, r.talla, r.total, r.estado]
          .map(c => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      )
    ].join('\n')
    
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement("a")
    link.href = url
    link.download = `Reporte_Ventas_${format(new Date(), 'yyyyMMdd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row justify-between items-center bg-slate-50/50 pb-6 border-b border-slate-100">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <TableIcon className="h-6 w-6 text-indigo-600"/> 
              Historial de Transacciones
            </CardTitle>
            <CardDescription>
              Registros normalizados ({data.length} transacciones)
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white" 
            onClick={handleDownload}
            disabled={!data.length}
          >
            <Download className="w-4 h-4 mr-2"/> 
            Exportar CSV
          </Button>
        </CardHeader>
        
        <CardContent className="p-0 overflow-auto">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <p>No hay datos para mostrar en el rango seleccionado</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-center">Categoría</th>
                  <th className="px-6 py-4 text-center">Talla</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {format(parseISO(r.fecha), "dd MMM yy HH:mm", {locale:es})}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.cliente}
                    </td>
                    <td className="px-6 py-4">
                      {r.producto}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500">
                      {r.categoria}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                        {r.talla}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      S/ {Number(r.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        r.estado.toUpperCase().includes('ENTREGADO') || r.estado.toUpperCase().includes('PAGADO')
                          ? 'bg-green-100 text-green-700'
                          : r.estado.toUpperCase().includes('ENVIADO')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}