import { useMemo, useState } from 'react'
import { CarFront, CheckCircle2, Clock3, Search, Sparkles } from 'lucide-react'

const statusOptions = ['Pendiente', 'En proceso', 'Listo']

export function SeguimientoPage({ vehicles, onUpdateStatus }) {
  const [query, setQuery] = useState('')
  const filteredVehicles = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return vehicles
    return vehicles.filter((vehicle) => [vehicle.client, vehicle.plate, vehicle.vehicle, vehicle.service].some((value) => value.toLowerCase().includes(normalized)))
  }, [vehicles, query])

  const counts = {
    pending: vehicles.filter((vehicle) => vehicle.status === 'Pendiente').length,
    working: vehicles.filter((vehicle) => vehicle.status === 'En proceso').length,
    ready: vehicles.filter((vehicle) => vehicle.status === 'Listo').length,
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">ESTADO DE SERVICIOS</p><h2>Seguimiento</h2><p>Consulta el avance de cada vehículo y actualiza su estado.</p></div>
        <div className="intro-count"><CarFront size={18} /><span><strong>{vehicles.length}</strong> vehículos en el sistema</span></div>
      </section>

      <section className="progress-stats">
        <article><span className="progress-icon pending-icon"><Clock3 size={17} /></span><div><small>Pendientes</small><strong>{counts.pending}</strong></div></article>
        <article><span className="progress-icon working-icon"><Sparkles size={17} /></span><div><small>En proceso</small><strong>{counts.working}</strong></div></article>
        <article><span className="progress-icon ready-icon"><CheckCircle2 size={17} /></span><div><small>Listos para entregar</small><strong>{counts.ready}</strong></div></article>
      </section>

      <section className="panel">
        <div className="section-heading tracking-heading"><div><p className="eyebrow">TALLER</p><h2>Vehículos registrados</h2></div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, placa..." /></label>
        </div>
        {filteredVehicles.length === 0 ? <p className="empty-state">No se encontraron vehículos.</p> : (
          <div className="tracking-list">{filteredVehicles.map((vehicle) => (
            <article className="tracking-card" key={vehicle.id}>
              <div className="tracking-car-icon"><CarFront size={21} /></div>
              <div className="tracking-main"><div className="tracking-title"><h3>{vehicle.vehicle}</h3><span className="plate-tag">{vehicle.plate || 'SIN PLACA'}</span></div><p>{vehicle.client} <span>·</span> {vehicle.service}</p><small>Ingreso {vehicle.time}</small></div>
              <label className="status-control"><span>Estado del servicio</span><select value={vehicle.status} onChange={(event) => onUpdateStatus(vehicle.id, event.target.value)}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
            </article>
          ))}</div>
        )}
      </section>
    </div>
  )
}
