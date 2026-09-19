import { useState, useEffect, useRef } from 'react'
import type { Task, Category, Tag, CreateTaskInput } from '../lib/api'

export default function TaskModal({
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
