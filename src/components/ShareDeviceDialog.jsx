import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const shareUrl = import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin
const shareUsesHttps = new URL(shareUrl, window.location.origin).protocol === 'https:'

export function ShareDeviceDialog({ onClose }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="share-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
        <button className="share-close" type="button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        <p className="eyebrow">{shareUsesHttps ? 'ACCESO WEB SEGURO' : 'ACCESO EN RED LOCAL'}</p>
        <h2 id="share-dialog-title">Conectar celular</h2>
        <p>Escanea este código con la cámara del celular para abrir AutoSpa.</p>
        <div className="share-qr"><QRCodeSVG value={shareUrl} size={220} level="M" includeMargin /></div>
        <code className="share-url">{shareUrl}</code>
        <button className="primary-button share-copy" type="button" onClick={copyLink}><Copy size={15} />{copied ? 'Enlace copiado' : 'Copiar enlace'}</button>
        <small>{shareUsesHttps
          ? 'El enlace está disponible desde cualquier conexión a Internet.'
          : 'El celular debe estar conectado a la misma Wi‑Fi. Mantén el frontend y el backend abiertos en este PC.'}</small>
      </section>
    </div>
  )
}
