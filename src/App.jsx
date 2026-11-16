import { useEffect, useState } from 'react'
import { apiRequest } from './api/client.js'
import { useServiceCatalog } from './hooks/useServiceCatalog.js'
import { useVehicles } from './hooks/useVehicles.js'
import { DashboardLayout } from './layouts/DashboardLayout.jsx'
import { TableroPage } from './features/tablero/TableroPage.jsx'
import { RecepcionPage } from './features/recepcion/RecepcionPage.jsx'
import { SeguimientoPage } from './features/seguimiento/SeguimientoPage.jsx'
import { CatalogoPage } from './features/catalogo/CatalogoPage.jsx'
import { CajaPage } from './features/caja/CajaPage.jsx'
import { ReportePage } from './features/reporte/ReportePage.jsx'
import { LoginPage } from './features/login/LoginPage.jsx'
import { AceitePage } from './features/aceite/AceitePage.jsx'
import { CobroPage } from './features/cobro/CobroPage.jsx'
import { UsuariosPage } from './features/usuarios/UsuariosPage.jsx'
import { PublicTrackingPage } from './features/seguimiento/PublicTrackingPage.jsx'
import './App.css'

const ALL_PAGES = ['Tablero', 'Recepción', 'Seguimiento', 'Catálogo', 'Caja', 'Reportes', 'Aceite', 'Cobro', 'Usuarios']
const PAGES_BY_ROLE = {
  RECEPCION: ['Recepción', 'Seguimiento', 'Aceite'],
  TECNICO: ['Seguimiento', 'Aceite'],
  CAJA: ['Caja', 'Cobro'],
}

function pagesForRoles(roles = []) {
  if (roles.includes('ADMIN_SUPREMO') || roles.includes('ADMINISTRADOR')) return ALL_PAGES
  const granted = new Set(roles.flatMap((role) => PAGES_BY_ROLE[role] ?? []))
  return ALL_PAGES.filter((page) => granted.has(page))
}

function AuthenticatedApp({ user, onLogout }) {
  const allowedPages = pagesForRoles(user.roles)
  const [activePage, setActivePage] = useState(allowedPages[0] ?? 'Recepción')
  const vehiclesState = useVehicles()
  const servicesState = useServiceCatalog()
  const active = allowedPages.includes(activePage) ? activePage : allowedPages[0]
  const { vehicles, loading: vehiclesLoading, error: vehiclesError, reload: reloadVehicles,
    registerVehicle, updateStatus, markPaid, markDelivered } = vehiclesState
  const { services, loading: servicesLoading, error: servicesError, addService, updateServicePrice, reload: reloadServices } = servicesState

  let page
  switch (active) {
    case 'Recepción':
      page = <RecepcionPage vehicles={vehicles} services={services} loading={vehiclesLoading} error={vehiclesError} onRetry={reloadVehicles} onRegister={registerVehicle} />
      break
    case 'Seguimiento':
      page = <SeguimientoPage vehicles={vehicles} loading={vehiclesLoading} error={vehiclesError} onRetry={reloadVehicles} onUpdateStatus={updateStatus} onDeliver={markDelivered} canDeliver={user.roles.some((role) => ['ADMIN_SUPREMO', 'ADMINISTRADOR', 'CAJA', 'RECEPCION'].includes(role))} canUpdateStatus={user.roles.some((role) => ['ADMIN_SUPREMO', 'ADMINISTRADOR', 'TECNICO'].includes(role))} />
      break
    case 'Catálogo':
      page = <CatalogoPage services={services} loading={servicesLoading} error={servicesError} onAddService={addService} onUpdateServicePrice={updateServicePrice} onRetry={reloadServices} />
      break
    case 'Caja':
      page = <CajaPage vehicles={vehicles} services={services} onGoToCobro={() => setActivePage('Cobro')} />
      break
    case 'Cobro':
      page = <CobroPage vehicles={vehicles} services={services} loading={vehiclesLoading} error={vehiclesError} onRetry={reloadVehicles} onMarkPaid={markPaid} onDeliver={markDelivered} canDeliver={user.roles.some((role) => ['ADMIN_SUPREMO', 'ADMINISTRADOR', 'CAJA', 'RECEPCION'].includes(role))} />
      break
    case 'Reportes':
      page = <ReportePage vehicles={vehicles} services={services} />
      break
    case 'Aceite':
      page = <AceitePage />
      break
    case 'Usuarios':
      page = <UsuariosPage user={user} />
      break
    default:
      page = <TableroPage vehicles={vehicles} services={services} user={user} onGoToReception={() => setActivePage('Recepción')} />
  }

  return <DashboardLayout activePage={active} allowedPages={allowedPages} user={user} onNavigate={setActivePage} onLogout={onLogout}>{page}</DashboardLayout>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('autospa.authToken')
    if (!token) {
      setCheckingSession(false)
      return
    }
    let mounted = true
    apiRequest('/auth/me')
      .then((currentUser) => { if (mounted) setUser(currentUser) })
      .catch(() => { sessionStorage.removeItem('autospa.authToken') })
      .finally(() => { if (mounted) setCheckingSession(false) })
    return () => { mounted = false }
  }, [])

  const publicTrackingMatch = window.location.pathname.match(/^\/seguimiento\/([0-9a-f-]{36})$/i)
  if (publicTrackingMatch) return <PublicTrackingPage publicCode={publicTrackingMatch[1]} />

  async function login(credentials) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    sessionStorage.setItem('autospa.authToken', result.token)
    setUser(result.user)
  }

  function logout() {
    sessionStorage.removeItem('autospa.authToken')
    setUser(null)
  }

  if (checkingSession) return <main className="session-loading">Verificando acceso…</main>
  if (!user) return <LoginPage onLogin={login} />
  return <AuthenticatedApp key={user.id} user={user} onLogout={logout} />
}
