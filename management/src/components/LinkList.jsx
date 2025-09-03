import { useState, useCallback, useMemo, memo } from 'react'
import { ExternalLink, Edit, Trash2, Copy, BarChart3, Link as LinkIcon } from 'lucide-react'
import { EditLinkModal } from './EditLinkModal'
import { ConfirmationModal } from './ui'

const LinkList = memo(function LinkList({ links, onDelete, onUpdate }) {
  const [editingLink, setEditingLink] = useState(null)
  const [copiedShortcode, setCopiedShortcode] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState(null)

  const linkEntries = useMemo(() => 
    Object.entries(links).sort(([,a], [,b]) => 
      new Date(b.created) - new Date(a.created)
    ), [links]
  )

  const copyToClipboard = useCallback(async (shortcode) => {
    try {
      await navigator.clipboard.writeText(`https://link.mackhaymond.co/${shortcode}`)
      setCopiedShortcode(shortcode)
      setTimeout(() => setCopiedShortcode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const handleDeleteClick = useCallback((shortcode) => {
    setLinkToDelete(shortcode)
    setDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (linkToDelete) {
      onDelete(linkToDelete)
      setLinkToDelete(null)
    }
  }, [linkToDelete, onDelete])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (linkEntries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No links yet</h3>
        <p className="text-gray-600 mb-6">Get started by creating your first short link</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid gap-4">
            {linkEntries.map(([shortcode, link]) => (
              <div key={shortcode} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded">
                        link.mackhaymond.co/{shortcode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(shortcode)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {copiedShortcode === shortcode && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-blue-600 truncate"
                      >
                        {link.url}
                      </a>
                    </div>

                    {link.description && (
                      <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{link.clicks || 0} clicks</span>
                      </div>
                      <span>Created {formatDate(link.created)}</span>
                      {link.updated !== link.created && (
                        <span>Updated {formatDate(link.updated)}</span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {link.redirectType || 301}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingLink({ shortcode, ...link })}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit link"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(shortcode)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onSave={(updates) => {
            onUpdate(editingLink.shortcode, updates)
            setEditingLink(null)
          }}
          onClose={() => setEditingLink(null)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Link"
        message={`Are you sure you want to delete the link "${linkToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  )
})

export { LinkList }