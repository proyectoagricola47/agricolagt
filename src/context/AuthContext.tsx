import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../api/supabaseClient'

type AuthContextType = {
  user: any | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(traducirError(error.message))
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) throw new Error(traducirError(error.message))

    // Si el proyecto no exige confirmación por correo, la sesión llega de una vez
    // y creamos la fila del perfil igual que en el flujo de Google.
    if (data.session?.user) {
      await asegurarPerfil(data.session.user.id, email.trim(), name.trim())
      return { needsConfirmation: false }
    }
    return { needsConfirmation: true }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw new Error(traducirError(error.message))
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** Crea la fila en la tabla users si todavía no existe. */
async function asegurarPerfil(id: string, email: string, name: string) {
  try {
    const { data } = await supabase.from('users').select('id').eq('id', id).maybeSingle()
    if (data) return
    await supabase.from('users').insert({ id, email, name, role: 'user' })
  } catch (e) {
    console.error('No se pudo crear el perfil', e)
  }
}

/** Mensajes de Supabase Auth en español, para que el agricultor los entienda. */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.'
  if (m.includes('email not confirmed')) return 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.'
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email')) return 'El correo no tiene un formato válido.'
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento antes de volver a probar.'
  return mensaje
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
