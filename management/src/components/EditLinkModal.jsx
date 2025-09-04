import { useState } from 'react'
import { X } from 'lucide-react'

export function EditLinkModal({ link, onSave, onClose }) {
  const [formData, setFormData] = useState({
    url: link.url || '',
    description: link.description || '',
    redirectType: link.redirectType || 301,
    tags: link.tags || [],
    archived: !!link.archived,
    activatesAt: link.activatesAt || '',
    expiresAt: link.expiresAt || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.url.trim()) {
      setError('URL is required')
      return
    }

    if (!/^https?:\/\/.+/.test(formData.url)) {
      setError('URL must start with http:// or https://')
      return
    }

    try {
      setLoading(true)
      await onSave(formData)
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
    <div className="fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm backdrop-saturate-150 overflow-y-auto h-full w-full z-50 transition duration-200 ease-out">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-300">Short Code</div>
          <div className="font-mono text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mt-1 transition-colors">
            link.mackhaymond.co/{link.shortcode}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={(formData.tags || []).join(',')}
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

          <div className="flex items-center space-x-2">
            <input id="archived" name="archived" type="checkbox" checked={!!formData.archived} onChange={(e) => setFormData(prev => ({ ...prev, archived: e.target.checked }))} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="archived" className="text-sm text-gray-700 dark:text-gray-300">Archived</label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}