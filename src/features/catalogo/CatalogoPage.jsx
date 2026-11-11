import { useState } from 'react'
import { Clock3, PackagePlus, Plus, Sparkles } from 'lucide-react'

export function CatalogoPage({ services, onAddService }) {
  const [form, setForm] = useState({ name: '', price: '', duration: '45' })
  const [saved, setSaved] = useState(false)

  function submit(event) {
    event.preventDefault()
    onAddService({ name: form.name.trim(), price: Number(form.price), duration: Number(form.duration) })
    setForm({ name: '', price: '', duration: '45' })
    setSaved(true)
  }

  return (
    <div className="page-stack">
      <section className="page-intro"><div><p className="eyebrow">SERVICIOS Y PRECIOS</p><h2>Catálogo</h2><p>Administra los servicios que ofrece AutoSpa.</p></div><div className="intro-count"><Sparkles size={18} /><span><strong>{services.length}</strong> servicios activos</span></div></section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">LISTA DE SERVICIOS</p><h2>Servicios disponibles</h2></div></div>
        <div className="service-grid">{services.map((service) => <article className="service-card" key={service.id}><span className="service-icon"><Sparkles size={18} /></span><h3>{service.name}</h3><div className="service-meta"><span><Clock3 size={14} />{service.duration} min</span><strong>S/ {service.price.toFixed(2)}</strong></div></article>)}</div>
      </section>
      <section className="panel">
        <div className="section-heading"><div className="heading-with-icon"><span className="panel-icon"><PackagePlus size={18} /></span><div><p className="eyebrow">AMPLÍA TU OFERTA</p><h2>Agregar servicio</h2></div></div></div>
        <form className="catalog-form" onSubmit={submit}>
          <label>Nombre del servicio<input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setSaved(false) }} placeholder="Ej. Tratamiento cerámico" required /></label>
          <label>Precio (S/)<input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => { setForm({ ...form, price: event.target.value }); setSaved(false) }} placeholder="Ej. 120" required /></label>
          <label>Duración (minutos)<input type="number" min="5" step="5" value={form.duration} onChange={(event) => { setForm({ ...form, duration: event.target.value }); setSaved(false) }} required /></label>
          <button className="primary-button" type="submit"><Plus size={16} /> Añadir al catálogo</button>
          {saved && <p className="success-message" role="status">Servicio agregado al catálogo.</p>}
        </form>
      </section>
    </div>
  )
}
