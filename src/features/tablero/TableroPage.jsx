import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, Sparkles, UserRoundPlus } from 'lucide-react'

function limaDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function TableroPage({ vehicles, services, onGoToReception, user }) {
  const today = limaDateKey(new Date())
  const todaysVehicles = vehicles.filter((vehicle) => limaDateKey(vehicle.receivedAt) === today)
  const inService = vehicles.filter((vehicle) => vehicle.status === 'En proceso' && !vehicle.paid).length
  const pending = todaysVehicles.filter((vehicle) => vehicle.status === 'Pendiente').length
  const todayIncome = vehicles
    .filter((vehicle) => vehicle.paid && limaDateKey(vehicle.paidAt) === today)
    .reduce((sum, vehicle) => sum + Number(
      vehicle.total ?? (services.find((service) => service.name === vehicle.service)?.price ?? 0),
    ), 0)
  const recent = todaysVehicles.slice(0, 4)
  const displayName = user?.fullName?.trim().split(/\s+/)[0] || 'equipo'
  const todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima',
  }).format(new Date())

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">PANEL DE CONTROL · {todayLabel}</p>
          <h2>¡Buen día, {displayName}!</h2>
          <p>Resumen de la actividad registrada hoy en AutoSpa.</p>
        </div>
        <button className="primary-button" type="button" onClick={onGoToReception}>
          <UserRoundPlus size={17} /> Registrar vehículo
        </button>
      </section>

      <section className="stats" aria-label="Resumen del día">
        <article className="stat-card">
          <span className="stat-icon"><CalendarDays size={18} /></span>
          <p>Vehículos recibidos hoy</p><strong>{todaysVehicles.length}</strong><small>{pending} por atender</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Clock3 size={18} /></span>
          <p>En servicio</p><strong>{inService}</strong><small>Órdenes aún en proceso</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><CircleDollarSign size={18} /></span>
          <p>Ingresos de hoy</p><strong>S/ {todayIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong><small>Pagos registrados hoy</small>
        </article>
      </section>

      <section className="appointments">
        <div className="section-heading">
          <div><p className="eyebrow">ACTIVIDAD DE HOY</p><h2>Órdenes recientes</h2></div>
          <button className="text-button" type="button" onClick={onGoToReception}>Ir a recepción <ArrowRight size={15} /></button>
        </div>
        {recent.length === 0 ? <p className="empty-state">Todavía no hay vehículos registrados hoy.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hora</th><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Estado</th></tr></thead>
              <tbody>{recent.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.time}</td><td className="strong-cell">{vehicle.client}</td><td>{vehicle.vehicle}</td><td>{vehicle.service}</td>
                  <td><span className={`status ${vehicle.status === 'En proceso' ? 'in-progress' : vehicle.status === 'Listo' ? 'ready' : vehicle.status === 'Entregado' ? 'delivered' : ''}`}>{vehicle.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="dashboard-note"><Sparkles size={15} /> Las cifras se calculan con los registros y pagos guardados en el servidor.</div>
      </section>
    </>
  )
}
