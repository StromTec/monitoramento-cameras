'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    verificarSessao()
  }, [])

  async function verificarSessao() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Carregando sistema...
        </p>
      </div>
    </main>
  )
}