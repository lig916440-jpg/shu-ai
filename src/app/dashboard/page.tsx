'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatApp from '@/components/dashboard/ChatApp'

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userData, setUserData] = useState<{id:string;email:string}|null>(null)
  const [credits, setCredits] = useState(0)
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }

      const userId = session.user.id
      const userEmail = session.user.email ?? ''
      setUserData({ id: userId, email: userEmail })

      // Get or create profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: userId,
          email: userEmail,
          credits: 0,
          role: 'user',
        })
        setCredits(0)
      } else {
        setCredits(profile.credits ?? 0)
      }

      // Get enabled models
      const { data: modelData } = await supabase
        .from('models')
        .select('id, name, provider, type, price_per_unit')
        .eq('is_enabled', true)
        .eq('type', 'chat')

      setModels(modelData ?? [])
      setReady(true)
    })
  }, [])

  if (!ready || !userData) {
    return (
      <div style={{background:'#0a0d14', color:'#8d93a8', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
        加载中...
      </div>
    )
  }

  return (
    <ChatApp
      user={userData}
      initialCredits={credits}
      models={models}
    />
  )
}
