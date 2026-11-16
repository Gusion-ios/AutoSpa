const API_BASE_URL =
    import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export class ApiError extends Error {
    constructor(message, status) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

export async function apiRequest(path, options = {}) {
    const baseUrl = API_BASE_URL.replace(/\/$/, '')
    const endpoint = path.startsWith('/') ? path : `/${path}`
    const token = sessionStorage.getItem('autospa.authToken')

    let response

    try {
        response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Accept: 'application/json',
                ...(token && !endpoint.endsWith('/auth/login')
                    ? { Authorization: `Bearer ${token}` }
                    : {}),
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers,
            },
        })
    } catch {
        throw new Error(
            'No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.',
        )
    }

    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

    if (!response.ok) {
        const message =
            typeof body === 'object' && body !== null && 'message' in body
                ? body.message
                : typeof body === 'object' && body !== null && ('detail' in body || 'error' in body)
                    ? body.detail ?? body.error
                : `Error del servidor (${response.status}).`

        throw new ApiError(message, response.status)
    }

    return body
}
