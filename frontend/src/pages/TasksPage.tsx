import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import type { Task, Category, Tag, CreateTaskInput } from '../lib/api'
import TaskModal from '../components/TaskModal'

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}
const priorityLabels: Record<string, string> = { HIGH: '🔥 Urgente', MEDIUM: '⚡ Média', LOW: '🌱 Baixa' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [preselectedStatus, setPreselectedStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'DONE' | undefined>()
  const [filter, setFilter] = useState({ status: '', priority: '', categoryId: '', search: '' })

  const fetchTasks = async () => {
    const params: Record<string, string> = {}
    if (filter.status) params.status = filter.status
    if (filter.priority) params.priority = filter.priority
    if (filter.categoryId) params.categoryId = filter.categoryId
    if (filter.search) params.search = filter.search
    const data = await api.getTasks(Object.keys(params).length ? params : undefined)
    setTasks(data)
  }

  useEffect(() => {
    Promise.all([fetchTasks(), api.getCategories().then(setCategories), api.getTags().then(setTags)])
      .finally(() => setLoading(false))
  }, [filter])

  const handleCreate = async (data: CreateTaskInput) => {
    if (editingTask) {
      await api.updateTask(editingTask.id, data)
    } else {
      await api.createTask({
        ...data,
        status: preselectedStatus || data.status || 'PENDING',
      })
    }
    await fetchTasks()
    setEditingTask(undefined)
    setPreselectedStatus(undefined)
  }

  const handleUpdateStatus = async (task: Task, newStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    await api.updateTask(task.id, { status: newStatus })
    await fetchTasks()
  }

  const toggleStatus = async (task: Task) => {
    const next = task.status === 'DONE' ? 'PENDING' : task.status === 'PENDING' ? 'IN_PROGRESS' : 'DONE'
    await api.updateTask(task.id, { status: next })
    await fetchTasks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar tarefa?')) return
    await api.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className={`p-6 space-y-6 mx-auto max-w-4xl`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-slate-400 mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} encontrada{tasks.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-3">

          <button onClick={() => { setEditingTask(undefined); setPreselectedStatus(undefined); setModalOpen(true) }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-violet-500/30 hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova tarefa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          placeholder="🔍 Buscar tarefas..."
          className="flex-1 min-w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
        />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="DONE">Concluída</option>
        </select>
        <select value={filter.priority} onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
          <option value="">Todas prioridades</option>
          <option value="HIGH">🔥 Urgente</option>
          <option value="MEDIUM">⚡ Média</option>
          <option value="LOW">🌱 Baixa</option>
        </select>
        {categories.length > 0 && (
          <select value={filter.categoryId} onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
            <option value="">Todas categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Task Content: List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (

        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-lg font-medium text-slate-400">Nenhuma tarefa encontrada</p>
          <p className="text-sm mt-1">Crie sua primeira tarefa clicando no botão acima</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
            return (
              <div key={task.id}
                className={`group bg-white/5 border rounded-xl p-4 flex items-start gap-4 hover:bg-white/8 transition-all duration-200 ${
                  isOverdue ? 'border-red-500/30' : 'border-white/10'
                }`}>
                {/* Status toggle */}
                <button onClick={() => toggleStatus(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    task.status === 'DONE'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : task.status === 'IN_PROGRESS'
                      ? 'border-amber-500 bg-amber-500/20'
                      : 'border-slate-600 hover:border-violet-500'
                  }`}>
                  {task.status === 'DONE' && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {task.status === 'IN_PROGRESS' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                        {isOverdue ? '⚠️ ' : '📅 '}
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {task.recurrence && task.recurrence !== 'NONE' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {task.recurrence === 'DAILY' ? '🔁 Diária' : task.recurrence === 'WEEKLY' ? '📅 Semanal' : '🗓️ Mensal'}
                      </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        ☑️ {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subitens
                      </span>
                    )}
                    {task.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: task.category.color + '20', color: task.category.color }}>
                        {task.category.name}
                      </span>
                    )}
                    {task.tags.map(({ tag }) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingTask(task); setModalOpen(true) }}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(task.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(undefined) }}
        onSave={handleCreate}
        categories={categories}
        tags={tags}
        task={editingTask}
      />
    </div>
  )
}
