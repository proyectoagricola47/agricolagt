import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import LoginPage from '../modules/auth/pages/login'
import Profile from '../modules/users/pages/profile'
import FeedPage from '../modules/posts/pages/feedPage'
import NewPostPage from '../modules/posts/pages/newPost'
import MyPostsPage from '../modules/posts/pages/myPost'
import PostDetail from '../modules/posts/pages/postDetail'
import WeatherPage from '../modules/weathers/pages/weatherPage'
import ArticlesListPage from '../modules/articles/pages/ArticlesListPage'
import ArticleDetailPage from '../modules/articles/pages/ArticleDetailPage'
import ArticleUpsertPage from '../modules/articles/pages/ArticleUpsertPage'
import MainLayout from '../layouts/MainLayout'
import MyCropsPage from '../modules/crops/pages/myCrops'
import CropUpsertPage from '../modules/crops/pages/cropUpsert'
import { useAuth } from '../context/AuthContext'
import AdminUsersPage from '../modules/users/pages/adminUsers'

export default function AppRouter() {
  function PublicLayout() {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    )
  }

  function PrivateLayout() {
    const { user, loading } = useAuth()
    // Esperar a que el estado de auth se hidrate antes de decidir
    if (loading) return (
      <MainLayout>
        <div className="p-6">Cargando…</div>
      </MainLayout>
    )
    if (!user) return <Navigate to="/login" replace />
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    )
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Públicas: artículos como home, clima, feed de posts y detalle de post */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<ArticlesListPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/articles" element={<ArticlesListPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
        </Route>

        {/* Privadas: requieren sesión */}
        <Route element={<PrivateLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/posts" element={<MyPostsPage />} />
          <Route path="/posts/new" element={<NewPostPage />} />
          <Route path="/articles/new" element={<ArticleUpsertPage />} />
          <Route path="/articles/:id/edit" element={<ArticleUpsertPage />} />
          <Route path="/crops" element={<MyCropsPage />} />
          <Route path="/crops/new" element={<CropUpsertPage />} />
          <Route path="/crops/:id/edit" element={<CropUpsertPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
