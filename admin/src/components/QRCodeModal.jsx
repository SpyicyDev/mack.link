import { useState, useEffect } from 'react'
import { X, Download, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { shortUrl } from '../services/links'

export function QRCodeModal({ isOpen, onClose, shortcode, url }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const linkUrl = shortUrl(shortcode)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!isOpen || !shortcode) return
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
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [isOpen, shortcode, linkUrl])

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
    <div className="fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm backdrop-saturate-150 overflow-y-auto h-full w-full z-50 transition duration-200 ease-out" onClick={onClose}>
      <div className="relative top-20 mx-auto p-6 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 transition-colors" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            QR Code for {shortcode}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded dark:focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg transition-colors">
                <img 
                  src={qrDataUrl} 
                  alt={`QR code for ${linkUrl}`}
                  className="mx-auto border border-gray-200 dark:border-gray-700 rounded transition-colors"
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 break-all transition-colors">
                <code className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors">
                  {linkUrl}
                </code>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                Points to: <span className="text-gray-700 dark:text-gray-300">{url}</span>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                <button
                  onClick={copyQRCode}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
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