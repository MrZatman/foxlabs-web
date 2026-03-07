import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react'

interface KPIs {
  total: number
  completed: number
  failed: number
  active: number
  avgTime: number
  successRate: number
  byClient: Array<{ name: string; count: number; completed: number }>
  byStatus: Record<string, number>
}

export function HistoryKPIs({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard
        icon={<FileText size={20} />}
        label="Total"
        value={kpis.total.toString()}
        color="zinc"
      />
      <KPICard
        icon={<CheckCircle size={20} />}
        label="Completados"
        value={kpis.completed.toString()}
        color="green"
      />
      <KPICard
        icon={<XCircle size={20} />}
        label="Fallidos"
        value={kpis.failed.toString()}
        color="red"
      />
      <KPICard
        icon={<Activity size={20} />}
        label="Activos"
        value={kpis.active.toString()}
        color="orange"
      />
      <KPICard
        icon={<Clock size={20} />}
        label="Tiempo Prom."
        value={`${kpis.avgTime}h`}
        color="blue"
      />
      <KPICard
        icon={<TrendingUp size={20} />}
        label="Tasa Exito"
        value={`${kpis.successRate}%`}
        color="purple"
      />
    </div>
  )
}

function KPICard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'zinc' | 'green' | 'red' | 'orange' | 'blue' | 'purple'
}) {
  const colors = {
    zinc: 'text-zinc-400 bg-zinc-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10'
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-zinc-500">{label}</div>
      </CardContent>
    </Card>
  )
}
