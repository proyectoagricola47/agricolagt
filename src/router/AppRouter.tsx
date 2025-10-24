import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import LoginPage from '../modules/auth/pages/login'
import Profile from '../modules/users/pages/profile'
import FeedPage from '../modules/posts/pages/feedPage'
import NewPostPage from '../modules/posts/pages/newPost'
import MyPostsPage from '../modules/posts/pages/myPost'
import PostDetail from '../modules/posts/pages/postDetail'
import WeatherPage from '../modules/weathers/pages/weatherPage'
import MainLayout from '../layouts/MainLayout'
import MyCropsPage from '../modules/crops/pages/myCrops'
import CropUpsertPage from '../modules/crops/pages/cropUpsert'
import { useAuth } from '../context/AuthContext'

export default function AppRouter() {
  function PublicLayout() {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    )
  }

  function PrivateLayout() {
    const { user } = useAuth()
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
        {/* Públicas: fanpage (feed), clima y detalle de post */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Route>

        {/* Privadas: requieren sesión */}
        <Route element={<PrivateLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/posts" element={<MyPostsPage />} />
          <Route path="/posts/new" element={<NewPostPage />} />
          <Route path="/crops" element={<MyCropsPage />} />
          <Route path="/crops/new" element={<CropUpsertPage />} />
          <Route path="/crops/:id/edit" element={<CropUpsertPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
