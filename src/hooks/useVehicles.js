import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client.js'

function mapVehicle(vehicle) {
  const receivedAt = vehicle.receivedAt ? new Date(vehicle.receivedAt) : null

  return {
    ...vehicle,
    service: Array.isArray(vehicle.services) && vehicle.services.length
      ? vehicle.services.map((item) => item.name).join(', ')
      : vehicle.service,
    total: !Array.isArray(vehicle.services) || vehicle.services.length === 0 || vehicle.total == null
      ? undefined
      : Number(vehicle.total),
    time: receivedAt && !Number.isNaN(receivedAt.getTime())
      ? receivedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      : '',
    visitDate: receivedAt && !Number.isNaN(receivedAt.getTime())
      ? receivedAt.toLocaleDateString('es-PE')
      : '',
  }
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest('/vehicles')
      setVehicles(Array.isArray(result) ? result.map(mapVehicle) : [])
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar los vehículos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function registerVehicle(vehicle) {
    const created = await apiRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    })
    const mapped = mapVehicle(created)
    setVehicles((current) => [mapped, ...current])
    return mapped
  }

  async function updateStatus(id, status) {
    const updated = await apiRequest(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const mapped = mapVehicle(updated)
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? mapped : vehicle))
    return mapped
  }

  async function markPaid(id, paymentMethod = 'Efectivo') {
    const updated = await apiRequest(`/vehicles/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    })
    const mapped = mapVehicle(updated)
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? mapped : vehicle))
    return mapped
  }

  async function markDelivered(id) {
    const updated = await apiRequest(`/vehicles/${id}/delivery`, { method: 'POST' })
    const mapped = mapVehicle(updated)
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? mapped : vehicle))
    return mapped
  }

  return { vehicles, loading, error, reload, registerVehicle, updateStatus, markPaid, markDelivered }
}
