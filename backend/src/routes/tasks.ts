import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

// GET /tasks
router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, priority, categoryId, tagId, search } = req.query

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      ...(status ? { status: String(status) as any } : {}),
      ...(priority ? { priority: String(priority) as any } : {}),
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      ...(tagId ? { tags: { some: { tagId: String(tagId) } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: String(search) } },
              { description: { contains: String(search) } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      subtasks: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return res.json(tasks)
})

// POST /tasks
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description, dueDate, priority, recurrence, categoryId, tagIds, subtasks } = req.body

  if (!title) {
    return res.status(400).json({ error: 'O título é obrigatório.' })
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'MEDIUM',
      recurrence: recurrence || 'NONE',
      userId: req.userId!,
      categoryId: categoryId || undefined,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
      subtasks: subtasks?.length
        ? { create: subtasks.map((st: { title: string; completed?: boolean }) => ({ title: st.title, completed: !!st.completed })) }
        : undefined,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      subtasks: true,
    },
  })

  return res.status(201).json(task)
})

// PUT /tasks/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title, description, dueDate, priority, status, recurrence, categoryId, tagIds, subtasks } = req.body

  const existing = await prisma.task.findFirst({
    where: { id, userId: req.userId },
    include: { subtasks: true },
  })
  if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada.' })

  let completedAt =
    status === 'DONE' && existing.status !== 'DONE' ? new Date() : existing.completedAt
  if (status && status !== 'DONE') {
    completedAt = null
  }

  // Handle recurrence when task is marked as DONE:
  // If task is recurrent and completed, automatically calculate next due date if desired
  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      priority,
      status,
      recurrence: recurrence !== undefined ? recurrence : undefined,
      completedAt,
      categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
      tags: tagIds !== undefined
        ? {
            deleteMany: {},
            create: tagIds.map((tagId: string) => ({ tagId })),
          }
        : undefined,
      ...(subtasks !== undefined
        ? {
            subtasks: {
              deleteMany: {},
              create: subtasks.map((st: { title: string; completed?: boolean }) => ({
                title: st.title,
                completed: !!st.completed,
              })),
            },
          }
        : {}),
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      subtasks: { orderBy: { createdAt: 'asc' } },
    },
  })

  return res.json(task)
})

// Subtask toggle: PATCH /tasks/:id/subtasks/:subtaskId
router.patch('/:id/subtasks/:subtaskId', async (req: AuthRequest, res: Response) => {
  const { id, subtaskId } = req.params
  const { completed, title } = req.body

  const task = await prisma.task.findFirst({ where: { id, userId: req.userId } })
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' })

  const subtask = await prisma.subtask.update({
    where: { id: subtaskId, taskId: id },
    data: {
      ...(completed !== undefined ? { completed: Boolean(completed) } : {}),
      ...(title ? { title: String(title) } : {}),
    },
  })

  return res.json(subtask)
})

// Subtask add: POST /tasks/:id/subtasks
router.post('/:id/subtasks', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title } = req.body

  if (!title) return res.status(400).json({ error: 'Título da subtarefa é obrigatório.' })

  const task = await prisma.task.findFirst({ where: { id, userId: req.userId } })
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' })

  const subtask = await prisma.subtask.create({
    data: {
      title,
      taskId: id,
    },
  })

  return res.status(201).json(subtask)
})

// Subtask delete: DELETE /tasks/:id/subtasks/:subtaskId
router.delete('/:id/subtasks/:subtaskId', async (req: AuthRequest, res: Response) => {
  const { id, subtaskId } = req.params

  const task = await prisma.task.findFirst({ where: { id, userId: req.userId } })
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' })

  await prisma.subtask.delete({ where: { id: subtaskId, taskId: id } })
  return res.status(204).send()
})

// DELETE /tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const existing = await prisma.task.findFirst({ where: { id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada.' })

  await prisma.task.delete({ where: { id } })
  return res.status(204).send()
})

export default router

