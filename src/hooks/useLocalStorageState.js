import { useEffect, useState } from 'react'

function readStoredValue(key, initialValue) {
    try {
        const storedValue = window.localStorage.getItem(key)
        return storedValue === null ? initialValue : JSON.parse(storedValue)
    } catch {
        return initialValue
    }
}

export function useLocalStorageState(key, initialValue) {
    const [value, setValue] = useState(() => readStoredValue(key, initialValue))

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // La app sigue funcionando aunque el navegador no pueda guardar datos.
        }
    }, [key, value])

    return [value, setValue]
}