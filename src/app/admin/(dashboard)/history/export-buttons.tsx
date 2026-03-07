'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Table, Loader2 } from 'lucide-react'

interface Request {
  id: string
  request_number: number
  title: string
  status: string
  priority: string
  type: string
  created_at: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  projects?: {
    name: string
    clients?: { name: string }
  }
}

interface KPIs {
  total: number
  completed: number
  failed: number
  active: number
  avgTime: number
  successRate: number
}

interface Props {
  requests: Request[]
  kpis: KPIs
  dateRange: { from: string; to: string }
}

const statusLabels: Record<string, string> = {
  inbox: 'Inbox',
  planning: 'Planificando',
  pending_approval: 'Esperando Aprobacion',
  approved: 'Aprobado',
  queued: 'En Cola',
  in_progress: 'En Progreso',
  pending_review: 'En Review',
  pending_deploy: 'Desplegando',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado'
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
}

const typeLabels: Record<string, string> = {
  feature: 'Feature',
  bug: 'Bug',
  change: 'Cambio',
  support: 'Soporte',
  other: 'Otro'
}

export function ExportButtons({ requests, kpis, dateRange }: Props) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const exportToCSV = () => {
    setExporting('excel')

    try {
      // CSV headers
      const headers = [
        'Numero',
        'Titulo',
        'Cliente',
        'Proyecto',
        'Status',
        'Prioridad',
        'Tipo',
        'Creado',
        'Completado',
        'Horas Estimadas',
        'Horas Reales'
      ]

      // CSV rows
      const rows = requests.map(r => [
        r.request_number,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.projects?.clients?.name || '-'}"`,
        `"${r.projects?.name || '-'}"`,
        statusLabels[r.status] || r.status,
        priorityLabels[r.priority] || r.priority,
        typeLabels[r.type] || r.type,
        new Date(r.created_at).toLocaleDateString('es-MX'),
        r.completed_at ? new Date(r.completed_at).toLocaleDateString('es-MX') : '-',
        r.estimated_hours || '-',
        r.actual_hours || '-'
      ])

      // Add KPIs summary at the end
      const summary = [
        '',
        '',
        'RESUMEN',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]
      const kpiRows = [
        ['', '', 'Total Requests', kpis.total, '', '', '', '', '', '', ''],
        ['', '', 'Completados', kpis.completed, '', '', '', '', '', '', ''],
        ['', '', 'Fallidos', kpis.failed, '', '', '', '', '', '', ''],
        ['', '', 'Activos', kpis.active, '', '', '', '', '', '', ''],
        ['', '', 'Tiempo Promedio (h)', kpis.avgTime, '', '', '', '', '', '', ''],
        ['', '', 'Tasa de Exito (%)', kpis.successRate, '', '', '', '', '', '', '']
      ]

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        summary.join(','),
        ...kpiRows.map(row => row.join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `historial-requests-${dateRange.from}-${dateRange.to}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }

  const exportToPDF = () => {
    setExporting('pdf')

    try {
      // Create printable HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Historial de Requests - FoxLabs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #f97316; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .kpis { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
            .kpi { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
            .kpi-value { font-size: 24px; font-weight: bold; }
            .kpi-label { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f97316; color: white; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .status-completed { background: #dcfce7; color: #166534; }
            .status-failed { background: #fee2e2; color: #991b1b; }
            .status-in_progress { background: #ffedd5; color: #9a3412; }
            .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Historial de Requests</h1>
          <div class="subtitle">Periodo: ${dateRange.from} - ${dateRange.to}</div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-value">${kpis.total}</div>
              <div class="kpi-label">Total</div>
            </div>
            <div class="kpi">
              <div class="kpi-value" style="color: #16a34a;">${kpis.completed}</div>
              <div class="kpi-label">Completados</div>
            </div>
            <div class="kpi">
              <div class="kpi-value" style="color: #dc2626;">${kpis.failed}</div>
              <div class="kpi-label">Fallidos</div>
            </div>
            <div class="kpi">
              <div class="kpi-value" style="color: #f97316;">${kpis.active}</div>
              <div class="kpi-label">Activos</div>
            </div>
            <div class="kpi">
              <div class="kpi-value">${kpis.avgTime}h</div>
              <div class="kpi-label">Tiempo Prom.</div>
            </div>
            <div class="kpi">
              <div class="kpi-value" style="color: #7c3aed;">${kpis.successRate}%</div>
              <div class="kpi-label">Tasa Exito</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Titulo</th>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th>Status</th>
                <th>Prioridad</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => `
                <tr>
                  <td>${r.request_number}</td>
                  <td>${r.title}</td>
                  <td>${r.projects?.clients?.name || '-'}</td>
                  <td>${r.projects?.name || '-'}</td>
                  <td><span class="status status-${r.status}">${statusLabels[r.status] || r.status}</span></td>
                  <td>${priorityLabels[r.priority] || r.priority}</td>
                  <td>${new Date(r.created_at).toLocaleDateString('es-MX')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generado por FoxLabs - ${new Date().toLocaleString('es-MX')}
          </div>
        </body>
        </html>
      `

      // Open print dialog
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={exporting !== null || requests.length === 0}
        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
      >
        {exporting === 'pdf' ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : (
          <FileText size={16} className="mr-2" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        disabled={exporting !== null || requests.length === 0}
        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
      >
        {exporting === 'excel' ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : (
          <Table size={16} className="mr-2" />
        )}
        Excel/CSV
      </Button>
    </div>
  )
}
