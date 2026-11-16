import { useMemo, useState } from 'react'
import { CircleDollarSign, Search } from 'lucide-react'

function limaDateKey(value) {
    if (!value) return ''

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

function money(value) {
    return `S/ ${Number(value || 0).toFixed(2)}`
}

export function CajaPage({ vehicles, services, onGoToCobro }) {
    const [query, setQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState(() => limaDateKey(new Date()))

    function servicePrice(serviceName) {
        return services.find((service) => service.name === serviceName)?.price ?? 0
    }

    function vehicleTotal(vehicle) {
        return Number(vehicle.total ?? servicePrice(vehicle.service))
    }

    const readyToCharge = vehicles.filter(
        (vehicle) => vehicle.status === 'Listo' && !vehicle.paid,
    )

    const paymentsForDay = useMemo(
        () => vehicles.filter((vehicle) => vehicle.paid && limaDateKey(vehicle.paidAt) === selectedDate),
        [vehicles, selectedDate],
    )

    const dailyTotal = paymentsForDay.reduce((sum, vehicle) => sum + vehicleTotal(vehicle), 0)
    const dailyTotalsByMethod = paymentsForDay.reduce((totals, vehicle) => {
        const method = vehicle.paymentMethod || 'Efectivo'
        totals[method] = (totals[method] ?? 0) + vehicleTotal(vehicle)
        return totals
    }, {})

    const filteredPayments = useMemo(() => {
        const normalizedQuery = query.toLowerCase().trim()

        return paymentsForDay.filter((vehicle) =>
            `${vehicle.client} ${vehicle.plate} ${vehicle.vehicle} ${vehicle.paymentMethod ?? ''}`
                .toLowerCase()
                .includes(normalizedQuery),
        )
    }, [paymentsForDay, query])

    return (
        <div className="page-stack">
            <section className="page-intro">
                <div>
                    <p className="eyebrow">PAGOS Y CIERRE</p>
                    <h2>Caja</h2>
                    <p>Revisa lo pendiente y resume los pagos del día seleccionado.</p>
                </div>

                <div className="intro-count">
                    <CircleDollarSign size={18} />
                    <span><strong>{money(dailyTotal)}</strong> recaudado</span>
                </div>
            </section>

            <section className="panel">
                <div className="section-heading tracking-heading">
                    <div>
                        <p className="eyebrow">CIERRE DIARIO</p>
                        <h2>Resumen de caja</h2>
                    </div>
                    <label className="field-label">
                        Fecha
                        <input
                            type="date"
                            value={selectedDate}
                            max={limaDateKey(new Date())}
                            onChange={(event) => setSelectedDate(event.target.value)}
                            aria-label="Fecha del cierre de caja"
                        />
                    </label>
                </div>

                <section className="stats cash-stats" aria-label="Resumen de pagos del día">
                    <article className="stat-card">
                        <p>Órdenes cobradas</p>
                        <strong>{paymentsForDay.length}</strong>
                        <small>Pagos registrados en la fecha</small>
                    </article>
                    <article className="stat-card">
                        <p>Efectivo</p>
                        <strong>{money(dailyTotalsByMethod.Efectivo)}</strong>
                        <small>{paymentsForDay.filter((item) => (item.paymentMethod || 'Efectivo') === 'Efectivo').length} pagos</small>
                    </article>
                    <article className="stat-card">
                        <p>Yape / Plin</p>
                        <strong>{money(dailyTotalsByMethod['Yape / Plin'])}</strong>
                        <small>{paymentsForDay.filter((item) => item.paymentMethod === 'Yape / Plin').length} pagos</small>
                    </article>
                    {dailyTotalsByMethod.Tarjeta !== undefined && (
                        <article className="stat-card">
                            <p>Tarjeta</p>
                            <strong>{money(dailyTotalsByMethod.Tarjeta)}</strong>
                            <small>{paymentsForDay.filter((item) => item.paymentMethod === 'Tarjeta').length} pagos</small>
                        </article>
                    )}
                    <article className="stat-card">
                        <p>Total del día</p>
                        <strong>{money(dailyTotal)}</strong>
                        <small>Suma de pagos registrados</small>
                    </article>
                </section>
            </section>

            <section className="panel">
                <div className="section-heading tracking-heading">
                    <div>
                        <p className="eyebrow">PENDIENTES</p>
                        <h2>Listos para cobrar</h2>
                    </div>
                    <span className="intro-count">{readyToCharge.length} órdenes</span>
                </div>

                {readyToCharge.length === 0 ? (
                    <p className="empty-state">No hay órdenes listas pendientes de cobro.</p>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Cliente</th><th>Placa</th><th>Servicio</th><th>Total</th><th>Acción</th></tr>
                            </thead>
                            <tbody>
                                {readyToCharge.map((vehicle) => (
                                    <tr key={vehicle.id}>
                                        <td className="strong-cell">{vehicle.client}</td>
                                        <td>{vehicle.plate}</td>
                                        <td>{vehicle.service}</td>
                                        <td>{money(vehicleTotal(vehicle))}</td>
                                        <td><button className="small-action" type="button" onClick={onGoToCobro}>Ir a Cobro</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="panel">
                <div className="section-heading tracking-heading">
                    <div>
                        <p className="eyebrow">MOVIMIENTOS</p>
                        <h2>Pagos del día</h2>
                    </div>
                    <label className="search-box">
                        <Search size={16} />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar cliente o placa..."
                            aria-label="Buscar pago por cliente o placa"
                        />
                    </label>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Hora</th><th>Cliente</th><th>Placa</th><th>Servicio</th><th>Método</th><th>Importe</th></tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((vehicle) => (
                                <tr key={vehicle.id}>
                                    <td>{vehicle.paidAt ? new Date(vehicle.paidAt).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td className="strong-cell">{vehicle.client}</td>
                                    <td>{vehicle.plate}</td>
                                    <td>{vehicle.service}</td>
                                    <td>{vehicle.paymentMethod ?? 'Efectivo'}</td>
                                    <td>{money(vehicleTotal(vehicle))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <p className="empty-state">No hay pagos para esa fecha o búsqueda.</p>
                )}
            </section>
        </div>
    )
}
