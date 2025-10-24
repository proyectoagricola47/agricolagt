import type { ReactNode } from 'react'
import MobileTopbar from '../components/nav/MobileTopbar'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/nav/TopNav'
import ProfileCompletionModal from '../components/common/ProfileCompletionModal'

type Props = { children: ReactNode }

export default function MainLayout({ children }: Props) {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	async function handleLogout() {
		await logout()
		navigate('/login')
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Top navigations */}
			<MobileTopbar onLogout={user ? handleLogout : undefined} />
			<TopNav onLogout={user ? handleLogout : undefined} />

			{/* Modal global para completar perfil */}
			<ProfileCompletionModal />

			{/* Content area (full width in desktop) */}
			<main className="p-6 max-w-5xl mx-auto md:p-10">{children}</main>
		</div>
	)
}

