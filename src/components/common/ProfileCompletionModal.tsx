import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../api/supabaseClient'
import { useAuth } from '../../context/AuthContext'

// Recordatorio cada N minutos
const NUDGE_INTERVAL_MINUTES = 360 // 6 horas
const STORAGE_KEY = 'profile_nudge_last_shown'

export default function ProfileCompletionModal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)

  const lastShown = useMemo(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Date(raw) : null
  }, [])

  const shouldShowByTime = useMemo(() => {
    if (!lastShown) return true
    const diffMin = (Date.now() - lastShown.getTime()) / 60000
    return diffMin >= NUDGE_INTERVAL_MINUTES
  }, [lastShown])

  useEffect(() => {
    if (!user) return
    let active = true
    async function fetchProfile() {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, location, profile_complete')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return
      if (!error) {
        setProfile(data)
        const complete = !!(data?.profile_complete || (data?.avatar_url && data?.location))
        setOpen(!complete && shouldShowByTime)
      }
      setLoading(false)
    }
    fetchProfile()
    // re-check when auth user changes
  }, [user, shouldShowByTime])

  if (!user || loading || !open) return null

  function handleLater() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setOpen(false)
  }

  function handleGoProfile() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setOpen(false)
    navigate('/profile')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleLater} />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 grid place-items-center rounded-full bg-primary-50 text-primary-700 border border-primary-100">⚙️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Completa tu perfil</h3>
            <p className="text-sm text-gray-600">Agrega tu avatar y ubicación para mejorar tus publicaciones y recomendaciones.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <div className="text-gray-500">Avatar</div>
            <div className="font-medium text-gray-900">{profile?.avatar_url ? 'Listo' : 'Falta agregar'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <div className="text-gray-500">Ubicación</div>
            <div className="font-medium text-gray-900">{profile?.location ? 'Listo' : 'Falta agregar'}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={handleLater} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Después</button>
          <button onClick={handleGoProfile} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm">Completar ahora</button>
        </div>
      </div>
    </div>
  )
}
