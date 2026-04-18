'use client'

import { useState } from 'react'
import { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
  completedTasks: Task[]
  activeListId?: string
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const PRIORITY_COLORS = ['', 'text-green-600', 'text-yellow-600', 'text-red-600']
const PRIORITY_LABELS = ['', 'Laag', 'Medium', 'Hoog']

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
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium px-1 py-2 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${completedOpen ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
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
  return (
    <li className={`group flex items-start gap-3 bg-white dark:bg-gray-900 border rounded-xl px-4 py-3 transition-colors ${task.completed ? 'border-gray-100 dark:border-gray-800/50 opacity-60' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
      <button
        onClick={() => onToggleComplete(task)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
        <div className="flex items-start gap-2 flex-wrap">
          <span className={`text-sm font-medium leading-5 ${task.completed ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </span>
          {!task.completed && task.priority > 0 && (
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]} flex-shrink-0`}>
              {'!'.repeat(task.priority)} {PRIORITY_LABELS[task.priority]}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
        )}

        {(task.list || task.tags.length > 0) && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </li>
  )
}
