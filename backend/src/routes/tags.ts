import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

// GET /tags
router.get('/', async (req: AuthRequest, res: Response) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: 'asc' },
  })
  return res.json(tags)
})

// POST /tags
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, color } = req.body
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' })

  const tag = await prisma.tag.create({
    data: { name, color, userId: req.userId! },
  })
  return res.status(201).json(tag)
})

// DELETE /tags/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const existing = await prisma.tag.findFirst({ where: { id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Tag não encontrada.' })

  await prisma.tag.delete({ where: { id } })
  return res.status(204).send()
})

export default router
