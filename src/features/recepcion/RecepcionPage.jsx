import { useEffect, useState } from 'react'
import { CarFront, Check, ClipboardPlus, RefreshCw, Search } from 'lucide-react'

const createEmptyForm = (services) => ({
  client: '',
  phone: '',
  plate: '',
  vehicle: '',
  serviceIds: services[0] ? [String(services[0].id)] : [],
})

function normalizePlate(plate) {
  return plate.toUpperCase().replace(/[\s-]/g, '')
}

export function RecepcionPage({
  vehicles,
  services,
  loading,
  error,
  onRetry,
  onRegister,
}) {
  const [form, setForm] = useState(() => createEmptyForm(services))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [plateSearch, setPlateSearch] = useState('')
  const selectedServices = services.filter((service) => form.serviceIds.includes(String(service.id)))

  const normalizedSearch = normalizePlate(plateSearch.trim())
  const matchingVehicles = normalizedSearch
    ? vehicles.filter((item) => normalizePlate(item.plate ?? '').includes(normalizedSearch))
    : vehicles.slice(0, 5)

  useEffect(() => {
    if (form.serviceIds.length === 0 && services.length > 0) {
      setForm((current) => ({ ...current, serviceIds: [String(services[0].id)] }))
    }
  }, [form.serviceIds.length, services])

  function changeField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
    setSaved(false)
  }

  function toggleService(id) {
    const value = String(id)
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(value)
        ? current.serviceIds.filter((item) => item !== value)
        : [...current.serviceIds, value],
    }))
    setErrors((current) => ({ ...current, service: '', form: '' }))
    setSaved(false)
  }

  async function submit(event) {
    event.preventDefault()

    const client = form.client.trim()
    const phoneDigits = form.phone.replace(/\D/g, '')
    const plate = normalizePlate(form.plate)
    const vehicle = form.vehicle.trim()
    const nextErrors = {}

    if (client.length < 3) nextErrors.client = 'Escribe el nombre completo del cliente.'
    if (!/^(?:51)?9\d{8}$/.test(phoneDigits)) {
      nextErrors.phone = 'Ingresa un celular peruano de 9 dígitos.'
    }
    if (!/^[A-Z0-9]{6,7}$/.test(plate)) {
      nextErrors.plate = 'Revisa la placa. Ejemplo: ABC-123.'
    } else if (vehicles.some((item) => normalizePlate(item.plate) === plate && item.status !== 'Entregado')) {
      nextErrors.plate = 'Esta placa tiene una visita abierta. Márcala como Entregado antes de registrarla otra vez.'
    }
    if (vehicle.length < 2) nextErrors.vehicle = 'Escribe la marca y el modelo del vehículo.'
    if (selectedServices.length === 0) nextErrors.service = 'Selecciona al menos un servicio.'

    setErrors(nextErrors)
    setSaved(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onRegister({
        client,
        phone: phoneDigits,
        plate,
        vehicle,
        service: selectedServices[0].name,
        serviceIds: selectedServices.map((service) => service.id),
      })
      setForm(createEmptyForm(services))
      setSaved(true)
    } catch (requestError) {
      setErrors((current) => ({
        ...current,
        form: requestError.message || 'No se pudo registrar el vehículo.',
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">INGRESO DE VEHÍCULOS</p>
          <h2>Recepción</h2>
          <p>Registra al cliente y su vehículo para iniciar el servicio.</p>
        </div>
        <div className="intro-count">
          <CarFront size={18} />
          <span><strong>{vehicles.length}</strong> registrados</span>
        </div>
      </section>

      {error && (
        <div className="api-error" role="alert">
          {error}{' '}
          <button className="text-button" type="button" onClick={onRetry}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      <section className="panel">
        <div className="section-heading">
          <div className="heading-with-icon">
            <span className="panel-icon"><ClipboardPlus size={18} /></span>
            <div><p className="eyebrow">NUEVO INGRESO</p><h2>Datos del servicio</h2></div>
          </div>
        </div>

        <form className="reception-form" onSubmit={submit} noValidate>
          <label>Nombre del cliente
            <input className={errors.client ? 'form-error' : ''} name="client" value={form.client} onChange={changeField} placeholder="Ej. Ana Pérez" aria-invalid={Boolean(errors.client)} />
            {errors.client && <small className="field-error">{errors.client}</small>}
          </label>
          <label>Teléfono
            <input className={errors.phone ? 'form-error' : ''} name="phone" value={form.phone} onChange={changeField} placeholder="Ej. 999 123 456" inputMode="tel" aria-invalid={Boolean(errors.phone)} />
            {errors.phone && <small className="field-error">{errors.phone}</small>}
          </label>
          <label>Placa
            <input className={errors.plate ? 'form-error' : ''} name="plate" value={form.plate} onChange={changeField} placeholder="Ej. ABC-123" autoCapitalize="characters" aria-invalid={Boolean(errors.plate)} />
            {errors.plate && <small className="field-error">{errors.plate}</small>}
          </label>
          <label>Vehículo
            <input className={errors.vehicle ? 'form-error' : ''} name="vehicle" value={form.vehicle} onChange={changeField} placeholder="Marca y modelo" aria-invalid={Boolean(errors.vehicle)} />
            {errors.vehicle && <small className="field-error">{errors.vehicle}</small>}
          </label>
          <fieldset className={`form-wide service-picker ${errors.service ? 'form-error' : ''}`} aria-invalid={Boolean(errors.service)}>
            <legend>Servicios solicitados <span>(puedes elegir varios)</span></legend>
            <div className="service-picker-list">
              {services.filter((service) => service.active !== false).map((service) => (
                <label className={`service-option ${form.serviceIds.includes(String(service.id)) ? 'selected' : ''}`} key={service.id}>
                  <input type="checkbox" checked={form.serviceIds.includes(String(service.id))} onChange={() => toggleService(service.id)} />
                  <span><strong>{service.name}</strong><small>{service.duration} min</small></span>
                  <strong>S/ {Number(service.price).toFixed(2)}</strong>
                </label>
              ))}
            </div>
            {errors.service && <small className="field-error">{errors.service}</small>}
            <p className="service-picker-total">Total de este ingreso: <strong>S/ {selectedServices.reduce((sum, service) => sum + Number(service.price), 0).toFixed(2)}</strong></p>
          </fieldset>
          <div className="form-actions">
            <span className="form-hint">Confirma los datos con el cliente antes de registrar.</span>
            <button className="primary-button" type="submit" disabled={saving || loading || services.length === 0}>
              <Check size={16} /> {saving ? 'Guardando…' : 'Registrar ingreso'}
            </button>
          </div>
          {errors.form && <p className="api-error" role="alert">{errors.form}</p>}
          {saved && <p className="success-message" role="status">Vehículo registrado en el backend.</p>}
        </form>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <div><p className="eyebrow">HISTORIAL</p><h2>{normalizedSearch ? `Visitas de ${plateSearch.trim()}` : 'Últimos ingresos'}</h2></div>
          <label className="search-box">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={plateSearch}
              onChange={(event) => setPlateSearch(event.target.value)}
              placeholder="Buscar por placa"
              aria-label="Buscar ingresos por placa"
            />
          </label>
        </div>
        {loading ? <p className="empty-state">Cargando vehículos…</p> : vehicles.length === 0 ? <p className="empty-state">Aún no hay vehículos registrados.</p> : (
          matchingVehicles.length === 0 ? (
            <p className="empty-state" role="status">No hay ingresos que coincidan con esa placa.</p>
          ) : (
            <>
            {normalizedSearch && <p className="history-count">{matchingVehicles.length} {matchingVehicles.length === 1 ? 'visita registrada' : 'visitas registradas'} para esta placa.</p>}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Placa</th><th>Vehículo</th><th>Servicios</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>{matchingVehicles.map((item) => (
                  <tr key={item.id}>
                    <td>{item.visitDate}</td><td>{item.time}</td><td className="strong-cell">{item.client}</td><td>{item.plate}</td><td>{item.vehicle}</td><td>{item.service}</td>
                    <td>S/ {Number(item.total ?? item.services?.reduce((sum, service) => sum + Number(service.appliedPrice ?? service.price ?? 0), 0) ?? services.find((service) => service.name === item.service)?.price ?? 0).toFixed(2)}</td>
                    <td><span className={`status ${item.status === 'Entregado' ? 'delivered' : item.status === 'Listo' ? 'ready' : item.status === 'En proceso' ? 'in-progress' : ''}`}>{item.status}{item.paid ? ' · Pagado' : ''}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            </>
          )
        )}
      </section>
    </div>
  )
}
