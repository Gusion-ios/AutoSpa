import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Users, RefreshCw } from 'lucide-react'
import { apiRequest } from '../../api/client.js'

const roleLabels = {
  ADMIN_SUPREMO: 'Administrador supremo',
  ADMINISTRADOR: 'Administrador',
  RECEPCION: 'Recepción',
  TECNICO: 'Técnico / lavador',
  CAJA: 'Caja',
}

const operationalRoles = ['RECEPCION', 'TECNICO', 'CAJA']
const sameRoles = (left = [], right = []) => left.length === right.length && left.every((role) => right.includes(role))

function toggleRole(currentRoles, role) {
  return currentRoles.includes(role)
    ? currentRoles.filter((item) => item !== role)
    : [...currentRoles, role]
}

export function UsuariosPage({ user }) {
  const [users, setUsers] = useState([])
  const [roleDrafts, setRoleDrafts] = useState({})
  const [form, setForm] = useState({ fullName: '', email: '', password: '', roles: ['RECEPCION'] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/users')
      setUsers(Array.isArray(result) ? result : [])
      setRoleDrafts(Object.fromEntries((Array.isArray(result) ? result : []).map((item) => [item.id, item.roles ?? []])))
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar la lista de empleados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function createUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(form) })
      setForm({ fullName: '', email: '', password: '', roles: user.roles.includes('ADMIN_SUPREMO') ? ['ADMINISTRADOR'] : ['RECEPCION'] })
      setNotice('Cuenta de empleado creada.')
      await loadUsers()
    } catch (saveError) {
      setError(saveError.message || 'No se pudo crear la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  async function saveRole(employee) {
    setError('')
    try {
      const updated = await apiRequest(`/users/${employee.id}/role`, {
        method: 'PATCH', body: JSON.stringify({ roles: roleDrafts[employee.id] }),
      })
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`Rol actualizado para ${employee.fullName}.`)
    } catch (saveError) {
      setError(saveError.message || 'No se pudo cambiar el rol.')
      await loadUsers()
    }
  }

  async function toggleActive(employee) {
    setError('')
    try {
      const updated = await apiRequest(`/users/${employee.id}/active`, {
        method: 'PATCH', body: JSON.stringify({ active: !employee.active }),
      })
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(updated.active ? 'Cuenta reactivada.' : 'Cuenta desactivada.')
    } catch (saveError) {
      setError(saveError.message || 'No se pudo actualizar la cuenta.')
    }
  }

  const assignableRoles = user.roles.includes('ADMIN_SUPREMO')
    ? ['ADMINISTRADOR', ...operationalRoles]
    : operationalRoles

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">ACCESO AL SISTEMA</p><h2>Usuarios y roles</h2><p>Crea cuentas individuales y asigna los permisos necesarios para cada puesto.</p></div>
        <div className="intro-count"><Users size={18} /><span><strong>{users.length}</strong> cuentas</span></div>
      </section>

      {error && <div className="api-error" role="alert">{error}</div>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="panel">
        <div className="section-heading"><div className="heading-with-icon"><span className="panel-icon"><UserPlus size={18} /></span><div><p className="eyebrow">NUEVO ACCESO</p><h2>Registrar empleado</h2></div></div></div>
        <form className="reception-form" onSubmit={createUser}>
          <label>Nombre completo<input required maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <label>Correo electrónico<input required type="email" maxLength={180} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Contraseña inicial<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Mínimo 12 caracteres. Entrégala al empleado de forma privada.</small></label>
          <fieldset className="role-fieldset"><legend>Roles (puedes elegir más de uno)</legend><div className="role-options">{assignableRoles.map((role) => <label className="role-option" key={role}><input type="checkbox" checked={form.roles.includes(role)} onChange={() => setForm({ ...form, roles: toggleRole(form.roles, role) })} />{roleLabels[role]}</label>)}</div></fieldset>
          <div className="form-actions"><span className="form-hint">Las cuentas nuevas quedan activas.</span><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</button></div>
        </form>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading"><div><p className="eyebrow">PERSONAL</p><h2>Cuentas registradas</h2></div><button className="text-button" type="button" onClick={loadUsers}><RefreshCw size={15} /> Actualizar</button></div>
        {loading ? <p className="empty-state">Cargando cuentas…</p> : users.length === 0 ? <p className="empty-state">No hay cuentas registradas.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Empleado</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{users.map((employee) => {
              const employeeRoles = employee.roles ?? []
              const draftRoles = roleDrafts[employee.id] ?? employeeRoles
              const protectedAccount = employeeRoles.includes('ADMIN_SUPREMO')
                || employee.email.toLowerCase() === user.email.toLowerCase()
                || (user.roles.includes('ADMINISTRADOR') && employeeRoles.some((role) => !operationalRoles.includes(role)))
              return <tr key={employee.id}>
                <td className="strong-cell">{employee.fullName}</td><td>{employee.email}</td>
                <td>{protectedAccount ? employeeRoles.map((role) => roleLabels[role] ?? role).join(', ') : <div className="role-options">{assignableRoles.map((role) => <label className="role-option" key={role}><input type="checkbox" checked={draftRoles.includes(role)} onChange={() => setRoleDrafts((current) => ({ ...current, [employee.id]: toggleRole(draftRoles, role) }))} />{roleLabels[role]}</label>)}</div>}</td>
                <td>{employee.active ? 'Activa' : 'Desactivada'}</td>
                <td className="user-actions"><button className="small-action" type="button" disabled={protectedAccount || sameRoles(draftRoles, employeeRoles)} onClick={() => saveRole(employee)}>Guardar roles</button><button className="text-button" type="button" disabled={protectedAccount} onClick={() => toggleActive(employee)}>{employee.active ? 'Desactivar' : 'Reactivar'}</button></td>
              </tr>
            })}</tbody>
          </table></div>
        )}
      </section>
    </div>
  )
}
