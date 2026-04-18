export type Priority = 0 | 1 | 2 | 3

export interface List {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  list_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: Priority
  tags: string[]
  completed: boolean
  completed_at: string | null
  recurring: string | null
  created_at: string
  updated_at: string
  list?: List
}

export interface CreateTaskInput {
  title: string
  description?: string
  due_date?: string
  priority?: Priority
  tags?: string[]
  list_id?: string
  recurring?: string
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean
}

export type FilterType = 'today' | 'upcoming' | 'all' | 'list' | 'tag'

export interface Filter {
  type: FilterType
  listId?: string
  tag?: string
}
