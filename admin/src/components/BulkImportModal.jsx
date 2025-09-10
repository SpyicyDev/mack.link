import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import Papa from 'papaparse'
import { linkAPI } from '../services/api'

export function BulkImportModal({ isOpen, onClose }) {
  const [csvText, setCsvText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const parseAndUpload = useCallback(async () => {
    setError(null)
    setResult(null)
    setParsing(true)
    try {
      const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true })
      if (parsed.errors?.length) {
        throw new Error(parsed.errors[0].message)
      }
      const items = parsed.data.map(row => ({
        shortcode: String(row.shortcode || row.Shortcode || '').trim(),
        url: String(row.url || row.URL || '').trim(),
        description: (row.description || row.Description || '').trim(),
        redirectType: row.redirectType ? Number(row.redirectType) : undefined,
        tags: (row.tags || row.Tags || '').split(',').map(s => s.trim()).filter(Boolean),
        archived: String(row.archived || row.Archived || '').toLowerCase() === 'true',
        activatesAt: row.activatesAt || row.ActivatesAt || '',
        expiresAt: row.expiresAt || row.ExpiresAt || '',
      })).filter(i => i.shortcode && i.url)
      if (items.length === 0) throw new Error('No valid rows found. Include columns: shortcode,url[,description,redirectType]')
      const res = await linkAPI.bulkCreateLinks(items)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setParsing(false)
    }
  }, [csvText])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm backdrop-saturate-150 overflow-y-auto h-full w-full z-50 flex items-start sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="mx-auto w-full h-[100svh] sm:h-auto max-w-none sm:max-w-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-lg rounded-none sm:rounded-md bg-white dark:bg-gray-800 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bulk Import from CSV</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Paste CSV with columns: <code>shortcode,url,description,redirectType,tags,archived,activatesAt,expiresAt</code>. Up to 100 rows.</p>
          <textarea
            className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="shortcode,url,description,redirectType\nabc123,https://example.com,Example,301"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          {result && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-800 dark:text-green-300">
              Created: {result.created?.length || 0} • Conflicts: {result.conflicts?.length || 0} • Errors: {result.errors?.length || 0}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-3 sm:py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md">Close</button>
          <button onClick={parseAndUpload} disabled={parsing} className="px-4 py-3 sm:py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
            {parsing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}


