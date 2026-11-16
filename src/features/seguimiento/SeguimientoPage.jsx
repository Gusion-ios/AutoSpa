import { useMemo, useState } from 'react'
import { CarFront, CheckCircle2, Clock3, QrCode, RefreshCw, Search, Sparkles, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const statusOptions = ['Pendiente', 'En proceso', 'Listo']

export function SeguimientoPage({ vehicles, loading, error, onRetry, onUpdateStatus, onDeliver, canDeliver = false, canUpdateStatus = true }) {
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [qrVehicle, setQrVehicle] = useState(null)

  const filteredVehicles = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return vehicles
    return vehicles.filter((vehicle) =>
      [vehicle.client, vehicle.plate, vehicle.vehicle, vehicle.service]
        .some((value) => (value ?? '').toLowerCase().includes(normalized)),
    )
  }, [vehicles, query])

  const counts = {
    pending: vehicles.filter((vehicle) => vehicle.status === 'Pendiente').length,
    working: vehicles.filter((vehicle) => vehicle.status === 'En proceso').length,
    ready: vehicles.filter((vehicle) => vehicle.status === 'Listo').length,
    delivered: vehicles.filter((vehicle) => vehicle.status === 'Entregado').length,
  }

  async function changeStatus(id, status) {
    setUpdatingId(id)
    setActionError('')
    try {
      await onUpdateStatus(id, status)
    } catch (requestError) {
      setActionError(requestError.message || 'No se pudo actualizar el estado.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function deliver(id) {
    setUpdatingId(id)
    setActionError('')
    try {
      await onDeliver(id)
    } catch (requestError) {
      setActionError(requestError.message || 'No se pudo registrar la entrega.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">ESTADO DE SERVICIOS</p><h2>Seguimiento</h2><p>Consulta las visitas, sus pagos y el estado de entrega.</p></div>
        <div className="intro-count"><CarFront size={18} /><span><strong>{vehicles.length}</strong> vehículos</span></div>
      </section>

      {error && <div className="api-error" role="alert">{error}{' '}<button className="text-button" type="button" onClick={onRetry}><RefreshCw size={14} /> Reintentar</button></div>}
      {actionError && <p className="api-error" role="alert">{actionError}</p>}

      <section className="progress-stats">
        <article><span className="progress-icon pending-icon"><Clock3 size={17} /></span><div><small>Pendientes</small><strong>{counts.pending}</strong></div></article>
        <article><span className="progress-icon working-icon"><Sparkles size={17} /></span><div><small>En proceso</small><strong>{counts.working}</strong></div></article>
        <article><span className="progress-icon ready-icon"><CheckCircle2 size={17} /></span><div><small>Listos para entregar</small><strong>{counts.ready}</strong></div></article>
        <article><span className="progress-icon delivered-icon"><CheckCircle2 size={17} /></span><div><small>Entregados</small><strong>{counts.delivered}</strong></div></article>
      </section>

      <section className="panel">
        <div className="section-heading tracking-heading">
          <div><p className="eyebrow">TALLER</p><h2>Vehículos registrados</h2></div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, placa..." /></label>
        </div>
        {loading ? <p className="empty-state">Cargando vehículos…</p> : filteredVehicles.length === 0 ? <p className="empty-state">No se encontraron vehículos.</p> : (
          <div className="tracking-list">
            {filteredVehicles.map((vehicle) => (
              <article className="tracking-card" key={vehicle.id}>
                <div className="tracking-car-icon"><CarFront size={21} /></div>
                <div className="tracking-main">
                  <div className="tracking-title"><h3>{vehicle.vehicle}</h3><span className="plate-tag">{vehicle.plate || 'SIN PLACA'}</span></div>
                  <p>{vehicle.client} <span>·</span> {vehicle.service}</p>
                  <small>Ingreso {vehicle.time}</small>
                </div>
                <div className="status-control">
                  <label htmlFor={`status-${vehicle.id}`}>Estado de la visita</label>
                  {vehicle.status === 'Entregado' ? (
                    <span className="status delivered">Entregado · Pagado</span>
                  ) : (
                    <select id={`status-${vehicle.id}`} value={vehicle.status} disabled={!canUpdateStatus || updatingId === vehicle.id || vehicle.paid} onChange={(event) => changeStatus(vehicle.id, event.target.value)}>
                      {statusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  )}
                  {vehicle.paid && vehicle.status === 'Listo' && canDeliver && (
                    <button className="small-action deliver-action" type="button" disabled={updatingId === vehicle.id} onClick={() => deliver(vehicle.id)}>
                      <CheckCircle2 size={14} /> {updatingId === vehicle.id ? 'Guardando…' : 'Marcar entregado'}
                    </button>
                  )}
                  {vehicle.publicCode && <button className="text-button order-qr-button" type="button" onClick={() => setQrVehicle(vehicle)}><QrCode size={14} /> Mostrar QR</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {qrVehicle && (
        <div className="qr-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQrVehicle(null) }}>
          <section className="qr-dialog" role="dialog" aria-modal="true" aria-labelledby="order-qr-title">
            <button className="qr-dialog-close" type="button" aria-label="Cerrar" onClick={() => setQrVehicle(null)}><X size={18} /></button>
            <span className="panel-icon"><QrCode size={19} /></span>
            <p className="eyebrow">SEGUIMIENTO PÚBLICO</p>
            <h2 id="order-qr-title">QR de esta orden</h2>
            <p>El cliente puede escanearlo para consultar el estado y los servicios, sin iniciar sesión.</p>
            {['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) && (
              <p className="qr-localhost-warning" role="alert">Este QR usa localhost y solo funciona en esta PC. Para compartirlo, abre AutoSpa con la dirección de red de esta PC y genera el QR otra vez.</p>
            )}
            <div className="order-qr-code"><QRCodeSVG value={`${window.location.origin}/seguimiento/${qrVehicle.publicCode}`} size={220} level="M" includeMargin /></div>
            <a className="text-button" href={`/seguimiento/${qrVehicle.publicCode}`} target="_blank" rel="noreferrer">Abrir vista pública</a>
          </section>
        </div>
      )}
    </div>
  )
}
