import { useState } from 'react'
import { X } from 'lucide-react'

export function CreateLinkForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    shortcode: '',
    url: '',
    description: '',
    redirectType: 301
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.shortcode.trim() || !formData.url.trim()) {
      setError('Shortcode and URL are required')
      return
    }

    if (!/^https?:\/\/.+/.test(formData.url)) {
      setError('URL must start with http:// or https://')
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.shortcode)) {
      setError('Shortcode can only contain letters, numbers, hyphens, and underscores')
      return
    }

    try {
      setLoading(true)
      await onSubmit(formData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'redirectType' ? parseInt(value) : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="shortcode" className="block text-sm font-medium text-gray-700">
              Short Code *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">link.mackhaymond.co/</span>
              </div>
              <input
                type="text"
                name="shortcode"
                id="shortcode"
                value={formData.shortcode}
                onChange={handleChange}
                className="block w-full pl-36 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="abc123"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              Destination URL *
            </label>
            <input
              type="url"
              name="url"
              id="url"
              value={formData.url}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label htmlFor="redirectType" className="block text-sm font-medium text-gray-700">
              Redirect Type
            </label>
            <select
              name="redirectType"
              id="redirectType"
              value={formData.redirectType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={301}>301 - Permanent</option>
              <option value={302}>302 - Temporary</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}