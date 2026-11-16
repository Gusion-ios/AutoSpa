import { useState } from 'react'
import { Check, CircleDollarSign, Printer, RefreshCw } from 'lucide-react'

export function CobroPage({ vehicles, services, loading, error, onRetry, onMarkPaid, onDeliver, canDeliver = false }) {
  const [selectedId, setSelectedId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [delivering, setDelivering] = useState(false)
  const [deliveredNotice, setDeliveredNotice] = useState('')

  const readyVehicles = vehicles.filter((vehicle) => vehicle.status === 'Listo' && !vehicle.paid)
  const selectedVehicle = readyVehicles.find((vehicle) => String(vehicle.id) === selectedId)

  function getPrice(serviceName) {
    return Number(services.find((service) => service.name === serviceName)?.price ?? 0)
  }

  function vehicleTotal(vehicle) {
    return Number(vehicle.total ?? getPrice(vehicle.service))
  }

  async function submit(event) {
    event.preventDefault()
    if (!selectedVehicle) return

    setSaving(true)
    setActionError('')
    try {
      const paidVehicle = await onMarkPaid(selectedVehicle.id, paymentMethod)
      setReceipt({
        ...selectedVehicle,
        ...paidVehicle,
        amount: vehicleTotal(selectedVehicle),
        paymentMethod,
        paidAt: paidVehicle.paidAt
          ? new Date(paidVehicle.paidAt).toLocaleString('es-PE')
          : new Date().toLocaleString('es-PE'),
      })
      setSelectedId('')
    } catch (requestError) {
      setActionError(requestError.message || 'No se pudo registrar el pago.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelivery() {
    if (!receipt || !canDeliver) return
    setDelivering(true)
    setActionError('')
    setDeliveredNotice('')
    try {
      const updated = await onDeliver(receipt.id)
      setReceipt((current) => ({ ...current, ...updated }))
      setDeliveredNotice('Entrega registrada. Esta placa ya puede volver a ingresar.')
    } catch (requestError) {
      setActionError(requestError.message || 'No se pudo registrar la entrega.')
    } finally {
      setDelivering(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">CIERRE DEL SERVICIO</p><h2>Cobro</h2><p>Selecciona un vehículo listo para registrar su pago.</p></div>
        <div className="intro-count"><CircleDollarSign size={18} /><span><strong>{readyVehicles.length}</strong> pendientes de cobro</span></div>
      </section>

      {error && <div className="api-error" role="alert">{error}{' '}<button className="text-button" type="button" onClick={onRetry}><RefreshCw size={14} /> Reintentar</button></div>}
      {actionError && <p className="api-error" role="alert">{actionError}</p>}

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">VEHÍCULOS LISTOS</p><h2>Selecciona un servicio</h2></div></div>
        {loading ? <p className="empty-state">Cargando vehículos…</p> : readyVehicles.length === 0 ? (
          <p className="empty-state">No hay vehículos listos para cobrar. Actualiza su estado en Seguimiento.</p>
        ) : (
          <form className="checkout-form" onSubmit={submit}>
            <div className="checkout-list">
              {readyVehicles.map((vehicle) => (
                <label className={`checkout-card ${selectedId === String(vehicle.id) ? 'selected' : ''}`} key={vehicle.id}>
                  <input type="radio" name="vehicle" value={vehicle.id} checked={selectedId === String(vehicle.id)} onChange={(event) => setSelectedId(event.target.value)} />
                  <span className="checkout-info"><strong>{vehicle.client} · {vehicle.plate}</strong><small>{vehicle.vehicle} — {vehicle.service}</small></span>
                  <strong className="checkout-price">S/ {vehicleTotal(vehicle).toFixed(2)}</strong>
                </label>
              ))}
            </div>

            {selectedVehicle && (
              <div className="checkout-payment">
                <label>Método de pago
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option>Efectivo</option><option>Tarjeta</option><option>Yape / Plin</option>
                  </select>
                </label>
                <div className="checkout-total"><span>Total a pagar</span><strong>S/ {vehicleTotal(selectedVehicle).toFixed(2)}</strong></div>
                <button className="primary-button" type="submit" disabled={saving}>
                  <Check size={16} /> {saving ? 'Registrando…' : 'Confirmar cobro'}
                </button>
              </div>
            )}
          </form>
        )}
      </section>

      {receipt && (
        <section className="receipt-card">
          <div className="receipt-heading">
            <div><p className="eyebrow">AUTOSPA · COMPROBANTE DE DEMOSTRACIÓN</p><h2>Pago registrado</h2></div>
            <button className="text-button no-print" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
          </div>
          <dl className="receipt-details">
            <div><dt>Cliente</dt><dd>{receipt.client}</dd></div>
            <div><dt>Vehículo</dt><dd>{receipt.vehicle} · {receipt.plate}</dd></div>
            <div><dt>Servicio</dt><dd>{receipt.service}</dd></div>
            <div><dt>Método de pago</dt><dd>{receipt.paymentMethod}</dd></div>
            <div><dt>Fecha</dt><dd>{receipt.paidAt}</dd></div>
            <div className="receipt-amount"><dt>Total</dt><dd>S/ {receipt.amount.toFixed(2)}</dd></div>
          </dl>
          {receipt.status === 'Entregado' ? (
            <p className="success-message" role="status">Vehículo entregado.</p>
          ) : canDeliver && receipt.paid && (
            <button className="primary-button delivery-confirm-button" type="button" disabled={delivering} onClick={confirmDelivery}>
              <Check size={16} /> {delivering ? 'Registrando entrega…' : 'Confirmar entrega'}
            </button>
          )}
          {deliveredNotice && <p className="success-message" role="status">{deliveredNotice}</p>}
        </section>
      )}
    </div>
  )
}
