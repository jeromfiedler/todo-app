'use client'

import { useState } from 'react'
import { Filter, List } from '@/lib/types'
import { useTheme } from './ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface Props {
  filter: Filter
  setFilter: (f: Filter) => void
  lists: List[]
  allTags: string[]
  todayCount: number
  completedCount: number
  onSaveList: (name: string, color: string, listId?: string) => Promise<void>
  onDeleteList: (id: string) => Promise<void>
  user: User
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280']

export default function Sidebar({ filter, setFilter, lists, allTags, todayCount, onSaveList, onDeleteList, user }: Props) {
  const { theme, toggle } = useTheme()
  const [showListForm, setShowListForm] = useState(false)
  const [listName, setListName] = useState('')
  const [listColor, setListColor] = useState(COLORS[0])
  const [editingList, setEditingList] = useState<List | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function openListForm(list?: List) {
    if (list) {
      setEditingList(list)
      setListName(list.name)
      setListColor(list.color)
    } else {
      setEditingList(null)
      setListName('')
      setListColor(COLORS[0])
    }
    setShowListForm(true)
  }

  async function handleSaveList(e: React.FormEvent) {
    e.preventDefault()
    if (!listName.trim()) return
    await onSaveList(listName.trim(), listColor, editingList?.id)
    setShowListForm(false)
  }

  const isActive = (f: Filter) => {
    if (f.type !== filter.type) return false
    if (f.type === 'list') return f.listId === filter.listId
    if (f.type === 'tag') return f.tag === filter.tag
    return true
  }

  const navItem = (label: string, f: Filter, icon: React.ReactNode, badge?: number) => (
    <button
      onClick={() => setFilter(f)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(f) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{badge}</span>
      )}
    </button>
  )

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">✓</span>
          <span className="font-semibold">Todo App</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="pt-1 pb-1">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lijsten</span>
            <button onClick={() => openListForm()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {lists.map(list => (
            <div key={list.id} className="group flex items-center">
              <button
                onClick={() => setFilter({ type: 'list', listId: list.id })}
                className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive({ type: 'list', listId: list.id }) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                <span className="flex-1 text-left truncate">{list.name}</span>
              </button>
              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 pr-1">
                <button onClick={() => openListForm(list)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => onDeleteList(list.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="pt-2 pb-1">
            <div className="px-3 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            {allTags.map(tag => (
              navItem(`#${tag}`, { type: 'tag', tag }, <TagIcon />, undefined)
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <button onClick={toggle} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Licht' : 'Donker'}
        </button>
        <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          Uitloggen
        </button>
      </div>

      {showListForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveList} className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 w-full max-w-xs space-y-4">
            <h3 className="font-semibold">{editingList ? 'Lijst bewerken' : 'Nieuwe lijst'}</h3>
            <input
              autoFocus
              value={listName}
              onChange={e => setListName(e.target.value)}
              placeholder="Naam"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setListColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${listColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowListForm(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                Annuleren
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium">
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function TodayIcon() {
  return <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function UpcomingIcon() {
  return <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function AllIcon() {
  return <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
}
function TagIcon() {
  return <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
}
