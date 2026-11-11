import { BarChart3, CarFront, CircleDollarSign, ClipboardCheck, Sparkles } from 'lucide-react'

export function ReportePage({ vehicles, services }) {
  const finished = vehicles.filter((vehicle) => vehicle.status === 'Listo' || vehicle.paid)
  const income = vehicles.filter((vehicle) => vehicle.paid).reduce((sum, vehicle) => sum + (services.find((service) => service.name === vehicle.service)?.price ?? 0), 0)
  const counts = services.map((service) => ({ ...service, count: vehicles.filter((vehicle) => vehicle.service === service.name).length })).sort((a, b) => b.count - a.count)
  const maxCount = Math.max(1, ...counts.map((service) => service.count))

  return (
    <div className="page-stack">
      <section className="page-intro"><div><p className="eyebrow">RESUMEN OPERATIVO</p><h2>Reportes</h2><p>Indicadores calculados con los datos de muestra de esta sesión.</p></div><div className="intro-count"><BarChart3 size={18} /><span>Vista de hoy</span></div></section>
      <section className="stats report-stats"><article className="stat-card"><span className="stat-icon"><CarFront size={18} /></span><p>Vehículos recibidos</p><strong>{vehicles.length}</strong><small>Registros visibles</small></article><article className="stat-card"><span className="stat-icon"><ClipboardCheck size={18} /></span><p>Servicios terminados</p><strong>{finished.length}</strong><small>Marcados como listos o pagados</small></article><article className="stat-card"><span className="stat-icon"><CircleDollarSign size={18} /></span><p>Ingresos cobrados</p><strong>S/ {income.toFixed(2)}</strong><small>Pagos marcados en Caja</small></article></section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">DEMANDA</p><h2>Servicios solicitados</h2></div></div>
        <div className="report-bars">{counts.map((service) => <div className="report-bar-row" key={service.id}><div className="report-bar-label"><span><Sparkles size={14} />{service.name}</span><strong>{service.count}</strong></div><div className="bar-track"><span style={{ width: `${(service.count / maxCount) * 100}%` }} /></div></div>)}</div>
      </section>
      <p className="report-disclaimer">Este reporte es temporal: al recargar la página, los datos de ejemplo vuelven a su estado inicial.</p>
    </div>
  )
}
