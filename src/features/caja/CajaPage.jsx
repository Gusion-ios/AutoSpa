import { useMemo, useState } from 'react'
import { Check, CircleDollarSign, Search } from 'lucide-react'

export function CajaPage({ vehicles, services, onMarkPaid }) {
  const [query, setQuery] = useState('')
  const servicePrice = (name) => services.find((service) => service.name === name)?.price ?? 0
  const readyToCharge = vehicles.filter((vehicle) => vehicle.status === 'Listo' && !vehicle.paid)
  const paidVehicles = vehicles.filter((vehicle) => vehicle.paid)
  const total = paidVehicles.reduce((sum, vehicle) => sum + servicePrice(vehicle.service), 0)
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return vehicles.filter((vehicle) => `${vehicle.client} ${vehicle.plate} ${vehicle.vehicle}`.toLowerCase().includes(normalized))
  }, [vehicles, query])

  return (
    <div className="page-stack">
      <section className="page-intro"><div><p className="eyebrow">PAGOS Y CIERRE</p><h2>Caja</h2><p>Revisa los servicios listos, registra pagos y consulta el movimiento del día.</p></div><div className="intro-count"><CircleDollarSign size={18} /><span><strong>S/ {total.toFixed(2)}</strong> cobrado hoy</span></div></section>
      <section className="stats cash-stats"><article className="stat-card"><p>Por cobrar</p><strong>{readyToCharge.length}</strong><small>Servicios listos para entrega</small></article><article className="stat-card"><p>Pagos registrados</p><strong>{paidVehicles.length}</strong><small>Transacciones del día</small></article><article className="stat-card"><p>Total recaudado</p><strong>S/ {total.toFixed(2)}</strong><small>Importe de muestra</small></article></section>
      <section className="panel">
        <div className="section-heading tracking-heading"><div><p className="eyebrow">MOVIMIENTOS</p><h2>Servicios y pagos</h2></div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente o placa..." /></label></div>
        <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Importe</th><th>Pago</th></tr></thead><tbody>{filtered.map((vehicle) => <tr key={vehicle.id}><td className="strong-cell">{vehicle.client}</td><td>{vehicle.plate} · {vehicle.vehicle}</td><td>{vehicle.service}</td><td>S/ {servicePrice(vehicle.service).toFixed(2)}</td><td>{vehicle.paid ? <span className="status ready">Pagado</span> : vehicle.status === 'Listo' ? <button className="small-action" type="button" onClick={() => onMarkPaid(vehicle.id)}><Check size={14} /> Cobrar</button> : <span className="muted-state">En servicio</span>}</td></tr>)}</tbody></table></div>
        {filtered.length === 0 && <p className="empty-state">No se encontraron movimientos.</p>}
        {readyToCharge.length === 0 && <p className="cash-hint">Cuando un vehículo esté marcado como “Listo” en Seguimiento, aparecerá aquí para cobrar.</p>}
      </section>
    </div>
  )
}
