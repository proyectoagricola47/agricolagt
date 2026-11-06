import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { E } from './etiquetas'
import { getMyProfile } from '../../modules/users/services/userService'
import { contarNoLeidas } from '../../modules/notifications/services/notificationService'

type Props = {
  onLogout?: () => void
}

export default function MobileTopbar({ onLogout }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'editor' | 'user' | undefined>(undefined)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let alive = true
    if (!user) { setRole(undefined); return }
    ;(async () => {
      try {
        const me = await getMyProfile()
        if (!alive) return
        setRole(me?.role)
      } catch {
        if (!alive) return
        setRole(undefined)
      }
    })()
    return () => { alive = false }
  }, [user?.id])

  // Contador de notificaciones sin leer, igual que en la barra de escritorio
  const [noLeidas, setNoLeidas] = useState(0)
  useEffect(() => {
    let alive = true
    if (!user) { setNoLeidas(0); return }
    const refrescar = () => {
      contarNoLeidas()
        .then((n) => { if (alive) setNoLeidas(n) })
        .catch(() => { if (alive) setNoLeidas(0) })
    }
    refrescar()
    const t = setInterval(refrescar, 60000)
    return () => { alive = false; clearInterval(t) }
  }, [user?.id])

  const isAdmin = role === 'admin'
  const canWriteArticles = role === 'admin' || role === 'editor'

  return (
    <>
    <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="h-14 px-4 flex items-center justify-between">
        <button onClick={() => setOpen((v) => !v)} className="w-9 h-9 grid place-items-center rounded-md border">
          ☰
        </button>
        <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold">
         
          Agrícola
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/notificaciones"
              title={E.notificaciones}
              className="relative w-9 h-9 rounded-full bg-white shadow border grid place-items-center"
            >
              <span aria-hidden className="text-lg leading-none">🔔</span>
              <span className="sr-only">{E.notificaciones}</span>
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center font-semibold">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </Link>
            <Link to="/profile" className="w-9 h-9 rounded-full bg-white shadow border grid place-items-center">🙂</Link>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className="px-2 py-1 rounded-lg border text-sm">Entrar</button>
        )}
      </div>
    </header>

    {open && (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />
        {/* Panel */}
        <nav className="fixed top-14 inset-x-0 z-50 px-3">
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <NavLink to="/" className="block px-4 py-3 hover:bg-gray-50">{E.inicio}</NavLink>
            <NavLink to="/weather" className="block px-4 py-3 hover:bg-gray-50">{E.clima}</NavLink>
            <NavLink to="/consejos" className="block px-4 py-3 hover:bg-gray-50">{E.consejos}</NavLink>
            <NavLink to="/feed" className="block px-4 py-3 hover:bg-gray-50">{E.publicaciones}</NavLink>
            <NavLink to="/articles" className="block px-4 py-3 hover:bg-gray-50">{E.articulos}</NavLink>
            <NavLink to="/mercado" className="block px-4 py-3 hover:bg-gray-50">{E.mercado}</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className="block px-4 py-3 hover:bg-gray-50">{E.perfil}</NavLink>
                <NavLink to="/notificaciones" className="block px-4 py-3 hover:bg-gray-50">{E.notificaciones}</NavLink>
                {isAdmin && (
                  <NavLink to="/admin/users" className="block px-4 py-3 hover:bg-gray-50">{E.admin}</NavLink>
                )}
                <NavLink to="/crops" className="block px-4 py-3 hover:bg-gray-50">{E.cultivos}</NavLink>
                <NavLink to="/plagas" className="block px-4 py-3 hover:bg-gray-50">{E.plagas}</NavLink>
                <NavLink to="/agua" className="block px-4 py-3 hover:bg-gray-50">{E.agua}</NavLink>
                <NavLink to="/mapa" className="block px-4 py-3 hover:bg-gray-50">{E.mapa}</NavLink>
                <NavLink to="/reportes" className="block px-4 py-3 hover:bg-gray-50">{E.reportes}</NavLink>
                <NavLink to="/asistencia" className="block px-4 py-3 hover:bg-gray-50">{E.asistencia}</NavLink>
                {canWriteArticles && (
                  <NavLink to="/asistencia/bandeja" className="block px-4 py-3 hover:bg-gray-50">{E.bandeja}</NavLink>
                )}
                <NavLink to="/posts" className="block px-4 py-3 hover:bg-gray-50">{E.misPublicaciones}</NavLink>
                {canWriteArticles && (
                  <NavLink to="/articles/new" className="block px-4 py-3 hover:bg-gray-50">Nuevo artículo</NavLink>
                )}
                {onLogout && (
                  <button onClick={() => { setOpen(false); onLogout() }} className="w-full text-left text-red-600 px-4 py-3 hover:bg-red-50">Cerrar sesión</button>
                )}
              </>
            ) : (
              <>
                <NavLink to="/help" className="block px-4 py-3 hover:bg-gray-50">Ayuda</NavLink>
                <button onClick={() => { setOpen(false); navigate('/login') }} className="w-full text-left px-4 py-3 border-t hover:bg-gray-50">Iniciar sesión</button>
              </>
            )}
          </div>
        </nav>
      </>
    )}
    </>
  )
}
