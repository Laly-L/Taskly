import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Task, CreateTaskInput } from '../lib/api'

export default function MyDayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)

  const loadTasks = async () => {
    try {
      const allTasks = await api.getTasks()
      setTasks(allTasks)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // Separate tasks into Today, Overdue, and Completed Today
  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    return t.dueDate.slice(0, 10) === todayStr && t.status !== 'DONE'
  })

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    return t.dueDate.slice(0, 10) < todayStr && t.status !== 'DONE'
  })

  const completedTodayTasks = tasks.filter((t) => {
    if (t.status !== 'DONE') return false
    if (t.completedAt) return t.completedAt.slice(0, 10) === todayStr
    if (t.dueDate) return t.dueDate.slice(0, 10) === todayStr
    return false
  })

  const totalActionable = todayTasks.length + overdueTasks.length + completedTodayTasks.length
  const progressPercent =
    totalActionable > 0 ? Math.round((completedTodayTasks.length / totalActionable) * 100) : 0

  const handleToggleStatus = async (task: Task) => {
    const next = task.status === 'DONE' ? 'PENDING' : 'DONE'
    await api.updateTask(task.id, { status: next })
    await loadTasks()
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setCreating(true)
    try {
      await api.createTask({
        title: newTaskTitle.trim(),
        dueDate: todayStr,
        priority: 'MEDIUM',
      })
      setNewTaskTitle('')
      await loadTasks()
    } finally {
      setCreating(false)
    }
  }

  const priorityColors: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">☀️</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Meu Dia</h1>
            </div>
            <p className="text-violet-200/70 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 min-w-[220px]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-white">Progresso de Hoje</span>
              <span className="text-violet-300 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {completedTodayTasks.length} de {totalActionable} concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add For Today */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="+ Adicionar tarefa para hoje e pressionar Enter..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-lg"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !newTaskTitle.trim()}
          className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition-all shadow-md shadow-violet-500/20"
        >
          Adicionar
        </button>
      </form>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-400">⚠️ Tarefas Atrasadas</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold">
              {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-red-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white">{task.title}</h4>
                    <p className="text-xs text-red-300/80 mt-0.5">
                      Venceu em {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                    {task.priority === 'HIGH' ? '🔥 Urgente' : task.priority === 'MEDIUM' ? '⚡ Média' : '🌱 Baixa'}
                  </span>
                  <button
                    onClick={async () => {
                      await api.updateTask(task.id, { dueDate: todayStr })
                      await loadTasks()
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    Mover p/ Hoje
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled For Today */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Tarefas Programadas para Hoje</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
            {todayTasks.length}
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Nenhuma tarefa pendente para hoje. Que tal adicionar uma acima? ✨
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 hover:bg-white/8 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-violet-500 flex items-center justify-center transition-all"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                    {task.priority === 'HIGH' ? '🔥 Urgente' : task.priority === 'MEDIUM' ? '⚡ Média' : '🌱 Baixa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Today */}
      {completedTodayTasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <span>Concluídas Hoje</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {completedTodayTasks.length}
            </span>
          </h3>
          <div className="space-y-2">
            {completedTodayTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-4 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center text-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <h4 className="text-sm font-medium line-through text-slate-400">{task.title}</h4>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">Concluído ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
