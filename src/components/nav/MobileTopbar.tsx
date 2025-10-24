import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

type Props = {
  onLogout?: () => void
}

export default function MobileTopbar({ onLogout }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
    <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="h-14 px-4 flex items-center justify-between">
        <button onClick={() => setOpen((v) => !v)} className="w-9 h-9 grid place-items-center rounded-md border">
          ☰
        </button>
        <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold">
          <span className="inline-block w-4 h-4 rounded-full bg-primary-600" />
          Agrícola
        </Link>
        {user ? (
          <Link to="/profile" className="w-9 h-9 rounded-full bg-white shadow border grid place-items-center">🙂</Link>
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
            <NavLink to="/" className="block px-4 py-3 hover:bg-gray-50">Inicio</NavLink>
            <NavLink to="/weather" className="block px-4 py-3 hover:bg-gray-50">Clima</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className="block px-4 py-3 hover:bg-gray-50">Mi Perfil</NavLink>
                <NavLink to="/crops" className="block px-4 py-3 hover:bg-gray-50">Mis Cultivos</NavLink>
                <NavLink to="/posts" className="block px-4 py-3 hover:bg-gray-50">Mis Publicaciones</NavLink>
                <NavLink to="/help" className="block px-4 py-3 hover:bg-gray-50">Ayuda</NavLink>
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
