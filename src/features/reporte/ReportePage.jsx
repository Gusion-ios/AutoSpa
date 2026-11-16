import {
    BarChart3,
    CarFront,
    CircleDollarSign,
    ClipboardCheck,
    Download,
    Sparkles,
} from 'lucide-react'

export function ReportePage({ vehicles, services }) {
    const finished = vehicles.filter(
        (vehicle) => vehicle.status === 'Listo' || vehicle.paid,
    )

    const income = vehicles
        .filter((vehicle) => vehicle.paid)
        .reduce((sum, vehicle) => {
            const price = vehicle.total ?? (
                services.find((service) => service.name === vehicle.service)?.price ?? 0
            )

            return sum + price
        }, 0)

    const serviceCounts = services
        .map((service) => ({
            ...service,
            count: vehicles.filter((vehicle) => Array.isArray(vehicle.services) && vehicle.services.length
                ? vehicle.services.some((item) => item.name === service.name)
                : vehicle.service === service.name).length,
        }))
        .sort((a, b) => b.count - a.count)

    const maxCount = Math.max(
        1,
        ...serviceCounts.map((service) => service.count),
    )

    function exportCsv() {
        const rows = [
            ['Hora', 'Cliente', 'Teléfono', 'Placa', 'Vehículo', 'Servicio', 'Estado', 'Método de pago', 'Importe'],
            ...vehicles.map((vehicle) => {
                const price = vehicle.total ?? (
                    services.find((service) => service.name === vehicle.service)?.price ?? 0
                )

                return [
                    vehicle.time,
                    vehicle.client,
                    vehicle.phone,
                    vehicle.plate,
                    vehicle.vehicle,
                    vehicle.service,
                    vehicle.status,
                    vehicle.paymentMethod ?? '',
                    vehicle.paid ? price.toFixed(2) : '',
                ]
            }),
        ]

        const csvCell = (value) => {
            let text = String(value ?? '')

            // Evita que Excel interprete los datos como fórmulas.
            if (/^[=+\-@]/.test(text)) {
                text = `'${text}`
            }

            return `"${text.replace(/"/g, '""')}"`
        }

        const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = 'autospa-reporte.csv'
        link.click()

        URL.revokeObjectURL(url)
    }

    return (
        <div className="page-stack">
            <section className="page-intro">
                <div>
                    <p className="eyebrow">RESUMEN OPERATIVO</p>
                    <h2>Reportes</h2>
                    <p>Indicadores calculados con las órdenes guardadas en el servidor.</p>
                </div>

                <button className="primary-button" type="button" onClick={exportCsv}>
                    <Download size={16} /> Descargar CSV
                </button>
            </section>

            <section className="stats report-stats">
                <article className="stat-card">
                    <span className="stat-icon"><CarFront size={18} /></span>
                    <p>Vehículos recibidos</p>
                    <strong>{vehicles.length}</strong>
                    <small>Registros disponibles</small>
                </article>

                <article className="stat-card">
                    <span className="stat-icon"><ClipboardCheck size={18} /></span>
                    <p>Servicios terminados</p>
                    <strong>{finished.length}</strong>
                    <small>Listos o pagados</small>
                </article>

                <article className="stat-card">
                    <span className="stat-icon"><CircleDollarSign size={18} /></span>
                    <p>Ingresos cobrados</p>
                    <strong>S/ {income.toFixed(2)}</strong>
                    <small>Pagos registrados</small>
                </article>
            </section>

            <section className="panel">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">DEMANDA</p>
                        <h2>Servicios solicitados</h2>
                    </div>
                </div>

                <div className="report-bars">
                    {serviceCounts.map((service) => (
                        <div className="report-bar-row" key={service.id}>
                            <div className="report-bar-label">
                                <span><Sparkles size={14} />{service.name}</span>
                                <strong>{service.count}</strong>
                            </div>

                            <div className="bar-track">
                <span
                    style={{ width: `${(service.count / maxCount) * 100}%` }}
                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <p className="report-disclaimer">
                El archivo CSV contiene los registros cargados para esta sesión.
            </p>
        </div>
    )
}
