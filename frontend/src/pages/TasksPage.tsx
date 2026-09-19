import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import type { Task, Category, Tag, CreateTaskInput } from '../lib/api'
import KanbanBoard from '../components/KanbanBoard'

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}
const priorityLabels: Record<string, string> = { HIGH: '🔥 Urgente', MEDIUM: '⚡ Média', LOW: '🌱 Baixa' }

// ─── Task Modal ───────────────────────────────────────────────
function TaskModal({
  open, onClose, onSave, categories, tags, task,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: CreateTaskInput) => Promise<void>
  categories: Category[]
  tags: Tag[]
  task?: Task
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [subtasksList, setSubtasksList] = useState<{ title: string; completed: boolean }[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '')
      setDescription(task?.description || '')
      setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : '')
      setPriority(task?.priority || 'MEDIUM')
      setRecurrence(task?.recurrence || 'NONE')
      setCategoryId(task?.category?.id || '')
      setSelectedTags(task?.tags.map((t) => t.tag.id) || [])
      setSubtasksList(task?.subtasks?.map((st) => ({ title: st.title, completed: st.completed })) || [])
      setNewSubtaskTitle('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, task])

  if (!open) return null

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        priority,
        recurrence,
        categoryId: categoryId || undefined,
        tagIds: selectedTags,
        subtasks: subtasksList,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Título *</label>
            <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?" required
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..." rows={3}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Data limite</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
                <option value="LOW">🌱 Baixa</option>
                <option value="MEDIUM">⚡ Média</option>
                <option value="HIGH">🔥 Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {categories.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoria / Projeto</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div />
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Recorrência</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
                <option value="NONE">Não se repete</option>
                <option value="DAILY">🔁 Todos os dias</option>
                <option value="WEEKLY">📅 Semanalmente</option>
                <option value="MONTHLY">🗓️ Mensalmente</option>
              </select>
            </div>
          </div>

          {/* Subtarefas */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Subtarefas ({subtasksList.filter(s => s.completed).length}/{subtasksList.length})
              </label>
            </div>
            <div className="space-y-2 mb-3">
              {subtasksList.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg border border-white/5">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={(e) => {
                      const updated = [...subtasksList]
                      updated[idx].completed = e.target.checked
                      setSubtasksList(updated)
                    }}
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => {
                      const updated = [...subtasksList]
                      updated[idx].title = e.target.value
                      setSubtasksList(updated)
                    }}
                    className={`flex-1 bg-transparent text-sm text-white focus:outline-none ${st.completed ? 'line-through text-slate-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSubtasksList(subtasksList.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+ Adicionar subtarefa e pressionar Enter"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newSubtaskTitle.trim()) {
                      setSubtasksList([...subtasksList, { title: newSubtaskTitle.trim(), completed: false }])
                      setNewSubtaskTitle('')
                    }
                  }
                }}
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSubtaskTitle.trim()) {
                    setSubtasksList([...subtasksList, { title: newSubtaskTitle.trim(), completed: false }])
                    setNewSubtaskTitle('')
                  }
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-slate-300 rounded-xl border border-white/10"
              >
                Adicionar
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'border-transparent text-white'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit as any} disabled={loading || !title.trim()}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-violet-500/30">
            {loading ? 'Salvando...' : task ? 'Salvar' : 'Criar tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tasks Page ───────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
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
    <div className={`p-6 space-y-6 mx-auto ${viewMode === 'kanban' ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-slate-400 mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} encontrada{tasks.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban</span>
            </button>
          </div>

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
        {viewMode === 'list' && (
          <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="IN_PROGRESS">Em progresso</option>
            <option value="DONE">Concluída</option>
          </select>
        )}
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

      {/* Task Content: List or Kanban */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onUpdateStatus={handleUpdateStatus}
          onEditTask={(task) => {
            setEditingTask(task)
            setModalOpen(true)
          }}
          onDeleteTask={handleDelete}
          onOpenNewTaskModal={(status) => {
            setEditingTask(undefined)
            setPreselectedStatus(status)
            setModalOpen(true)
          }}
        />
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
