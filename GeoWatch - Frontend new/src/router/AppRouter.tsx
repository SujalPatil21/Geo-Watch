import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import Home from '../pages/Home'
import Auth from '../pages/Auth'
import AdminHome from '../pages/AdminHome'
import AdminEvents from '../pages/AdminEvents'
import CreateEvent from '../pages/CreateEvent'
import Dashboard from '../pages/Dashboard'
import Settings from '../pages/Settings'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Auth key="signin" mode="signin" />} />
          <Route path="/signup" element={<Auth key="signup" mode="signup" />} />
          <Route path="/admin/login" element={<Auth key="admin-login" mode="signin" />} />
          <Route path="/admin/register" element={<Auth key="admin-register" mode="signup" />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="home" element={<AdminHome />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="dashboard/:eventId" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter