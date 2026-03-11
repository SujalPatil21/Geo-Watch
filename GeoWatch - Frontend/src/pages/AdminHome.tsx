import { useNavigate } from 'react-router-dom'

function AdminHome() {
  const navigate = useNavigate()
  const handleViewExistingEvent = () => navigate('/admin/events')

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
      <div className="w-full rounded-xl bg-slate-800 p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">GeoWatch</h1>
        <p className="mt-2 text-slate-300">Admin Panel</p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/admin/create-event')}
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            Create New Event
          </button>

          <button
            type="button"
            onClick={handleViewExistingEvent}
            className="w-full rounded-lg border border-slate-500 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400"
          >
            View Existing Event
          </button>
        </div>
      </div>
    </section>
  )
}

export default AdminHome
