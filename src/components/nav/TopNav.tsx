import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type Props = {
  onLogout?: () => void
}

export default function TopNav({ onLogout }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100'
  const linkActive = 'bg-gray-100 text-gray-900'

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto px-6 h-14 flex items-center justify-between">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg">
          <span className="inline-block w-4 h-4 rounded-full bg-primary-600" aria-hidden />
          Agrícola
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Inicio</NavLink>
          <NavLink to="/weather" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Clima</NavLink>
          {user && (
            <>
              <NavLink to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mi Perfil</NavLink>
              <NavLink to="/crops" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mis Cultivos</NavLink>
              <NavLink to="/posts" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>Mis Publicaciones</NavLink>
            </>
          )}
          
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/posts/new" className="hidden lg:inline-flex px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm">Nuevo post</Link>
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
