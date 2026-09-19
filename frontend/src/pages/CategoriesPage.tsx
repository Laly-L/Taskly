import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Category, Tag } from '../lib/api'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getCategories().then(setCategories), api.getTags().then(setTags)])
      .finally(() => setLoading(false))
  }, [])

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const cat = await api.createCategory({ name: newCatName.trim(), color: newCatColor })
    setCategories((prev) => [...prev, cat])
    setNewCatName('')
  }

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    const tag = await api.createTag({ name: newTagName.trim(), color: newTagColor })
    setTags((prev) => [...prev, tag])
    setNewTagName('')
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Deletar categoria? As tarefas não serão deletadas.')) return
    await api.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const deleteTag = async (id: string) => {
    if (!confirm('Deletar tag?')) return
    await api.deleteTag(id)
    setTags((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Categorias & Tags</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">📁 Categorias</h2>

          <form onSubmit={addCategory} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nome da categoria..." required
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all" />
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewCatColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newCatColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <button type="submit"
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all">
              + Adicionar categoria
            </button>
          </form>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nenhuma categoria ainda</p>
            ) : categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-white text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-slate-500">{(cat as any)._count?.tasks || 0} tarefas</span>
                <button onClick={() => deleteCategory(cat.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">🏷️ Tags</h2>

          <form onSubmit={addTag} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nome da tag..." required
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all" />
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewTagColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newTagColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <button type="submit"
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all">
              + Adicionar tag
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 w-full text-center">Nenhuma tag ainda</p>
            ) : tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}>
                #{tag.name}
                <span className="text-xs opacity-60">({(tag as any)._count?.tasks || 0})</span>
                <button onClick={() => deleteTag(tag.id)}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
