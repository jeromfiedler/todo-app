'use client'

import { useState, useMemo, useRef } from 'react'
import { Task, List, Filter } from '@/lib/types'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import TaskForm from './TaskForm'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { isToday, isFuture, parseISO } from 'date-fns'

interface Props {
  initialTasks: Task[]
  initialLists: List[]
  user: User
}

function applyFilter(task: Task, filter: Filter): boolean {
  switch (filter.type) {
    case 'today':
      return task.due_date ? isToday(parseISO(task.due_date)) : false
    case 'upcoming':
      return task.due_date ? isFuture(parseISO(task.due_date)) : false
    case 'all':
      return true
    case 'list':
      return task.list_id === filter.listId
    case 'tag':
      return task.tags.includes(filter.tag ?? '')
    default:
      return true
  }
}

export default function Dashboard({ initialTasks, initialLists, user }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [lists, setLists] = useState<List[]>(initialLists)
  const [filter, setFilter] = useState<Filter>({ type: 'all' })
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const edgeSwipeStartX = useRef<number | null>(null)

  const supabase = createClient()

  function handleMainTouchStart(e: React.TouchEvent) {
    const x = e.touches[0].clientX
    if (x < 30) edgeSwipeStartX.current = x
  }

  function handleMainTouchEnd(e: React.TouchEvent) {
    if (edgeSwipeStartX.current === null) return
    const x = e.changedTouches[0].clientX
    if (x - edgeSwipeStartX.current > 60) setSidebarOpen(true)
    edgeSwipeStartX.current = null
  }

  const activeTasks = useMemo(() =>
    tasks
      .filter(t => !t.completed && applyFilter(t, filter))
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return 0
      }),
    [tasks, filter]
  )

  const completedTasks = useMemo(() =>
    tasks
      .filter(t => t.completed && applyFilter(t, filter))
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')),
    [tasks, filter]
  )

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    tasks.forEach(t => t.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [tasks])

  async function handleSaveTask(data: Partial<Task>) {
    if (editingTask) {
      const { data: updated } = await supabase
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingTask.id)
        .select('*, list:lists(*)')
        .single()
      if (updated) setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } else {
      const { data: created } = await supabase
        .from('tasks')
        .insert({ ...data, user_id: user.id })
        .select('*, list:lists(*)')
        .single()
      if (created) setTasks(prev => [created, ...prev])
    }
    setShowForm(false)
    setEditingTask(null)
  }

  async function handleToggleComplete(task: Task) {
    const completed = !task.completed
    const { data: updated } = await supabase
      .from('tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', task.id)
      .select('*, list:lists(*)')
      .single()
    if (updated) setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  async function handleDeleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleSaveList(name: string, color: string, listId?: string) {
    if (listId) {
      const { data } = await supabase.from('lists').update({ name, color }).eq('id', listId).select().single()
      if (data) setLists(prev => prev.map(l => l.id === data.id ? data : l))
    } else {
      const { data } = await supabase.from('lists').insert({ name, color, user_id: user.id }).select().single()
      if (data) setLists(prev => [...prev, data])
    }
  }

  async function handleDeleteList(id: string) {
    await supabase.from('lists').delete().eq('id', id)
    setLists(prev => prev.filter(l => l.id !== id))
    setTasks(prev => prev.map(t => t.list_id === id ? { ...t, list_id: null, list: undefined } : t))
    if (filter.type === 'list' && filter.listId === id) setFilter({ type: 'all' })
  }

  function filterTitle() {
    switch (filter.type) {
      case 'today': return 'Vandaag'
      case 'upcoming': return 'Aankomend'
      case 'all': return 'Alle taken'
      case 'list': return lists.find(l => l.id === filter.listId)?.name ?? 'Lijst'
      case 'tag': return `#${filter.tag}`
    }
  }

  const defaultListId = filter.type === 'list' ? filter.listId : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar
          filter={filter}
          setFilter={f => { setFilter(f); setSidebarOpen(false) }}
          lists={lists}
          allTags={allTags}
          todayCount={0}
          completedCount={completedTasks.length}
          onSaveList={handleSaveList}
          onDeleteList={handleDeleteList}
          user={user}
        />
      </aside>

      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        onTouchStart={handleMainTouchStart}
        onTouchEnd={handleMainTouchEnd}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold flex-1">{filterTitle()}</h1>
          <button
            onClick={() => { setEditingTask(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Taak
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <TaskList
            tasks={activeTasks}
            completedTasks={completedTasks}
            activeListId={filter.type === 'list' ? filter.listId : undefined}
            onToggleComplete={handleToggleComplete}
            onEdit={task => { setEditingTask(task); setShowForm(true) }}
            onDelete={handleDeleteTask}
          />
        </div>
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          defaultListId={defaultListId}
          lists={lists}
          allTags={allTags}
          onSave={handleSaveTask}
          onClose={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
