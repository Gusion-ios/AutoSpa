import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, Sparkles, UserRoundPlus } from 'lucide-react'

export function TableroPage({ vehicles, services, onGoToReception }) {
  const inService = vehicles.filter((vehicle) => vehicle.status === 'En proceso').length
  const pending = vehicles.filter((vehicle) => vehicle.status === 'Pendiente').length
  const todayIncome = vehicles.filter((vehicle) => vehicle.paid).reduce((sum, vehicle) => sum + (services.find((service) => service.name === vehicle.service)?.price ?? 0), 0)
  const upcoming = vehicles.slice(0, 4)

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">PANEL DE CONTROL</p>
          <h2>¡Buen día, Franco!</h2>
          <p>Este es el resumen de actividad de AutoSpa para hoy.</p>
        </div>
        <button className="primary-button" type="button" onClick={onGoToReception}>
          <UserRoundPlus size={17} /> Registrar vehículo
        </button>
      </section>

      <section className="stats" aria-label="Resumen del día">
        <article className="stat-card">
          <span className="stat-icon"><CalendarDays size={18} /></span>
          <p>Citas de hoy</p><strong>{vehicles.length}</strong><small>{pending} por atender</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Clock3 size={18} /></span>
          <p>En servicio</p><strong>{inService}</strong><small>Vehículos en el local</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><CircleDollarSign size={18} /></span>
          <p>Ingresos del día</p><strong>S/ {todayIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong><small>Estimado local</small>
        </article>
      </section>

      <section className="appointments">
        <div className="section-heading">
          <div><p className="eyebrow">AGENDA</p><h2>Próximos vehículos</h2></div>
          <button className="text-button" type="button" onClick={onGoToReception}>Ir a recepción <ArrowRight size={15} /></button>
        </div>
        {upcoming.length === 0 ? <p className="empty-state">Todavía no hay vehículos registrados.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hora</th><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Estado</th></tr></thead>
              <tbody>{upcoming.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.time}</td><td className="strong-cell">{vehicle.client}</td><td>{vehicle.vehicle}</td><td>{vehicle.service}</td>
                  <td><span className={`status ${vehicle.status === 'En proceso' ? 'in-progress' : vehicle.status === 'Listo' ? 'ready' : ''}`}>{vehicle.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="dashboard-note"><Sparkles size={15} /> Los datos son de ejemplo y se guardan solo mientras la página está abierta.</div>
      </section>
    </>
  )
}

