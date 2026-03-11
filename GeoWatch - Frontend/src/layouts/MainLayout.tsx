import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </div>
    </main>
  )
}

export default MainLayout
