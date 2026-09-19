import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Task, Category, Tag, CreateTaskInput } from '../lib/api'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [quickDate, setQuickDate] = useState<string>('')
  const [quickTitle, setQuickTitle] = useState('')

  const loadData = async () => {
    try {
      const [tData, cData, tagData] = await Promise.all([
        api.getTasks(),
        api.getCategories(),
        api.getTags(),
      ])
      setTasks(tData)
      setCategories(cData)
      setTags(tagData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Create calendar cells
  const calendarCells = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day)
  }

  // Group tasks by local YYYY-MM-DD
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (task.dueDate) {
      const dateKey = task.dueDate.slice(0, 10)
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(task)
    }
    return acc
  }, {})

  const tasksWithoutDueDate = tasks.filter((t) => !t.dueDate && t.status !== 'DONE')

  const handleCreateForDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim() || !quickDate) return
    await api.createTask({
      title: quickTitle.trim(),
      dueDate: quickDate,
      priority: 'MEDIUM',
    })
    setQuickTitle('')
    setIsNewModalOpen(false)
    await loadData()
  }

  const toggleTaskStatus = async (task: Task) => {
    const next = task.status === 'DONE' ? 'PENDING' : 'DONE'
    await api.updateTask(task.id, { status: next })
    await loadData()
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask({ ...selectedTask, status: next })
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendário</h1>
          <p className="text-slate-400 mt-0.5">Visão cronológica de entregas e compromissos</p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              title="Mês anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 text-sm font-semibold text-white min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              title="Próximo mês"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (3 Cols on Desktop) */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
            {weekDays.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[105px] rounded-xl bg-white/[0.01]" />
              }

              const formattedMonth = String(month + 1).padStart(2, '0')
              const formattedDay = String(day).padStart(2, '0')
              const cellDateKey = `${year}-${formattedMonth}-${formattedDay}`
              const isToday = cellDateKey === todayStr
              const dayTasks = tasksByDate[cellDateKey] || []

              return (
                <div
                  key={cellDateKey}
                  onClick={() => {
                    setQuickDate(cellDateKey)
                    setIsNewModalOpen(true)
                  }}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group hover:border-violet-500/50 hover:bg-white/[0.04] ${
                    isToday
                      ? 'border-violet-500 bg-violet-950/20'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-violet-600 text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks Preview */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(t)
                        }}
                        className={`text-[11px] px-1.5 py-1 rounded truncate transition-all cursor-pointer flex items-center gap-1 ${
                          t.status === 'DONE'
                            ? 'line-through text-slate-500 bg-white/5'
                            : t.priority === 'HIGH'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-violet-500/20 text-violet-200 border border-violet-500/20'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.category?.color || (t.priority === 'HIGH' ? '#f87171' : '#a855f7') }}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 text-center font-medium mt-1">
                    + Adicionar
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar: Unscheduled & Selected Task Info */}
        <div className="space-y-5">
          {/* Selected Task Details */}
          {selectedTask ? (
            <div className="bg-slate-900/80 border border-violet-500/40 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Detalhes da Tarefa</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ Fechar
                </button>
              </div>

              <div>
                <h4 className={`text-base font-semibold ${selectedTask.status === 'DONE' ? 'line-through text-slate-400' : 'text-white'}`}>
                  {selectedTask.title}
                </h4>
                {selectedTask.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Data:</span>
                  <span className="text-white font-medium">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString('pt-BR')
                      : 'Sem prazo'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-white font-medium">
                    {selectedTask.status === 'DONE' ? 'Concluída' : selectedTask.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Pendente'}
                  </span>
                </div>
                {selectedTask.category && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Categoria:</span>
                    <span className="font-medium" style={{ color: selectedTask.category.color }}>
                      {selectedTask.category.name}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleTaskStatus(selectedTask)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  selectedTask.status === 'DONE'
                    ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedTask.status === 'DONE' ? 'Marcar como Pendente' : 'Concluir Tarefa ✓'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-center text-xs text-slate-500">
              <p>👆 Clique em qualquer tarefa no calendário para ver seus detalhes.</p>
            </div>
          )}

          {/* Unscheduled Tasks */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Sem data definida</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                {tasksWithoutDueDate.length}
              </span>
            </h3>

            {tasksWithoutDueDate.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Todas as tarefas têm data marcada! 👏</p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {tasksWithoutDueDate.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <span className="text-xs text-white truncate max-w-[160px]">{task.title}</span>
                    <span className="text-[10px] text-slate-400">Atribuir data</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsNewModalOpen(false)}
        >
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Nova tarefa para {new Date(quickDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForDate} className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Título da tarefa..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                required
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-violet-500/30"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
