import { useState, useEffect, useRef } from 'react'
import { X, Download, Copy } from 'lucide-react'
import QRCode from 'qrcode'

export function QRCodeModal({ isOpen, onClose, shortcode, url }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)

  const linkUrl = `https://link.mackhaymond.co/${shortcode}`

  useEffect(() => {
    if (isOpen && shortcode) {
      generateQRCode()
    }
  }, [isOpen, shortcode])

  const generateQRCode = async () => {
    setLoading(true)
    try {
      const dataUrl = await QRCode.toDataURL(linkUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `qr-${shortcode}.png`
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyQRCode = async () => {
    if (!qrDataUrl) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy QR code:', error)
      // Fallback: copy the URL instead
      try {
        await navigator.clipboard.writeText(linkUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Failed to copy URL:', fallbackError)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            QR Code for {shortcode}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close QR code modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <img 
                  src={qrDataUrl} 
                  alt={`QR code for ${linkUrl}`}
                  className="mx-auto border border-gray-200 rounded"
                />
              </div>
              
              <div className="text-sm text-gray-600 break-all">
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {linkUrl}
                </code>
              </div>

              <div className="text-xs text-gray-500">
                Points to: <span className="text-gray-700">{url}</span>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                <button
                  onClick={copyQRCode}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadQRCode}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-red-600 p-4">
              Failed to generate QR code. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}