import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile } from '../../modules/users/services/userService'

type Props = {
  onLogout?: () => void
}

export default function TopNav({ onLogout }: Props) {
  const { user } = useAuth()
  const [role, setRole] = useState<'admin' | 'editor' | 'user' | undefined>(undefined)
  const navigate = useNavigate()
  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100'
  const linkActive = 'bg-gray-100 text-gray-900'

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

  const isAdmin = role === 'admin'
  const canWriteArticles = role === 'admin' || role === 'editor'

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto px-6 h-14 flex items-center justify-between">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg">
         
          Agrícola
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Inicio</NavLink>
          <NavLink to="/weather" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Clima</NavLink>
          <NavLink to="/feed" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Publicaciones</NavLink>
          <NavLink to="/articles" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Artículos</NavLink>
          {user && (
            <>
              <NavLink to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mi Perfil</NavLink>
              {isAdmin && (
                <NavLink to="/admin/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Admin</NavLink>
              )}
              <NavLink to="/crops" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mis Cultivos</NavLink>
              <NavLink to="/posts" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mis Publicaciones</NavLink>
            </>
          )}
          
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link to="/posts/new" className="hidden lg:inline-flex px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm">Nuevo post</Link>
              {/* Mostrar solo a admin/editor; la página también valida permisos */}
              {canWriteArticles && (
                <Link to="/articles/new" className="hidden lg:inline-flex px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm">Nuevo artículo</Link>
              )}
            </>
          )}
          {user && onLogout ? (
            <button onClick={onLogout} className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm">Cerrar sesión</button>
          ) : (
            <button onClick={() => navigate('/login')} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Iniciar sesión</button>
          )}
        </div>
      </div>
    </header>
  )
}
