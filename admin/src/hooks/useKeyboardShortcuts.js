import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts(shortcuts = {}) {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when user is typing in form fields
    const activeElement = document.activeElement
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.contentEditable === 'true'
    )

    if (isInputActive && !event.metaKey && !event.ctrlKey) {
      return
    }

    // Build key combination string
    const keys = []
    if (event.ctrlKey || event.metaKey) keys.push('mod')
    if (event.shiftKey) keys.push('shift')
    if (event.altKey) keys.push('alt')
    
    // Handle special keys
    if (event.key === 'Escape') {
      keys.push('escape')
    } else if (event.key === 'Enter') {
      keys.push('enter')
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      keys.push('delete')
    } else if (event.key.length === 1) {
      keys.push(event.key.toLowerCase())
    }

    const combination = keys.join('+')
    
    if (shortcuts[combination]) {
      event.preventDefault()
      shortcuts[combination](event)
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export function useKeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: 'Ctrl/Cmd + N', description: 'Create new link' },
    { keys: 'Ctrl/Cmd + K', description: 'Focus search' },
    { keys: 'Ctrl/Cmd + F', description: 'Focus search (overrides browser Find within app)' },
    { keys: '/', description: 'Focus search (when not in input)' },
    { keys: 'Escape', description: 'Close modal; in search: clear, then blur' },
    { keys: 'Ctrl/Cmd + /', description: 'Show keyboard shortcuts' },
    { keys: 'Shift + ?', description: 'Show keyboard shortcuts' },
    { keys: 'Ctrl/Cmd + 1', description: 'Go to Links' },
    { keys: 'Ctrl/Cmd + 2', description: 'Go to Analytics' },
    { keys: 'Alt + 1', description: 'Go to Links (fallback)' },
    { keys: 'Alt + 2', description: 'Go to Analytics (fallback)' },
  ]

  return shortcuts
}