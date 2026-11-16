import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock3, RefreshCw, Sparkles } from 'lucide-react'
import { apiRequest } from '../../api/client.js'

const progressSteps = [
  { value: 'Pendiente', label: 'Recibido' },
  { value: 'En proceso', label: 'En proceso' },
  { value: 'Listo', label: 'Listo' },
  { value: 'Entregado', label: 'Entregado' },
]

export function PublicTrackingPage({ publicCode }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const result = await apiRequest(`/public/orders/${encodeURIComponent(publicCode)}`)
      setOrder(result)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo consultar el estado de la orden.')
    } finally {
      setLoading(false)
    }
  }, [publicCode])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const currentStep = progressSteps.findIndex((step) => step.value === order?.status)

  return (
    <main className="public-tracking-page">
      <header className="public-tracking-brand"><span className="brand-mark">A</span><span>AutoSpa<small>SEGUIMIENTO DE ORDEN</small></span></header>
      <section className="public-tracking-card">
        <p className="eyebrow">ESTADO DEL SERVICIO</p>
        <h1>Seguimiento de tu vehículo</h1>
        <p className="public-tracking-subtitle">Esta página se actualiza automáticamente cada 15 segundos.</p>
        {loading && !order ? <p className="empty-state">Consultando el estado…</p> : error ? (
          <div className="api-error" role="alert">{error}{' '}<button className="text-button" type="button" onClick={refresh}><RefreshCw size={14} /> Reintentar</button></div>
        ) : order && (
          <>
            <div className="public-order-summary">
              <div><small>Número de orden</small><strong>{order.publicCode.slice(0, 8).toUpperCase()}</strong></div>
              <div><small>Ingreso</small><strong>{new Date(order.receivedAt).toLocaleString('es-PE')}</strong></div>
            </div>
            <div className="public-current-status"><span className="panel-icon"><Clock3 size={19} /></span><div><small>Estado actual</small><strong>{progressSteps[currentStep]?.label ?? order.status}</strong></div></div>
            <ol className="public-progress" aria-label="Progreso del servicio">
              {progressSteps.map((step, index) => (
                <li className={index < currentStep ? 'complete' : index === currentStep ? 'current' : ''} key={step.value}>
                  <span>{index < currentStep ? <CheckCircle2 size={18} /> : <span className="public-progress-dot" />}</span>
                  <small>{step.label}</small>
                </li>
              ))}
            </ol>
            <div className="public-services">
              <h2><Sparkles size={17} /> Servicios</h2>
              <ul>{order.services.map((service) => <li key={service.serviceId}>{service.name}</li>)}</ul>
            </div>
            <button className="text-button public-refresh" type="button" onClick={refresh}><RefreshCw size={14} /> Actualizar ahora</button>
          </>
        )}
      </section>
      <p className="public-tracking-privacy">Seguimiento público de la orden. No mostramos datos del cliente.</p>
    </main>
  )
}
