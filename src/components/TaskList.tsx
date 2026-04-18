'use client'

import { useState, useRef } from 'react'
import { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
  completedTasks: Task[]
  activeListId?: string
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const PRIORITY_PILL = [
  null,
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Laag' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'Medium' },
  { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Hoog' },
]

// Width of the swipe-delete button in px (matches w-20 = 80px)
const DELETE_WIDTH = 80

export default function TaskList({ tasks, completedTasks, activeListId, onToggleComplete, onEdit, onDelete }: Props) {
  const [completedOpen, setCompletedOpen] = useState(false)

  if (tasks.length === 0 && completedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-sm">Geen taken</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-1.5">
      <ul className="space-y-1.5">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} hideListId={activeListId} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>

      {completedTasks.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setCompletedOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium px-1 py-2"
          >
            <svg className={`w-4 h-4 transition-transform ${completedOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Afgerond ({completedTasks.length})
          </button>

          {completedOpen && (
            <ul className="space-y-1.5 mt-1">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} hideListId={activeListId} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function TaskItem({ task, hideListId, onToggleComplete, onEdit, onDelete }: {
  task: Task
  hideListId?: string
  onToggleComplete: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)
  const lockAxis = useRef<'h' | 'v' | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    dragging.current = true
    lockAxis.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!lockAxis.current) {
      if (Math.abs(dx) > Math.abs(dy)) lockAxis.current = 'h'
      else { lockAxis.current = 'v'; dragging.current = false; return }
    }
    if (lockAxis.current !== 'h') return

    e.preventDefault()
    const next = Math.min(0, Math.max(swipeX + dx - (swipeX === 0 ? 0 : dx), dx < 0 ? dx : 0))
    // track from origin, clamped
    const raw = e.touches[0].clientX - startX.current
    setSwipeX(Math.max(-DELETE_WIDTH, Math.min(0, raw)))
  }

  function onTouchEnd() {
    dragging.current = false
    lockAxis.current = null
    setSwipeX(prev => prev < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0)
  }

  function handleTap(action: () => void) {
    if (swipeX < 0) { setSwipeX(0); return }
    action()
  }

  const p = task.priority > 0 ? PRIORITY_PILL[task.priority] : null

  return (
    // overflow-hidden + rounded on the outer li — this IS the clipping container
    <li className={`overflow-hidden rounded-xl border ${task.completed ? 'border-gray-100 dark:border-gray-800/50 opacity-60' : 'border-gray-200 dark:border-gray-800'}`}>
      {/*
        Inline flex: [content (min-w-full)] [delete button (80px)]
        Total row width = container + 80px
        translateX(0)   → content visible, delete hidden (clipped right)
        translateX(-80) → content shifts left 80px, delete fully visible
      */}
      <div
        className="flex"
        style={{ transform: `translateX(${swipeX}px)`, transition: dragging.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Main content — min-w-full keeps it exactly as wide as the <li> */}
        <div className="min-w-full flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3">
          <button
            onClick={() => handleTap(() => onToggleComplete(task))}
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
          >
            {task.completed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleTap(() => onEdit(task))}>
            <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </span>
            {(task.list || task.tags.length > 0) && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {task.list && task.list.id !== hideListId && (
                  <span className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.list.color }} />
                    {task.list.name}
                  </span>
                )}
                {task.tags.map(tag => (
                  <span key={tag} className="text-xs text-blue-600 dark:text-blue-400">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Priority pill — right-aligned, fixed width */}
          {p && !task.completed && (
            <span className={`flex-shrink-0 w-16 text-center text-xs font-medium py-0.5 rounded-full ${p.bg} ${p.text}`}>
              {p.label}
            </span>
          )}
        </div>

        {/* Delete button — inline after content, revealed by sliding */}
        <button
          onClick={() => onDelete(task.id)}
          style={{ width: DELETE_WIDTH, minWidth: DELETE_WIDTH }}
          className="flex-shrink-0 bg-red-500 flex flex-col items-center justify-center gap-1 text-white"
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
