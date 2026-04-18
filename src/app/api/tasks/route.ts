import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function authenticateRequest(req: NextRequest): { userId: string } | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  // n8n uses the service role key directly as a Bearer token
  if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  // For n8n calls we need user_id from query or body
  return { userId: '' }
}

// GET /api/tasks
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { searchParams } = new URL(req.url)
  const listId = searchParams.get('list_id')
  const completed = searchParams.get('completed')
  const dueBefore = searchParams.get('due_before')
  const userId = searchParams.get('user_id')

  let query = supabase.from('tasks').select('*, list:lists(*)')

  if (userId) query = query.eq('user_id', userId)
  if (listId) query = query.eq('list_id', listId)
  if (completed !== null) query = query.eq('completed', completed === 'true')
  if (dueBefore) query = query.lte('due_date', new Date(dueBefore).toISOString())

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { user_id, title, description, due_date, priority = 0, tags = [], list_id, recurring } = body

  if (!user_id || !title) {
    return NextResponse.json({ error: 'user_id en title zijn verplicht' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id, title, description, due_date, priority, tags, list_id, recurring })
    .select('*, list:lists(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
