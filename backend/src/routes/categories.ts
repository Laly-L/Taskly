import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

// GET /categories
router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: 'asc' },
  })
  return res.json(categories)
})

// POST /categories
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, color, icon } = req.body
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' })

  const category = await prisma.category.create({
    data: { name, color, icon, userId: req.userId! },
  })
  return res.status(201).json(category)
})

// PUT /categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { name, color, icon } = req.body

  const existing = await prisma.category.findFirst({ where: { id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Categoria não encontrada.' })

  const category = await prisma.category.update({ where: { id }, data: { name, color, icon } })
  return res.json(category)
})

// DELETE /categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const existing = await prisma.category.findFirst({ where: { id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Categoria não encontrada.' })

  await prisma.category.delete({ where: { id } })
  return res.status(204).send()
})

export default router
