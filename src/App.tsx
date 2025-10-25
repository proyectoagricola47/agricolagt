import './index.css'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './router/AppRouter'
import PWAUpdateBanner from './components/PWAUpdateBanner'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <PWAUpdateBanner />
    </AuthProvider>
  )
}
