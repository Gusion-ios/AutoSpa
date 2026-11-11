import { useState } from 'react'
import { DashboardLayout } from './layouts/DashboardLayout.jsx'
import { TableroPage } from './features/tablero/TableroPage.jsx'
import { RecepcionPage } from './features/recepcion/RecepcionPage.jsx'
import { SeguimientoPage } from './features/seguimiento/SeguimientoPage.jsx'
import { CatalogoPage } from './features/catalogo/CatalogoPage.jsx'
import { CajaPage } from './features/caja/CajaPage.jsx'
import { ReportePage } from './features/reporte/ReportePage.jsx'
import './App.css'

const initialServices = [
  { id: 1, name: 'Lavado completo', price: 45, duration: 45 },
  { id: 2, name: 'Lavado premium', price: 70, duration: 60 },
  { id: 3, name: 'Encerado', price: 95, duration: 90 },
  { id: 4, name: 'Limpieza interior', price: 60, duration: 60 },
]

const initialVehicles = [
  { id: 1, time: '09:00', client: 'María García', phone: '999 123 456', plate: 'ABC-123', vehicle: 'Toyota Corolla', service: 'Lavado premium', status: 'En proceso', paid: false },
  { id: 2, time: '10:30', client: 'Carlos Mendoza', phone: '988 234 567', plate: 'BCD-234', vehicle: 'Honda Civic', service: 'Lavado completo', status: 'Pendiente', paid: false },
  { id: 3, time: '11:00', client: 'Lucía Torres', phone: '977 345 678', plate: 'CDE-345', vehicle: 'Mazda CX-5', service: 'Encerado', status: 'Pendiente', paid: false },
]

export default function App() {
  const [activePage, setActivePage] = useState('Tablero')
  const [services, setServices] = useState(initialServices)
  const [vehicles, setVehicles] = useState(initialVehicles)

  function registerVehicle(vehicle) {
    setVehicles((current) => [
      {
        ...vehicle,
        id: Date.now(),
        time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        status: 'Pendiente',
        paid: false,
      },
      ...current,
    ])
  }

  function updateStatus(id, status) {
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? { ...vehicle, status } : vehicle))
  }

  function markPaid(id) {
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? { ...vehicle, paid: true } : vehicle))
  }

  function addService(service) {
    setServices((current) => [{ ...service, id: Date.now() }, ...current])
  }

  let page
  switch (activePage) {
    case 'Recepción':
      page = <RecepcionPage vehicles={vehicles} services={services} onRegister={registerVehicle} />
      break
    case 'Seguimiento':
      page = <SeguimientoPage vehicles={vehicles} onUpdateStatus={updateStatus} />
      break
    case 'Catálogo':
      page = <CatalogoPage services={services} onAddService={addService} />
      break
    case 'Caja':
      page = <CajaPage vehicles={vehicles} services={services} onMarkPaid={markPaid} />
      break
    case 'Reportes':
      page = <ReportePage vehicles={vehicles} services={services} />
      break
    default:
      page = <TableroPage vehicles={vehicles} services={services} onGoToReception={() => setActivePage('Recepción')} />
  }

  return (
    <DashboardLayout activePage={activePage} onNavigate={setActivePage}>
      {page}
    </DashboardLayout>
  )
}

