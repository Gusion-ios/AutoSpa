import { useState } from 'react'
import { Check, ClipboardPlus, UserRound, CarFront } from 'lucide-react'

const emptyForm = { client: '', phone: '', plate: '', vehicle: '', service: 'Lavado completo' }

export function RecepcionPage({ vehicles, services, onRegister }) {
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)

  function changeField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setSaved(false)
  }

  function submit(event) {
    event.preventDefault()
    onRegister({ ...form, client: form.client.trim(), phone: form.phone.trim(), plate: form.plate.trim().toUpperCase(), vehicle: form.vehicle.trim() })
    setForm(emptyForm)
    setSaved(true)
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">INGRESO DE VEHÍCULOS</p><h2>Recepción</h2><p>Registra al cliente y su vehículo para iniciar el servicio.</p></div>
        <div className="intro-count"><CarFront size={18} /><span><strong>{vehicles.length}</strong> registrados hoy</span></div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div className="heading-with-icon"><span className="panel-icon"><ClipboardPlus size={18} /></span><div><p className="eyebrow">NUEVO INGRESO</p><h2>Datos del servicio</h2></div></div>
        </div>
        <form className="reception-form" onSubmit={submit}>
          <label>Nombre del cliente<input name="client" value={form.client} onChange={changeField} placeholder="Ej. Ana Pérez" required /></label>
          <label>Teléfono<input name="phone" value={form.phone} onChange={changeField} placeholder="Ej. 999 123 456" inputMode="tel" required /></label>
          <label>Placa<input name="plate" value={form.plate} onChange={changeField} placeholder="Ej. ABC-123" required /></label>
          <label>Vehículo<input name="vehicle" value={form.vehicle} onChange={changeField} placeholder="Marca y modelo" required /></label>
          <label className="form-wide">Servicio solicitado<select name="service" value={form.service} onChange={changeField}>{services.map((service) => <option key={service.id}>{service.name}</option>)}</select></label>
          <div className="form-actions"><span className="form-hint">Confirma los datos con el cliente antes de registrar.</span><button className="primary-button" type="submit"><Check size={16} /> Registrar ingreso</button></div>
          {saved && <p className="success-message" role="status">Ingreso registrado. Ya aparece en el tablero y en seguimiento.</p>}
        </form>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading"><div><p className="eyebrow">RECIENTES</p><h2>Últimos ingresos</h2></div></div>
        <div className="table-wrap"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Placa</th><th>Vehículo</th><th>Servicio</th></tr></thead>
          <tbody>{vehicles.slice(0, 5).map((vehicle) => <tr key={vehicle.id}><td>{vehicle.time}</td><td className="strong-cell">{vehicle.client}</td><td>{vehicle.plate}</td><td>{vehicle.vehicle}</td><td>{vehicle.service}</td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  )
}

