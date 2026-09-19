const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

function getToken() {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(err.error || 'Erro na requisição')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Tasks
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<Task[]>(`/tasks${qs}`)
  },
  createTask: (data: CreateTaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<CreateTaskInput & { status: string }>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Subtasks
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) =>
    request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  addSubtask: (taskId: string, title: string) =>
    request<Subtask>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  deleteSubtask: (taskId: string, subtaskId: string) =>
    request<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: { name: string; color?: string; icon?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: () => request<Tag[]>('/tags'),
  createTag: (data: { name: string; color?: string }) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  deleteTag: (id: string) =>
    request<void>(`/tags/${id}`, { method: 'DELETE' }),
}

// Types
export interface User {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  _count?: { tasks: number }
}

export interface Tag {
  id: string
  name: string
  color: string
  _count?: { tasks: number }
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  taskId: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  completedAt?: string
  createdAt: string
  category?: Category
  tags: { tag: Tag }[]
  subtasks?: Subtask[]
}

export interface CreateTaskInput {
  title: string
  description?: string
  dueDate?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  categoryId?: string
  tagIds?: string[]
  subtasks?: { title: string; completed?: boolean }[]
}

export interface DashboardData {
  stats: {
    total: number
    completedToday: number
    overdue: number
    pending: number
    inProgress: number
    highPriority: number
  }
  byCategory: {
    id: string
    name: string
    color: string
    icon: string
    total: number
    completed: number
  }[]
  byPriority: { priority: string; _count: number }[]
  recentTasks: Task[]
}

