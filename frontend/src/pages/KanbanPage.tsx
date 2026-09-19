import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Task, Category, Tag, CreateTaskInput } from '../lib/api'
import KanbanBoard from '../components/KanbanBoard'
import TaskModal from '../components/TaskModal'

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [preselectedStatus, setPreselectedStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'DONE' | undefined>()

  const fetchTasks = async () => {
    const data = await api.getTasks()
    setTasks(data)
  }

  useEffect(() => {
    Promise.all([fetchTasks(), api.getCategories().then(setCategories), api.getTags().then(setTags)])
      .finally(() => setLoading(false))
  }, [])

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

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar tarefa?')) return
    await api.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quadro Kanban</h1>
          <p className="text-slate-400 mt-0.5">Organize suas tarefas visualmente</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
