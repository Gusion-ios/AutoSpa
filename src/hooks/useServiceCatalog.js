import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client.js'

export function useServiceCatalog() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest('/services')
      setServices(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function addService(service) {
    const created = await apiRequest('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    })
    setServices((current) => [...current, created])
    return created
  }

  async function updateServicePrice(id, price) {
    const updated = await apiRequest(`/services/${id}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ price: Number(price) }),
    })
    setServices((current) => current.map((service) => service.id === id ? updated : service))
    return updated
  }

  return { services, loading, error, addService, updateServicePrice, reload }
}
