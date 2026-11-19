import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  Droplets,
  LayoutDashboard,
  Package,
  ReceiptText,
  UserRoundPlus,
  UsersRound,
  QrCode,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { ShareDeviceDialog } from '../components/ShareDeviceDialog.jsx'

const navigation = [
  { label: 'Tablero', icon: LayoutDashboard },
  { label: 'Recepción', icon: UserRoundPlus },
  { label: 'Seguimiento', icon: CarFront },
  { label: 'Catálogo', icon: Package },
  { label: 'Caja', icon: CircleDollarSign },
  { label: 'Reportes', icon: BarChart3 },
  { label: 'Aceite', icon: Droplets },
  { label: 'Cobro', icon: ReceiptText },
  { label: 'Usuarios', icon: UsersRound },
]

const roleLabels = {
  ADMIN_SUPREMO: 'Administrador supremo',
  ADMINISTRADOR: 'Administrador',
  RECEPCION: 'Recepción',
  TECNICO: 'Técnico / lavador',
  CAJA: 'Caja',
}

export function DashboardLayout({
                                  activePage,
                                  allowedPages,
                                  user,
                                  onNavigate,
                                  onLogout,
                                  children,
                                }) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
      <div className={`app ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        {mobileMenuOpen && (
          <button
            className="mobile-nav-backdrop"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <aside className="sidebar" id="main-navigation">
          <a
              className="brand"
              href="#tablero"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('Tablero')
              }}
          >
            <span className="brand-mark">A</span>
            <span>
            AutoSpa
            <small>GESTIÓN</small>
          </span>
          </a>

          <p className="menu-label">MENÚ PRINCIPAL</p>

          <nav className="nav-list" aria-label="Menú principal">
            {navigation.filter(({ label }) => allowedPages.includes(label)).map(({ label, icon: Icon }) => (
                <button
                    className={`nav-item ${activePage === label ? 'active' : ''}`}
                    key={label}
                    type="button"
                    onClick={() => {
                      onNavigate(label)
                      setMobileMenuOpen(false)
                    }}
                    aria-current={activePage === label ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <span className="online-dot" />
            Sistema listo
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="page-title">
              <button
                className="mobile-menu-toggle"
                type="button"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                aria-controls="main-navigation"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
              <div>
              <span className="eyebrow">{today}</span>
              <h1>{activePage}</h1>
              </div>
            </div>

            <div className="topbar-actions">
              <button className="share-device-button" type="button" onClick={() => setShowShareDialog(true)}>
                <QrCode size={16} /> Conectar celular
              </button>
              <button
                  className="user-button"
                  type="button"
                  aria-label={`Perfil de ${user.fullName}`}
              >
                <span className="user-avatar">{user.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                <span>{user.fullName}<small className="user-role">{(user.roles ?? []).map((role) => roleLabels[role] ?? role).join(' · ')}</small></span>
              </button>

              <button
                  className="logout-button"
                  type="button"
                  onClick={onLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          {children}
        </main>
        {showShareDialog && <ShareDeviceDialog onClose={() => setShowShareDialog(false)} />}
      </div>
  )
}
