import { BarChart3, CarFront, CircleDollarSign, ClipboardList, LayoutDashboard, Package, UserRoundPlus } from 'lucide-react'

const navigation = [
  { label: 'Tablero', icon: LayoutDashboard },
  { label: 'Recepción', icon: UserRoundPlus },
  { label: 'Seguimiento', icon: CarFront },
  { label: 'Catálogo', icon: Package },
  { label: 'Caja', icon: CircleDollarSign },
  { label: 'Reportes', icon: BarChart3 },
]

export function DashboardLayout({ activePage, onNavigate, children }) {
  const today = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#tablero" onClick={(event) => { event.preventDefault(); onNavigate('Tablero') }}>
          <span className="brand-mark">A</span>
          <span>AutoSpa<small>GESTIÓN</small></span>
        </a>

        <p className="menu-label">MENÚ PRINCIPAL</p>
        <nav className="nav-list" aria-label="Menú principal">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${activePage === label ? 'active' : ''}`}
              key={label}
              type="button"
              onClick={() => onNavigate(label)}
              aria-current={activePage === label ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom"><span className="online-dot" />Sistema listo</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">{today}</span>
            <h1>{activePage}</h1>
          </div>
          <button className="user-button" type="button" aria-label="Perfil de Franco">
            <span className="user-avatar">FG</span><span>Franco</span>
          </button>
        </header>
        {children}
      </main>
    </div>
  )
}
