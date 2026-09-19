import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [defaultView, setDefaultView] = useState<'list' | 'kanban'>(
    (localStorage.getItem('taskly_default_view') as any) || 'list'
  )
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    localStorage.getItem('taskly_sound') !== 'false'
  )
  const [message, setMessage] = useState('')

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de área de trabalho.')
      return
    }
    const res = await Notification.requestPermission()
    setNotificationPermission(res)
    if (res === 'granted') {
      new Notification('Taskly', {
        body: 'Notificações ativadas com sucesso para suas tarefas!',
        icon: '/taskly-icon.svg',
      })
    }
  }

  const handleSavePreferences = () => {
    localStorage.setItem('taskly_default_view', defaultView)
    localStorage.setItem('taskly_sound', String(soundEnabled))
    setMessage('Preferências salvas com sucesso!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3333/tasks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const tasks = await res.json()
      const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taskly-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erro ao exportar dados de tarefas.')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 mt-0.5">Gerencie seu perfil, preferências e privacidade</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          {message}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>👤 Perfil da Conta</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-xs text-slate-400">Nome de usuário</p>
            <p className="text-sm font-semibold text-white mt-1">{user?.name}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-xs text-slate-400">Email cadastrado</p>
            <p className="text-sm font-semibold text-white mt-1">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>⚙️ Preferências de Uso</span>
        </h2>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <p className="font-medium text-white">Visualização padrão de tarefas</p>
              <p className="text-xs text-slate-400">Escolha como a tela de tarefas deve abrir por padrão</p>
            </div>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value as any)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="list">Lista estruturada</option>
              <option value="kanban">Quadro Kanban</option>
            </select>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <p className="font-medium text-white">Notificações no Navegador</p>
              <p className="text-xs text-slate-400">Receba avisos de tarefas a vencer mesmo fora da aba</p>
            </div>
            <button
              onClick={handleRequestNotifications}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-violet-600 hover:bg-violet-500 text-white border-transparent'
              }`}
            >
              {notificationPermission === 'granted' ? '✓ Ativadas' : 'Ativar Notificações'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Efeitos sonoros sutis</p>
              <p className="text-xs text-slate-400">Feedback acústico ao concluir tarefas</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-violet-500/30"
        >
          Salvar Preferências
        </button>
      </div>

      {/* Data Backup & Export */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>💾 Dados e Exportação</span>
        </h2>
        <p className="text-xs text-slate-400">
          Você tem total controle sobre seus dados. Exporte suas tarefas e histórico a qualquer momento em formato JSON.
        </p>
        <button
          onClick={handleExportData}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          <span>📥 Baixar Backup JSON (.json)</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-red-400">Encerrar Sessão</h2>
        <p className="text-xs text-slate-400">
          Você será desconectado deste dispositivo.
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-red-500/20"
        >
          Desconectar da Conta
        </button>
      </div>
    </div>
  )
}
