import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import Home from '../pages/Home'
import AdminRegister from '../pages/AdminRegister'
import AdminLogin from '../pages/AdminLogin'
import AdminHome from '../pages/AdminHome'
import AdminEvents from '../pages/AdminEvents'
import CreateEvent from '../pages/CreateEvent'
import Dashboard from '../pages/Dashboard'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="register" element={<AdminRegister />} />
          <Route path="login" element={<AdminLogin />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="/admin/dashboard/:eventId" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
