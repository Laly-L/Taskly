import { useState } from 'react'
import type { Task, CreateTaskInput } from '../lib/api'

interface KanbanBoardProps {
  tasks: Task[]
  onUpdateStatus: (task: Task, newStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE') => Promise<void>
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => Promise<void>
  onOpenNewTaskModal: (preselectedStatus?: 'PENDING' | 'IN_PROGRESS' | 'DONE') => void
}

const columns: { id: 'PENDING' | 'IN_PROGRESS' | 'DONE'; title: string; icon: string; accent: string; badge: string }[] = [
  { id: 'PENDING', title: 'A Fazer', icon: '📋', accent: 'border-slate-700/60', badge: 'bg-slate-700/30 text-slate-300' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', icon: '⚡', accent: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  { id: 'DONE', title: 'Concluído', icon: '✨', accent: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
]

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const priorityLabels: Record<string, string> = {
  HIGH: '🔥 Urgente',
  MEDIUM: '⚡ Média',
  LOW: '🌱 Baixa',
}

export default function KanbanBoard({
  tasks,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedTaskId(id)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  const handleDrop = async (e: React.DragEvent, colId: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault()
    setDragOverCol(null)
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (!id) return

    const task = tasks.find((t) => t.id === id)
    if (task && task.status !== colId) {
      await onUpdateStatus(task, colId)
    }
    setDraggedTaskId(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        const isTarget = dragOverCol === col.id

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col bg-slate-900/60 border rounded-2xl p-4 min-h-[550px] transition-all duration-200 ${
              isTarget ? 'border-violet-500/80 bg-violet-950/20 shadow-lg shadow-violet-500/10' : col.accent
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{col.icon}</span>
                <h3 className="text-sm font-bold text-white tracking-wide">{col.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenNewTaskModal(col.id)}
                title={`Adicionar tarefa em ${col.title}`}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-violet-600/30 text-slate-400 hover:text-white transition-all text-sm"
              >
                +
              </button>
            </div>

            {/* Tasks Container */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {colTasks.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-slate-500 text-xs text-center p-3">
                  <p>Arraste uma tarefa para cá</p>
                  <button
                    onClick={() => onOpenNewTaskModal(col.id)}
                    className="mt-2 text-violet-400 hover:text-violet-300 underline font-medium"
                  >
                    ou crie uma nova
                  </button>
                </div>
              ) : (
                colTasks.map((task) => {
                  const isOverdue =
                    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
                  const subtasksTotal = task.subtasks?.length || 0
                  const subtasksDone = task.subtasks?.filter((s) => s.completed).length || 0

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`group cursor-grab active:cursor-grabbing bg-white/5 hover:bg-white/8 border rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                        draggedTaskId === task.id ? 'opacity-40 scale-95 border-violet-500' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Priority and Category badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                        {task.category && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]"
                            style={{
                              backgroundColor: task.category.color + '25',
                              color: task.category.color,
                            }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks indicator */}
                      {subtasksTotal > 0 && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {subtasksDone}/{subtasksTotal}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {task.tags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Due date + Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-xs text-slate-400">
                        {task.dueDate ? (
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            {isOverdue ? '⚠️' : '📅'}
                            {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-slate-600">Sem prazo</span>
                        )}

                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {/* Fast status move */}
                          {col.id !== 'PENDING' && (
                            <button
                              onClick={() => onUpdateStatus(task, 'PENDING')}
                              title="Mover para A Fazer"
                              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300"
                            >
                              ← A Fazer
                            </button>
                          )}
                          {col.id === 'PENDING' && (
                            <button
                              onClick={() => onUpdateStatus(task, 'IN_PROGRESS')}
                              title="Mover para Em Andamento"
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-300"
                            >
                              Em Andamento →
                            </button>
                          )}
                          {col.id === 'IN_PROGRESS' && (
                            <button
                              onClick={() => onUpdateStatus(task, 'DONE')}
                              title="Concluir"
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] text-emerald-300"
                            >
                              Concluir ✓
                            </button>
                          )}
                          <button
                            onClick={() => onEditTask(task)}
                            title="Editar"
                            className="p-1 hover:text-violet-400 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Excluir"
                            className="p-1 hover:text-red-400 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
