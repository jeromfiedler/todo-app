'use client'

import { useState, useRef } from 'react'
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
const DELETE_WIDTH = 80

export default function Sidebar({ filter, setFilter, lists, allTags, onSaveList, onDeleteList, user }: Props) {
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

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">✓</span>
          <span className="font-semibold">Todo App</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2 mt-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lijsten</span>
          <button onClick={() => openListForm()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <ul className="space-y-0.5">
          {lists.map(list => (
            <ListItem
              key={list.id}
              list={list}
              active={isActive({ type: 'list', listId: list.id })}
              onSelect={() => setFilter({ type: 'list', listId: list.id })}
              onEdit={() => openListForm(list)}
              onDelete={() => onDeleteList(list.id)}
            />
          ))}
        </ul>

        {allTags.length > 0 && (
          <div className="mt-4">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilter({ type: 'tag', tag })}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive({ type: 'tag', tag }) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <TagIcon />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <button onClick={toggle} className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400">
          {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Licht' : 'Donker'}
        </button>
        <button onClick={handleLogout} className="px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400">
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
              <button type="button" onClick={() => setShowListForm(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">
                Annuleren
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium">
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ListItem({ list, active, onSelect, onEdit, onDelete }: {
  list: List
  active: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const dragging = useRef(false)
  const lockAxis = useRef<'h' | 'v' | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didSwipe = useRef(false)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    dragging.current = true
    lockAxis.current = null
    didSwipe.current = false
    holdTimer.current = setTimeout(() => {
      if (!didSwipe.current) { setSwipeX(0); onEdit() }
    }, 500)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - (e.touches[0].clientY) // can't track dy without startY, use abs heuristic

    if (!lockAxis.current) {
      if (Math.abs(dx) > 6) {
        lockAxis.current = 'h'
        if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
      } else return
    }

    if (dx < 0) {
      didSwipe.current = true
      e.preventDefault()
      setSwipeX(Math.max(-DELETE_WIDTH, dx))
    } else if (swipeX < 0) {
      setSwipeX(Math.min(0, swipeX - (startX.current - e.touches[0].clientX)))
      setSwipeX(Math.min(0, dx))
    }
  }

  function onTouchEnd() {
    dragging.current = false
    lockAxis.current = null
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    setSwipeX(prev => prev < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0)
  }

  return (
    <li className="overflow-hidden rounded-xl">
      <div
        className="flex"
        style={{ transform: `translateX(${swipeX}px)`, transition: dragging.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* List button — min-w-full covers the delete button when not swiped */}
        <button
          onClick={() => { if (swipeX < 0) { setSwipeX(0); return } onSelect() }}
          className={`min-w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
          <span className="flex-1 text-left truncate">{list.name}</span>
        </button>

        {/* Delete button — revealed on swipe */}
        <button
          onClick={onDelete}
          style={{ width: DELETE_WIDTH, minWidth: DELETE_WIDTH }}
          className="flex-shrink-0 bg-red-500 flex flex-col items-center justify-center gap-1 text-white rounded-r-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-xs font-medium">Verwijder</span>
        </button>
      </div>
    </li>
  )
}

function TagIcon() {
  return <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
}
