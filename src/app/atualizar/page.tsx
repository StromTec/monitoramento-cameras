'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Save,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Perfil = 'administrador' | 'operador' | 'visualizador'

type PerfilUsuario = {
  nome: string
  perfil: Perfil
}

export default function AtualizarPage() {
  const router = useRouter()

  const [carregandoPagina, setCarregandoPagina] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null)

  const [data, setData] = useState('')
  const [instaladas, setInstaladas] = useState('')
  const [online, setOnline] = useState('')
  const [offline, setOffline] = useState('')
  const [offlineSemFurto, setOfflineSemFurto] = useState('')
  const [furtadas, setFurtadas] = useState('')
  const [observacao, setObservacao] = useState('')

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    verificarPermissao()
  }, [])

  async function verificarPermissao() {
    try {
      setCarregandoPagina(true)

      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser()

      if (erroUsuario || !user) {
        router.replace('/login')
        return
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from('perfis')
        .select('nome, perfil')
        .eq('id', user.id)
        .single()

      if (erroPerfil || !perfil) {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      if (
        perfil.perfil !== 'administrador' &&
        perfil.perfil !== 'operador'
      ) {
        router.replace('/dashboard')
        return
      }

      setUsuario({
        nome: perfil.nome,
        perfil: perfil.perfil,
      })

      await carregarUltimosDados()
    } catch (error) {
      console.error(error)
      setErro('Não foi possível carregar a página.')
    } finally {
      setCarregandoPagina(false)
    }
  }

  async function carregarUltimosDados() {
    const hoje = new Date().toISOString().split('T')[0]
    setData(hoje)

    const { data: ultimoRegistro, error } = await supabase
      .from('monitoramento_diario')
      .select(
        `
        cameras_instaladas,
        cameras_online,
        cameras_offline,
        cameras_offline_sem_furto,
        cameras_furtadas,
        observacao
        `
      )
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    if (!ultimoRegistro) {
      return
    }

    setInstaladas(String(ultimoRegistro.cameras_instaladas ?? 0))
    setOnline(String(ultimoRegistro.cameras_online ?? 0))
    setOffline(String(ultimoRegistro.cameras_offline ?? 0))
    setOfflineSemFurto(
      String(ultimoRegistro.cameras_offline_sem_furto ?? 0)
    )
    setFurtadas(String(ultimoRegistro.cameras_furtadas ?? 0))
    setObservacao(ultimoRegistro.observacao ?? '')
  }

  const valores = useMemo(() => {
    const total = Number(instaladas)
    const totalOnline = Number(online)
    const totalOffline = Number(offline)
    const semFurto = Number(offlineSemFurto)
    const totalFurtadas = Number(furtadas)

    return {
      instaladas: Number.isFinite(total) ? total : 0,
      online: Number.isFinite(totalOnline) ? totalOnline : 0,
      offline: Number.isFinite(totalOffline) ? totalOffline : 0,
      offlineSemFurto: Number.isFinite(semFurto) ? semFurto : 0,
      furtadas: Number.isFinite(totalFurtadas) ? totalFurtadas : 0,
    }
  }, [instaladas, online, offline, offlineSemFurto, furtadas])

  const statusTotalCorreto =
    valores.online + valores.offline === valores.instaladas

  const statusOfflineCorreto =
    valores.offlineSemFurto + valores.furtadas === valores.offline

  const dadosConsistentes =
    statusTotalCorreto &&
    statusOfflineCorreto &&
    valores.instaladas >= 0 &&
    valores.online >= 0 &&
    valores.offline >= 0 &&
    valores.offlineSemFurto >= 0 &&
    valores.furtadas >= 0

  async function salvar(event: FormEvent) {
    event.preventDefault()

    setErro('')
    setSucesso('')

    if (!data) {
      setErro('Informe a data da atualização.')
      return
    }

    if (
      instaladas === '' ||
      online === '' ||
      offline === '' ||
      offlineSemFurto === '' ||
      furtadas === ''
    ) {
      setErro('Preencha todos os campos numéricos.')
      return
    }

    const campos = [
      valores.instaladas,
      valores.online,
      valores.offline,
      valores.offlineSemFurto,
      valores.furtadas,
    ]

    if (campos.some((valor) => !Number.isInteger(valor))) {
      setErro('Todos os valores precisam ser números inteiros.')
      return
    }

    if (campos.some((valor) => valor < 0)) {
      setErro('Os valores não podem ser negativos.')
      return
    }

    if (!statusTotalCorreto) {
      setErro(
        `Dados inconsistentes: Online (${valores.online}) + Offline geral (${valores.offline}) deve ser igual a Instaladas (${valores.instaladas}).`
      )
      return
    }

    if (!statusOfflineCorreto) {
      setErro(
        `Dados inconsistentes: Sem furto (${valores.offlineSemFurto}) + Furtadas (${valores.furtadas}) deve ser igual ao Offline geral (${valores.offline}).`
      )
      return
    }

    try {
      setSalvando(true)

      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser()

      if (erroUsuario || !user) {
        router.replace('/login')
        return
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from('perfis')
        .select('nome, perfil')
        .eq('id', user.id)
        .single()

      if (erroPerfil || !perfil) {
        setErro('Não foi possível validar sua permissão.')
        return
      }

      if (
        perfil.perfil !== 'administrador' &&
        perfil.perfil !== 'operador'
      ) {
        setErro('Você não possui permissão para atualizar os dados.')
        return
      }

      const { error: erroSalvar } = await supabase
        .from('monitoramento_diario')
        .upsert(
          {
            data,
            cameras_instaladas: valores.instaladas,
            cameras_online: valores.online,
            cameras_offline: valores.offline,
            cameras_offline_sem_furto: valores.offlineSemFurto,
            cameras_furtadas: valores.furtadas,
            observacao: observacao.trim() || null,
          },
          {
            onConflict: 'data',
          }
        )

      if (erroSalvar) {
        console.error(erroSalvar)
        setErro(`Erro ao salvar: ${erroSalvar.message}`)
        return
      }

      setSucesso('Dados atualizados com sucesso.')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (error) {
      console.error(error)
      setErro('Ocorreu um erro inesperado ao salvar os dados.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregandoPagina) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <Camera className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Atualizar monitoramento
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Atualização manual do status geral das câmeras.
                </p>
              </div>
            </div>
          </div>

          {usuario && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <p className="text-sm font-medium text-white">{usuario.nome}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">
                {usuario.perfil}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

          <div>
            <p className="font-medium text-amber-200">Área restrita</p>
            <p className="mt-1 text-sm text-amber-100/70">
              Apenas administradores e operadores podem alterar os números do
              monitoramento.
            </p>
          </div>
        </div>

        <form
          onSubmit={salvar}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Data de referência
              </label>

              <input
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Câmeras instaladas
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={instaladas}
                onChange={(event) => setInstaladas(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Wifi className="h-4 w-4 text-emerald-400" />
                Online
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={online}
                onChange={(event) => setOnline(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <WifiOff className="h-4 w-4 text-red-400" />
                Offline geral
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={offline}
                onChange={(event) => setOffline(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Offline sem furto
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={offlineSemFurto}
                onChange={(event) => setOfflineSemFurto(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Furtadas
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={furtadas}
                onChange={(event) => setFurtadas(event.target.value)}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-rose-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Observação
              </label>

              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                disabled={salvando}
                rows={4}
                placeholder="Informações adicionais sobre esta atualização..."
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <div
              className={`rounded-xl border p-4 ${
                statusTotalCorreto
                  ? 'border-emerald-500/20 bg-emerald-500/10'
                  : 'border-red-500/20 bg-red-500/10'
              }`}
            >
              <div className="flex gap-3">
                {statusTotalCorreto ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                )}

                <div>
                  <p className="text-sm font-semibold">
                    Total do monitoramento
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {valores.online.toLocaleString('pt-BR')} Online +{' '}
                    {valores.offline.toLocaleString('pt-BR')} Offline ={' '}
                    {(valores.online + valores.offline).toLocaleString('pt-BR')}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Instaladas: {valores.instaladas.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                statusOfflineCorreto
                  ? 'border-emerald-500/20 bg-emerald-500/10'
                  : 'border-red-500/20 bg-red-500/10'
              }`}
            >
              <div className="flex gap-3">
                {statusOfflineCorreto ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                )}

                <div>
                  <p className="text-sm font-semibold">
                    Composição do Offline
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {valores.offlineSemFurto.toLocaleString('pt-BR')} Sem furto
                    {' + '}
                    {valores.furtadas.toLocaleString('pt-BR')} Furtadas ={' '}
                    {(
                      valores.offlineSemFurto + valores.furtadas
                    ).toLocaleString('pt-BR')}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Offline geral: {valores.offline.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {erro && (
            <div className="mt-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="mt-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{sucesso}</span>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={salvando}
              className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando || !dadosConsistentes}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar atualização
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}