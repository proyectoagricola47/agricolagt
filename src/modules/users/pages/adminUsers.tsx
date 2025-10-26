import { useEffect, useMemo, useState } from 'react'
import { adminListUsers, adminSetUserRole, getMyProfile } from '../services/userService'
import type { UserProfile } from '../../../model/user'

export default function AdminUsersPage() {
  const [me, setMe] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [items, setItems] = useState<UserProfile[]>([])
  const [query, setQuery] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const isAdmin = useMemo(() => me?.role === 'admin', [me?.role])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const prof = await getMyProfile()
        if (!alive) return
        setMe(prof)
        if (prof?.role === 'admin') {
          const users = await adminListUsers()
          if (alive) setItems(users)
        }
      } catch (e: any) {
        console.error(e)
       
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function reload() {
    try {
      const users = await adminListUsers(query)
      setItems(users)
    } catch (e) { console.error(e) }
  }

  async function changeRole(userId: string, role: 'admin' | 'editor' | 'user') {
    if (!isAdmin) return
    if (me?.id === userId && role !== 'admin') {
      const ok = confirm('Estás quitándote el rol de administrador. ¿Continuar? Podrías perder acceso a esta sección.')
      if (!ok) return
    }
    try {
      setSavingId(userId)
      const updated = await adminSetUserRole(userId, role)
      setItems(prev => prev.map(u => u.id === userId ? updated : u))
    } catch (e: any) {
      alert(e?.message || 'No se pudo actualizar el rol (verifica permisos)')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="rounded-xl border p-4 bg-white">Cargando…</div>
  if (!isAdmin) return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4">
      Solo los administradores pueden gestionar roles.
    </div>
  )

  return (
    <div className="pb-16">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Administrar usuarios</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && reload()}
          placeholder="Buscar por nombre o email"
          className="h-10 w-full sm:w-80 rounded-lg border border-gray-300 px-3 text-sm"
        />
        <button onClick={reload} className="h-10 px-3 rounded-lg border bg-white hover:bg-gray-50 text-sm">Buscar</button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Usuario</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-gray-500 border">👤</div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{u.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500">{u.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-700">{u.email || '—'}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${u.role === 'admin' ? 'bg-red-50 border-red-200 text-red-700' : u.role === 'editor' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{u.role || 'user'}</span>
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <select
                    value={u.role || 'user'}
                    onChange={(e) => changeRole(u.id, e.target.value as any)}
                    disabled={savingId === u.id}
                    className="h-9 rounded-lg border border-gray-300 px-2 text-sm bg-white"
                  >
                    <option value="user">user</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
