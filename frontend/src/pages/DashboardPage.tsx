import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { DashboardData } from '../lib/api'

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}
const priorityLabels: Record<string, string> = { HIGH: 'Urgente', MEDIUM: 'Média', LOW: 'Baixa' }

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em progresso',
  DONE: 'Concluída',
}

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number; icon: string; color: string; sub?: string
}) {
  return (
    <div className={`bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/8 transition-all duration-200 hover:-translate-y-0.5`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Erro ao carregar dados: {error}
      </div>
    )
  }

  const { stats, byCategory, recentTasks } = data

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total de tarefas" value={stats.total} icon="📋" color="bg-violet-500/20 text-violet-400" />
        <StatCard label="Concluídas hoje" value={stats.completedToday} icon="✅" color="bg-emerald-500/20 text-emerald-400" sub="Ótimo progresso!" />
        <StatCard label="Atrasadas" value={stats.overdue} icon="⚠️" color="bg-red-500/20 text-red-400" sub={stats.overdue > 0 ? 'Requer atenção' : 'Tudo em dia!'} />
        <StatCard label="Pendentes" value={stats.pending} icon="🕐" color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Em progresso" value={stats.inProgress} icon="🔄" color="bg-amber-500/20 text-amber-400" />
        <StatCard label="Alta prioridade" value={stats.highPriority} icon="🔥" color="bg-orange-500/20 text-orange-400" sub="Não adiadas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white">Próximas tarefas</h2>
          {recentTasks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500">
              🎉 Nenhuma tarefa pendente! Aproveite.
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 hover:bg-white/8 transition-all duration-200">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: task.priority === 'HIGH' ? '#f87171' : task.priority === 'MEDIUM' ? '#fbbf24' : '#34d399' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    <span className="text-xs text-slate-500">{statusLabels[task.status]}</span>
                    {task.dueDate && (
                      <span className={`text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                        📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {task.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: task.category.color + '20', color: task.category.color }}>
                        {task.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Por categoria</h2>
          {byCategory.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-500 text-sm">
              Nenhuma categoria ainda
            </div>
          ) : (
            byCategory.map((cat) => {
              const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0
              return (
                <div key={cat.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-slate-400">{cat.completed}/{cat.total}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pct}% concluído</p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
