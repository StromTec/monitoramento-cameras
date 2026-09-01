'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Camera,
  CircleCheck,
  CircleX,
  Save,
  ArrowLeft,
} from 'lucide-react'

export default function AtualizarPage() {
  const router = useRouter()

  const [data, setData] = useState('')
  const [instaladas, setInstaladas] = useState('')
  const [online, setOnline] = useState('')
  const [offline, setOffline] = useState('')
  const [observacao, setObservacao] = useState('')

  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const hoje = new Date()

    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')

    setData(`${ano}-${mes}-${dia}`)

    carregarUltimoRegistro()
  }, [])

  async function carregarUltimoRegistro() {
    const { data, error } = await supabase
      .from('monitoramento_diario')
      .select('*')
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return

    if (data) {
      setInstaladas(String(data.cameras_instaladas))
      setOnline(String(data.cameras_online))
      setOffline(String(data.cameras_offline))
    }
  }

  async function salvar(event: FormEvent) {
    event.preventDefault()

    setErro('')
    setMensagem('')

    const instaladasNumero = Number(instaladas)
    const onlineNumero = Number(online)
    const offlineNumero = Number(offline)

    if (!data) {
      setErro('Informe a data.')
      return
    }

    if (
      Number.isNaN(instaladasNumero) ||
      Number.isNaN(onlineNumero) ||
      Number.isNaN(offlineNumero)
    ) {
      setErro('Informe valores numéricos válidos.')
      return
    }

    if (
      instaladasNumero < 0 ||
      onlineNumero < 0 ||
      offlineNumero < 0
    ) {
      setErro('Os valores não podem ser negativos.')
      return
    }

    if (onlineNumero + offlineNumero !== instaladasNumero) {
      setErro(
        `Online + Offline deve ser igual ao total instalado. Atualmente: ${
          onlineNumero + offlineNumero
        }.`
      )
      return
    }

    setCarregando(true)

    const { error } = await supabase
      .from('monitoramento_diario')
      .upsert(
        {
          data,
          cameras_instaladas: instaladasNumero,
          cameras_online: onlineNumero,
          cameras_offline: offlineNumero,
          observacao: observacao || null,
          atualizado_em: new Date().toISOString(),
        },
        {
          onConflict: 'data',
        }
      )

    setCarregando(false)

    if (error) {
      setErro(`Erro ao salvar: ${error.message}`)
      return
    }

    setMensagem('Atualização salva com sucesso!')

    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  }

  const instaladasNumero = Number(instaladas) || 0
  const onlineNumero = Number(online) || 0
  const offlineNumero = Number(offline) || 0

  const percentualOnline =
    instaladasNumero > 0
      ? (onlineNumero / instaladasNumero) * 100
      : 0

  const percentualOffline =
    instaladasNumero > 0
      ? (offlineNumero / instaladasNumero) * 100
      : 0

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar ao Dashboard
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

          <div className="border-b border-slate-800 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
              Smart City
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Atualizar monitoramento
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Atualize os indicadores operacionais das câmeras.
            </p>
          </div>

          <form onSubmit={salvar} className="p-7">

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Data da atualização
              </label>

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              <CampoNumero
                titulo="Câmeras instaladas"
                valor={instaladas}
                setValor={setInstaladas}
                icone={<Camera size={20} />}
              />

              <CampoNumero
                titulo="Câmeras online"
                valor={online}
                setValor={setOnline}
                icone={<CircleCheck size={20} />}
              />

              <CampoNumero
                titulo="Câmeras offline"
                valor={offline}
                setValor={setOffline}
                icone={<CircleX size={20} />}
              />

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-5">
                <p className="text-sm text-emerald-300">
                  Percentual online
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {percentualOnline.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl border border-red-900 bg-red-950/30 p-5">
                <p className="text-sm text-red-300">
                  Percentual offline
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {percentualOffline.toFixed(2)}%
                </p>
              </div>

            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Observação
              </label>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Atualização realizada após consolidação da produção das equipes."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500"
              />
            </div>

            {erro && (
              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-4 font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              <Save size={20} />

              {carregando
                ? 'Salvando atualização...'
                : 'Salvar atualização'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}

function CampoNumero({
  titulo,
  valor,
  setValor,
  icone,
}: {
  titulo: string
  valor: string
  setValor: (valor: string) => void
  icone: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {titulo}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {icone}
        </div>

        <input
          type="number"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-xl font-semibold text-white outline-none focus:border-sky-500"
        />
      </div>
    </div>
  )
}