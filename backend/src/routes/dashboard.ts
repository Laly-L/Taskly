import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

// GET /dashboard
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

  const [
    total,
    completedToday,
    overdue,
    pending,
    inProgress,
    highPriority,
    byCategory,
    byPriority,
    recentTasks,
  ] = await Promise.all([
    // Total de tarefas
    prisma.task.count({ where: { userId } }),

    // Concluídas hoje
    prisma.task.count({
      where: {
        userId,
        status: 'DONE',
        completedAt: { gte: startOfToday, lt: endOfToday },
      },
    }),

    // Atrasadas (dueDate no passado e não concluídas)
    prisma.task.count({
      where: {
        userId,
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
    }),

    // Pendentes
    prisma.task.count({ where: { userId, status: 'PENDING' } }),

    // Em progresso
    prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),

    // Alta prioridade e não concluídas
    prisma.task.count({ where: { userId, priority: 'HIGH', status: { not: 'DONE' } } }),

    // Tarefas por categoria
    prisma.category.findMany({
      where: { userId },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: 'DONE' }, select: { id: true } },
      },
    }),

    // Distribuição por prioridade
    prisma.task.groupBy({
      by: ['priority'],
      where: { userId, status: { not: 'DONE' } },
      _count: true,
    }),

    // Tarefas mais recentes
    prisma.task.findMany({
      where: { userId, status: { not: 'DONE' } },
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 5,
    }),
  ])

  return res.json({
    stats: {
      total,
      completedToday,
      overdue,
      pending,
      inProgress,
      highPriority,
    },
    byCategory: byCategory.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      total: c._count.tasks,
      completed: c.tasks.length,
    })),
    byPriority,
    recentTasks,
  })
})

export default router
