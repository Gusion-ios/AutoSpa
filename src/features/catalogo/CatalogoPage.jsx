import { useState } from 'react'
import { Check, Clock3, PackagePlus, Pencil, Plus, RefreshCw, Sparkles, X } from 'lucide-react'

export function CatalogoPage({ services, loading, error, onAddService, onUpdateServicePrice, onRetry }) {
  const [form, setForm] = useState({ name: '', price: '', duration: '45' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [priceDraft, setPriceDraft] = useState('')
  const [updating, setUpdating] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [priceSaved, setPriceSaved] = useState(false)

  function startEditing(service) {
    setEditingId(service.id)
    setPriceDraft(String(service.price))
    setPriceError('')
    setPriceSaved(false)
  }

  async function savePrice(serviceId) {
    const price = Number(priceDraft)
    if (!Number.isFinite(price) || price <= 0) {
      setPriceError('Ingresa un precio mayor que cero.')
      return
    }
    setUpdating(true)
    setPriceError('')
    try {
      await onUpdateServicePrice(serviceId, price)
      setEditingId(null)
      setPriceSaved(true)
    } catch (requestError) {
      setPriceError(requestError.message || 'No se pudo actualizar el precio.')
    } finally {
      setUpdating(false)
    }
  }

  function changeField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setSaved(false)
    setFormError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setFormError('')

    try {
      await onAddService({
        name: form.name.trim(),
        price: Number(form.price),
        duration: Number(form.duration),
      })
      setForm({ name: '', price: '', duration: '45' })
      setSaved(true)
    } catch (requestError) {
      setFormError(requestError.message || 'No se pudo guardar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">SERVICIOS Y PRECIOS</p>
          <h2>Catálogo</h2>
          <p>Administra los servicios guardados en PostgreSQL.</p>
        </div>
        <div className="intro-count">
          <Sparkles size={18} />
          <span><strong>{services.length}</strong> servicios activos</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LISTA DE SERVICIOS</p>
            <h2>Servicios disponibles</h2>
          </div>
          {error && (
            <button className="text-button" type="button" onClick={onRetry}>
              <RefreshCw size={15} /> Reintentar
            </button>
          )}
        </div>

        {loading ? (
          <p className="empty-state">Cargando catálogo…</p>
        ) : error ? (
          <p className="api-error" role="alert">{error}</p>
        ) : services.length === 0 ? (
          <p className="empty-state">No hay servicios en el catálogo.</p>
        ) : (
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.id}>
                <span className="service-icon"><Sparkles size={18} /></span>
                <h3>{service.name}</h3>
                <div className="service-meta">
                  <span><Clock3 size={14} />{service.duration} min</span>
                  {editingId === service.id ? (
                    <label className="service-price-edit">Precio S/
                      <input type="number" min="0.01" step="0.01" value={priceDraft} onChange={(event) => setPriceDraft(event.target.value)} aria-label={`Nuevo precio de ${service.name}`} />
                    </label>
                  ) : <strong>S/ {Number(service.price).toFixed(2)}</strong>}
                </div>
                <div className="service-card-actions">
                  {editingId === service.id ? <>
                    <button className="small-action" type="button" disabled={updating} onClick={() => savePrice(service.id)}><Check size={14} />{updating ? 'Guardando…' : 'Guardar'}</button>
                    <button className="text-button" type="button" disabled={updating} onClick={() => { setEditingId(null); setPriceError('') }}><X size={14} />Cancelar</button>
                  </> : <button className="text-button" type="button" onClick={() => startEditing(service)}><Pencil size={14} />Editar precio</button>}
                </div>
                {editingId === service.id && priceError && <p className="api-error" role="alert">{priceError}</p>}
              </article>
            ))}
          </div>
        )}
        {priceSaved && <p className="success-message" role="status">Precio actualizado en el catálogo.</p>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div className="heading-with-icon">
            <span className="panel-icon"><PackagePlus size={18} /></span>
            <div>
              <p className="eyebrow">AMPLÍA TU OFERTA</p>
              <h2>Agregar servicio</h2>
            </div>
          </div>
        </div>

        <form className="catalog-form" onSubmit={submit}>
          <label>
            Nombre del servicio
            <input
              name="name"
              value={form.name}
              onChange={changeField}
              placeholder="Ej. Tratamiento cerámico"
              minLength={3}
              required
            />
          </label>
          <label>
            Precio (S/)
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={changeField}
              placeholder="Ej. 120"
              required
            />
          </label>
          <label>
            Duración (minutos)
            <input
              name="duration"
              type="number"
              min="5"
              step="5"
              value={form.duration}
              onChange={changeField}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={saving || loading}>
            <Plus size={16} /> {saving ? 'Guardando…' : 'Añadir al catálogo'}
          </button>
          {formError && <p className="api-error" role="alert">{formError}</p>}
          {saved && <p className="success-message" role="status">Servicio guardado en PostgreSQL.</p>}
        </form>
      </section>
    </div>
  )
}
