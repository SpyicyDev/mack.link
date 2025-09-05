import { X } from 'lucide-react'
import { useKeyboardShortcutsHelp } from '../../hooks/useKeyboardShortcuts'

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = useKeyboardShortcutsHelp()
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/40 backdrop-blur-sm overflow-y-auto z-50 flex items-start sm:items-center justify-center p-4" onClick={onClose}>
      <div className="mx-auto w-full max-w-lg sm:max-w-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="kbd-help-title">
        <div className="flex items-center justify-between mb-4">
          <h3 id="kbd-help-title" className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close keyboard shortcuts help">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-start justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
              <div className="text-sm text-gray-800 dark:text-gray-200">{s.description}</div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 ml-3 whitespace-nowrap">{s.keys}</div>
            </div>
          ))}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Press Esc to close</div>
        </div>
      </div>
    </div>
  )
}
