import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)

    if (!name.trim()) return setError('Escribe tu nombre completo.')
    if (!email.trim()) return setError('Escribe tu correo electrónico.')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (password !== confirmacion) return setError('Las contraseñas no coinciden.')

    setCargando(true)
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password, name)
      if (needsConfirmation) {
        setAviso('Cuenta creada. Revisa tu correo y confirma tu cuenta para poder entrar.')
      } else {
        navigate('/profile')
      }
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo crear la cuenta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10"
      style={{
        backgroundImage: "url('/assets/hero.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#ecfdf5',
      }}
    >
      <div className="max-w-md w-full mx-4">
        <div className="p-8 sm:p-10 rounded-2xl shadow-xl text-center border border-white/20 bg-white/70 backdrop-blur-lg">
          <h1 className="text-3xl font-extrabold text-primary-700 mb-2">Crear cuenta</h1>
          <h2 className="text-sm text-gray-700 mb-6">Regístrate para llevar el control de tus cultivos</h2>

          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium mb-1">Nombre completo</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-1">Correo electrónico</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium mb-1">Repetir contraseña</label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {aviso && (
              <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">{aviso}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full px-6 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg transition-colors disabled:opacity-60"
            >
              {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-gray-300" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">o</span>
            <span className="h-px flex-1 bg-gray-300" />
          </div>

          <button
            onClick={() => signInWithGoogle().catch(console.error)}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">G</span>
            <span>Continuar con Google</span>
          </button>

          <p className="mt-6 text-sm text-gray-700">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-700 hover:text-primary-800 font-medium underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
