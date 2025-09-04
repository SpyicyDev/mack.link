import { useState, useCallback, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button, Input } from './ui'

export function CreateLinkForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    shortcode: '',
    url: '',
    description: '',
    redirectType: 301,
    tags: [],
    activatesAt: '',
    expiresAt: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const shortcodeRef = useRef(null)

  useEffect(() => {
    shortcodeRef.current?.focus()
  }, [])

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'shortcode':
        if (!value.trim()) return 'Shortcode is required'
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return 'Shortcode can only contain letters, numbers, hyphens, and underscores'
        }
        if (value.length < 2) return 'Shortcode must be at least 2 characters'
        if (value.length > 50) return 'Shortcode must be less than 50 characters'
        return null
      case 'url':
        if (!value.trim()) return 'URL is required'
        if (!/^https?:\/\/.+/.test(value)) {
          return 'URL must start with http:// or https://'
        }
        try {
          new URL(value)
        } catch {
          return 'Please enter a valid URL'
        }
        return null
      case 'description':
        if (value.length > 200) return 'Description must be less than 200 characters'
        return null
      default:
        return null
    }
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const errors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) errors[key] = error
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      setLoading(true)
      // Normalize datetime-local to ISO 8601 (UTC)
      const toISO = (s) => (s && typeof s === 'string' && s.trim() !== '' ? new Date(s).toISOString() : undefined)
      const payload = {
        shortcode: formData.shortcode,
        url: formData.url,
        description: formData.description,
        redirectType: formData.redirectType,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        activatesAt: toISO(formData.activatesAt),
        expiresAt: toISO(formData.expiresAt),
      }
      await onSubmit(payload)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [formData, onSubmit, validateField])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    const newValue = name === 'redirectType' ? parseInt(value) : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }

    // Real-time validation
    const error = validateField(name, newValue)
    if (error && newValue) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [fieldErrors, validateField])

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm backdrop-saturate-150 overflow-y-auto h-full w-full z-50 transition duration-200 ease-out">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="shortcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Short Code *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-xs">link.mackhaymond.co/</span>
              </div>
              <input
                ref={shortcodeRef}
                type="text"
                name="shortcode"
                id="shortcode"
                value={formData.shortcode}
                onChange={handleChange}
                className="block w-full pl-36 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="abc123"
                required
              />
            </div>
            {fieldErrors.shortcode && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.shortcode}</p>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Destination URL *
            </label>
            <input
              type="url"
              name="url"
              id="url"
              value={formData.url}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              placeholder="https://example.com"
              required
            />
            {fieldErrors.url && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.url}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              placeholder="Optional description"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="redirectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Redirect Type
            </label>
            <select
              name="redirectType"
              id="redirectType"
              value={formData.redirectType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <option value={301}>301 - Permanent</option>
              <option value={302}>302 - Temporary</option>
              <option value={307}>307 - Temporary (preserve method)</option>
              <option value={308}>308 - Permanent (preserve method)</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              id="tags"
              value={formData.tags.join(',')}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              placeholder="personal,work"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activatesAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Activates At (optional)
              </label>
              <input
                type="datetime-local"
                name="activatesAt"
                id="activatesAt"
                value={formData.activatesAt}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                name="expiresAt"
                id="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Hint for date format */}
          <p className="text-xs text-gray-500 dark:text-gray-400">Tip: Leave date fields blank to skip. Your browser may format the datetime; both blank and valid ISO strings are accepted.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}