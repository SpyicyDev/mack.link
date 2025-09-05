import { useState, useMemo } from 'react'
import { useProfile, useUpdateProfile, useProfileLinks, useCreateProfileLink, useDeleteProfileLink, useReorderProfileLinks } from '../hooks/useProfile'
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react'

export default function ProfileTab() {
  const { data: profile = {} } = useProfile()
  const updateProfile = useUpdateProfile()

  const { data: links = [] } = useProfileLinks()
  const createLink = useCreateProfileLink()
  const deleteLink = useDeleteProfileLink()
  const reorderLinks = useReorderProfileLinks()

  const [form, setForm] = useState({
    title: profile.title || '',
    description: profile.description || '',
    avatar_url: profile.avatar_url || '',
    background_type: profile.background_type || 'gradient',
    background_value: profile.background_value || 'blue-purple',
    custom_css: profile.custom_css || '',
  })

  // keep form in sync when profile loads
  useMemo(() => {
    setForm({
      title: profile.title || '',
      description: profile.description || '',
      avatar_url: profile.avatar_url || '',
      background_type: profile.background_type || 'gradient',
      background_value: profile.background_value || 'blue-purple',
      custom_css: profile.custom_css || '',
    })
  }, [profile])

  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '' })

  const onSaveProfile = async () => {
    await updateProfile.mutateAsync(form)
  }

  const onAddLink = async () => {
    if (!newLink.title || !newLink.url) return
    await createLink.mutateAsync({ title: newLink.title, url: newLink.url, icon: newLink.icon })
    setNewLink({ title: '', url: '', icon: '' })
  }

  const move = async (index, dir) => {
    const next = [...links]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    const tmp = next[index]
    next[index] = next[j]
    next[j] = tmp
    await reorderLinks.mutateAsync(next.map((l) => l.id))
  }

  return (
    <div className="space-y-8">
      {/* Profile form */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          <button onClick={onSaveProfile} className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            <Save className="w-4 h-4 mr-1" /> Save
          </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Title</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Avatar URL</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">Description</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Background Type</label>
            <select className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.background_type} onChange={(e) => setForm({ ...form, background_type: e.target.value })}>
              <option value="gradient">Gradient</option>
              <option value="solid">Solid</option>
              <option value="image">Image</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Background Value</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.background_value} onChange={(e) => setForm({ ...form, background_value: e.target.value })} placeholder="blue-purple | #000 | https://image" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">Custom CSS (optional)</label>
            <textarea rows={4} className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.custom_css} onChange={(e) => setForm({ ...form, custom_css: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Links manager */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Links</h2>
        </header>

        {/* Add new link */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" placeholder="Title" value={newLink.title} onChange={(e) => setNewLink({ ...newLink, title: e.target.value })} />
          <input className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" placeholder="https://url" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" placeholder="icon (optional)" value={newLink.icon} onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })} />
            <button onClick={onAddLink} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center">
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
        </div>

        {/* Links list */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {links.map((l, i) => (
            <li key={l.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{l.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{l.url}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(i, -1)} className="p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" title="Move up"><ArrowUp className="w-4 h-4"/></button>
                <button onClick={() => move(i, 1)} className="p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" title="Move down"><ArrowDown className="w-4 h-4"/></button>
                <button onClick={() => deleteLink.mutate(l.id)} className="p-2 rounded border border-red-300 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4"/></button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

