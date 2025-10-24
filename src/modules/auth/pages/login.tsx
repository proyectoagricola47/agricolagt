import { useAuth } from '../../../context/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/hero.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#ecfdf5', 
      }}
    >
      <div className="max-w-md w-full mx-4">
        <div className="p-12 rounded-2xl shadow-xl text-center border border-white/20 bg-white/60 backdrop-blur-lg">
          <img src="/assets/logo.png" alt="Agrícola" className="mx-auto mb-3 h-16" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-700 mb-4">Agrícola</h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">Bienvenido a la PWA de</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 leading-tight">Noticias Agrícolas</h3>
          <button
            onClick={() => signInWithGoogle().catch(console.error)}
            className="mx-auto inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg transition-colors duration-300"
          >
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold">G</span>
            <span>Iniciar sesión con Google</span>
          </button>
          
        </div>
      </div>
    </div>
  )
}
