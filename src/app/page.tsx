'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('Testando conexão...')

  useEffect(() => {
    async function testarSupabase() {
      const { error } = await supabase
        .from('monitoramento_diario')
        .select('*')
        .limit(1)

      if (error) {
        setStatus(`Erro: ${error.message}`)
        return
      }

      setStatus('Supabase conectado com sucesso!')
    }

    testarSupabase()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 shadow-xl">
        <h1 className="mb-4 text-3xl font-bold text-white">
          Monitoramento de Câmeras
        </h1>

        <p className="text-lg text-slate-300">
          {status}
        </p>
      </div>
    </main>
  )
}