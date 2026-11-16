import { useState } from 'react'
import { ArrowRight, Droplets, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import './LoginPage.css'

export function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    async function submit(event) {
        event.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await onLogin({ email: email.trim().toLowerCase(), password })
        } catch (loginError) {
            setError(loginError.message || 'No se pudo iniciar sesión.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="login-page">
            <section className="login-brand-panel">
                <a className="login-brand" href="/" onClick={(event) => event.preventDefault()}>
                    <span className="login-brand-mark"><Droplets size={23} /></span>
                    <span>AutoSpa<small>GESTIÓN</small></span>
                </a>

                <div className="login-message">
                    <span className="login-kicker">GESTIÓN INTELIGENTE</span>
                    <h1>Todo tu taller,<br />en un solo lugar.</h1>
                    <p>Organiza los servicios, acompaña cada vehículo y mantén el día bajo control.</p>
                </div>

                <span className="login-footer">AUTO SPA · PANEL DE ADMINISTRACIÓN</span>
            </section>

            <section className="login-form-panel">
                <form className="login-form" onSubmit={submit}>
                    <div className="login-mobile-brand">
                        <span className="login-brand-mark"><Droplets size={22} /></span>
                        <strong>AutoSpa</strong>
                    </div>

                    <span className="login-kicker">BIENVENIDO DE NUEVO</span>
                    <h2>Inicia sesión</h2>
                    <p className="login-subtitle">Ingresa tus datos para acceder al panel.</p>

                    <label className="login-label">
                        Correo electrónico
                        <span className="login-input-wrap">
              <Mail size={17} />
              <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                  }}
                  placeholder="nombre@autospa.com"
                  autoComplete="username"
                  required
              />
            </span>
                    </label>

                    <label className="login-label">
                        Contraseña
                        <span className="login-input-wrap">
              <LockKeyhole size={17} />
              <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                  }}
                  placeholder="Escribe tu contraseña"
                  autoComplete="current-password"
                  required
              />
              <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
                    </label>

                    {error && <p className="login-error" role="alert">{error}</p>}

                    <button className="login-submit" type="submit" disabled={submitting}>
                        {submitting ? 'Verificando…' : 'Entrar al panel'} <ArrowRight size={17} />
                    </button>

                    <div className="demo-credentials">
                        <span>Acceso para personal autorizado.</span>
                    </div>
                </form>
            </section>
        </main>
    )
}
