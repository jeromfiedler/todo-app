import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: tasks }, { data: lists }] = await Promise.all([
    supabase.from('tasks').select('*, list:lists(*)').order('created_at', { ascending: false }),
    supabase.from('lists').select('*').order('name'),
  ])

  return <Dashboard initialTasks={tasks ?? []} initialLists={lists ?? []} user={user} />
}
