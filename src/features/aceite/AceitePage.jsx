import { useCallback, useEffect, useState } from 'react'
import { Droplets, Plus, RotateCw } from 'lucide-react'
import { apiRequest } from '../../api/client.js'

const emptyForm = {
    client: '',
    plate: '',
    vehicle: '',
    oilBrand: '',
    viscosity: '',
    liters: '',
    mileage: '',
    nextMileage: '',
    nextDueDate: '',
    amount: '',
}

function limaDateKey(value = new Date()) {
    const date = new Date(value)
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

function dueLabel(record, today) {
    if (record.nextDueDate < today) return { label: 'Vencido', className: 'due-overdue' }
    const days = Math.ceil((new Date(`${record.nextDueDate}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000)
    if (days <= 30) return { label: 'Próximo', className: 'due-soon' }
    return { label: 'Programado', className: 'due-planned' }
}

export function AceitePage() {
    const [records, setRecords] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const today = limaDateKey()

    const loadRecords = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const result = await apiRequest('/oil-changes')
            setRecords(Array.isArray(result) ? result : [])
        } catch (requestError) {
            setError(requestError.message || 'No se pudo cargar el historial de aceite.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRecords()
    }, [loadRecords])

    function changeField(event) {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: name === 'plate' ? value.toUpperCase() : value }))
        setSaved(false)
    }

    async function submit(event) {
        event.preventDefault()
        setError('')
        setSaved(false)

        if (Number(form.nextMileage) <= Number(form.mileage)) {
            setError('El próximo kilometraje debe ser mayor que el kilometraje actual.')
            return
        }

        setSaving(true)
        try {
            const created = await apiRequest('/oil-changes', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    plate: form.plate.trim().replace(/[\s-]+/g, ''),
                    oilBrand: form.oilBrand.trim(),
                    liters: Number(form.liters),
                    mileage: Number(form.mileage),
                    nextMileage: Number(form.nextMileage),
                    amount: Number(form.amount),
                }),
            })
            setRecords((current) => [...current, created].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)))
            setForm(emptyForm)
            setSaved(true)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo registrar el cambio de aceite.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="page-stack">
            <section className="page-intro">
                <div>
                    <p className="eyebrow">MANTENIMIENTO DEL VEHÍCULO</p>
                    <h2>Cambios de aceite</h2>
                    <p>Guarda el kilometraje actual y programa el próximo cambio.</p>
                </div>
                <div className="intro-count">
                    <Droplets size={18} />
                    <span><strong>{records.length}</strong> servicios registrados</span>
                </div>
            </section>

            <section className="panel">
                <div className="section-heading">
                    <div className="heading-with-icon">
                        <span className="panel-icon"><Droplets size={18} /></span>
                        <div>
                            <p className="eyebrow">NUEVO SERVICIO</p>
                            <h2>Datos del cambio de aceite</h2>
                        </div>
                    </div>
                </div>

                <form className="reception-form" onSubmit={submit}>
                    <label>Cliente<input name="client" value={form.client} onChange={changeField} placeholder="Nombre del cliente" maxLength={120} required /></label>
                    <label>Placa<input name="plate" value={form.plate} onChange={changeField} placeholder="Ej. ABC-123" maxLength={10} required /></label>
                    <label>Vehículo<input name="vehicle" value={form.vehicle} onChange={changeField} placeholder="Marca y modelo" maxLength={120} required /></label>
                    <label>Marca del aceite<input name="oilBrand" value={form.oilBrand} onChange={changeField} placeholder="Ej. Mobil" maxLength={80} required /></label>
                    <label>Viscosidad<input name="viscosity" value={form.viscosity} onChange={changeField} placeholder="Ej. 5W-30" maxLength={20} required /></label>
                    <label>Cantidad (litros)<input name="liters" type="number" min="0.1" step="0.1" value={form.liters} onChange={changeField} placeholder="Ej. 4" required /></label>
                    <label>Kilometraje actual<input name="mileage" type="number" min="0" step="1" value={form.mileage} onChange={changeField} placeholder="Ej. 45000" required /></label>
                    <label>Próximo cambio (km)<input name="nextMileage" type="number" min={Number(form.mileage || 0) + 1} step="1" value={form.nextMileage} onChange={changeField} placeholder="Ej. 50000" required /></label>
                    <label>Próximo cambio (fecha)<input name="nextDueDate" type="date" min={today} value={form.nextDueDate} onChange={changeField} required /></label>
                    <label>Importe (S/)<input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={changeField} placeholder="Ej. 180" required /></label>

                    <div className="form-actions">
                        <span className="form-hint">Los próximos cambios quedarán compartidos en el servidor.</span>
                        <button className="primary-button" type="submit" disabled={saving}>
                            <Plus size={16} /> {saving ? 'Guardando…' : 'Registrar servicio'}
                        </button>
                    </div>
                    {error && <p className="error-message" role="alert">{error}</p>}
                    {saved && <p className="success-message" role="status">Cambio de aceite registrado en el servidor.</p>}
                </form>
            </section>

            <section className="panel compact-panel">
                <div className="section-heading tracking-heading">
                    <div>
                        <p className="eyebrow">RECORDATORIOS</p>
                        <h2>Próximos vencimientos</h2>
                    </div>
                    <button className="text-button" type="button" onClick={loadRecords} disabled={loading}>
                        <RotateCw size={15} /> Actualizar
                    </button>
                </div>

                {loading ? <p className="empty-state">Cargando registros…</p> : error && records.length === 0 ? (
                    <p className="error-message" role="alert">{error}</p>
                ) : records.length === 0 ? (
                    <p className="empty-state">Aún no hay cambios de aceite registrados.</p>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Cliente</th><th>Placa</th><th>Vehículo</th><th>Último km</th><th>Próximo km</th><th>Próxima fecha</th><th>Estado</th></tr></thead>
                            <tbody>{records.map((record) => {
                                const due = dueLabel(record, today)
                                return (
                                    <tr key={record.id}>
                                        <td className="strong-cell">{record.client}</td>
                                        <td>{record.plate}</td>
                                        <td>{record.vehicle}</td>
                                        <td>{Number(record.mileage).toLocaleString('es-PE')} km</td>
                                        <td>{Number(record.nextMileage).toLocaleString('es-PE')} km</td>
                                        <td>{new Date(`${record.nextDueDate}T12:00:00`).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</td>
                                        <td><span className={`status ${due.className}`}>{due.label}</span></td>
                                    </tr>
                                )
                            })}</tbody>
                        </table>
                    </div>
                )}
                {error && records.length > 0 && <p className="error-message" role="alert">{error}</p>}
            </section>
        </div>
    )
}
