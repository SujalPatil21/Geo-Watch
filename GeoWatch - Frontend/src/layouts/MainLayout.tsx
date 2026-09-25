import { Outlet } from 'react-router-dom'
import Background from '../components/Background'

function MainLayout() {
  return (
    <div className="min-h-screen">
      <Background />
      <div className="mx-auto w-full max-w-[1600px] px-6 py-10 md:px-12">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout