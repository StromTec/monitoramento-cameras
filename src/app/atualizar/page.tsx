'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import {
  ArrowLeft,
  Camera,
  CircleCheck,
  CircleX,
  Save,
  ShieldAlert,
} from 'lucide-react'

export default function AtualizarPage() {
  const router = useRouter()

  const [carregando, setCarregando] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [erro, setErro] =
    useState('')

  const [sucesso, setSucesso] =
    useState('')

  const [nomeUsuario, setNomeUsuario] =
    useState('')

  const [perfil, setPerfil] =
    useState('')

  const [data, setData] =
    useState('')

  const [
    camerasInstaladas,
    setCamerasInstaladas,
  ] = useState('')

  const [
    camerasOnline,
    setCamerasOnline,
  ] = useState('')

  const [
    camerasOffline,
    setCamerasOffline,
  ] = useState('')

  const [
    observacao,
    setObservacao,
  ] = useState('')

  useEffect(() => {
    verificarPermissao()
  }, [])

  async function verificarPermissao() {
    setCarregando(true)
    setErro('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.replace('/login')
      return
    }

    const {
      data: perfilUsuario,
      error: perfilError,
    } = await supabase
      .from('perfis')
      .select('nome, perfil')
      .eq('id', user.id)
      .single()

    if (
      perfilError ||
      !perfilUsuario
    ) {
      console.error(perfilError)

      await supabase.auth.signOut()

      router.replace('/login')

      return
    }

    const perfilAtual =
      perfilUsuario.perfil

    const autorizado =
      perfilAtual ===
        'administrador' ||
      perfilAtual ===
        'operador'

    if (!autorizado) {
      router.replace('/dashboard')
      return
    }

    setNomeUsuario(
      perfilUsuario.nome
    )

    setPerfil(
      perfilAtual
    )

    await carregarUltimosDados()
  }

  async function carregarUltimosDados() {
    const {
      data: ultimoRegistro,
      error,
    } = await supabase
      .from('monitoramento_diario')
      .select(
        `
          cameras_instaladas,
          cameras_online,
          cameras_offline
        `
      )
      .order('data', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)

      setErro(
        `Erro ao carregar os dados atuais: ${error.message}`
      )

      setCarregando(false)

      return
    }

    if (ultimoRegistro) {
      setCamerasInstaladas(
        String(
          ultimoRegistro.cameras_instaladas
        )
      )

      setCamerasOnline(
        String(
          ultimoRegistro.cameras_online
        )
      )

      setCamerasOffline(
        String(
          ultimoRegistro.cameras_offline
        )
      )
    }

    const hoje =
      new Date()

    const ano =
      hoje.getFullYear()

    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(2, '0')

    const dia =
      String(
        hoje.getDate()
      ).padStart(2, '0')

    setData(
      `${ano}-${mes}-${dia}`
    )

    setCarregando(false)
  }

  async function salvar(
    event: FormEvent
  ) {
    event.preventDefault()

    setErro('')
    setSucesso('')

    const instaladas =
      Number(camerasInstaladas)

    const online =
      Number(camerasOnline)

    const offline =
      Number(camerasOffline)

    if (!data) {
      setErro(
        'Informe a data da atualização.'
      )
      return
    }

    if (
      !Number.isInteger(
        instaladas
      ) ||
      !Number.isInteger(online) ||
      !Number.isInteger(offline)
    ) {
      setErro(
        'Os valores das câmeras devem ser números inteiros.'
      )
      return
    }

    if (
      instaladas < 0 ||
      online < 0 ||
      offline < 0
    ) {
      setErro(
        'Os valores não podem ser negativos.'
      )
      return
    }

    if (
      online + offline !==
      instaladas
    ) {
      setErro(
        `A soma de Online (${online}) + Offline (${offline}) deve ser igual ao total de câmeras instaladas (${instaladas}).`
      )
      return
    }

    setSalvando(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !user
    ) {
      setSalvando(false)

      router.replace('/login')

      return
    }

    /*
      Conferimos novamente o perfil
      antes de gravar.

      A segurança principal continua
      sendo o RLS do Supabase.
    */
    const {
      data: perfilAtual,
      error: perfilError,
    } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', user.id)
      .single()

    if (
      perfilError ||
      !perfilAtual
    ) {
      setSalvando(false)

      setErro(
        'Não foi possível validar sua permissão.'
      )

      return
    }

    if (
      perfilAtual.perfil !==
        'administrador' &&
      perfilAtual.perfil !==
        'operador'
    ) {
      setSalvando(false)

      setErro(
        'Você não possui permissão para atualizar os dados.'
      )

      router.replace('/dashboard')

      return
    }

    const {
      error: salvarError,
    } = await supabase
      .from(
        'monitoramento_diario'
      )
      .upsert(
        {
          data,
          cameras_instaladas:
            instaladas,
          cameras_online:
            online,
          cameras_offline:
            offline,
          observacao:
            observacao.trim() ||
            null,
        },
        {
          onConflict: 'data',
        }
      )

    if (salvarError) {
      console.error(
        salvarError
      )

      setErro(
        `Erro ao salvar atualização: ${salvarError.message}`
      )

      setSalvando(false)

      return
    }

    setSucesso(
      'Dados atualizados com sucesso.'
    )

    setSalvando(false)

    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }

  const instaladasNumero =
    Number(camerasInstaladas) ||
    0

  const onlineNumero =
    Number(camerasOnline) ||
    0

  const offlineNumero =
    Number(camerasOffline) ||
    0

  const percentualOnline =
    instaladasNumero > 0
      ? (onlineNumero /
          instaladasNumero) *
        100
      : 0

  const percentualOffline =
    instaladasNumero > 0
      ? (offlineNumero /
          instaladasNumero) *
        100
      : 0

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-sky-500" />

          <p className="text-sm text-slate-400">
            Verificando permissão...
          </p>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* CABEÇALHO */}
      <header className="border-b border-slate-800 bg-slate-900/80">

        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/dashboard'
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800"
          >
            <ArrowLeft
              size={18}
            />
          </button>

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
              Smart City
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Atualizar Monitoramento
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">

              <span>
                {nomeUsuario}
              </span>

              <span>
                •
              </span>

              <span>
                {perfil ===
                'administrador'
                  ? 'Administrador'
                  : 'Operador'}
              </span>

            </div>

          </div>

        </div>

      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">

        {/* AVISO */}
        <div className="mb-6 flex gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">

          <ShieldAlert
            size={22}
            className="mt-0.5 shrink-0 text-sky-400"
          />

          <div>

            <p className="font-semibold text-slate-200">
              Área restrita
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Somente administradores e operadores autorizados podem alterar os dados do monitoramento.
            </p>

          </div>

        </div>

        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
            {sucesso}
          </div>
        )}

        <form
          onSubmit={salvar}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >

          <div>

            <h2 className="text-xl font-semibold">
              Dados da operação
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Informe os números atuais do sistema.
            </p>

          </div>

          {/* DATA */}
          <div className="mt-6">

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Data da atualização
            </label>

            <input
              type="date"
              value={data}
              onChange={(
                event
              ) =>
                setData(
                  event.target
                    .value
                )
              }
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
            />

          </div>

          {/* NÚMEROS */}
          <div className="mt-5 grid gap-5 md:grid-cols-3">

            <CampoNumero
              titulo="Câmeras instaladas"
              valor={
                camerasInstaladas
              }
              alterar={
                setCamerasInstaladas
              }
              icone={
                <Camera
                  size={18}
                />
              }
            />

            <CampoNumero
              titulo="Câmeras online"
              valor={
                camerasOnline
              }
              alterar={
                setCamerasOnline
              }
              icone={
                <CircleCheck
                  size={18}
                />
              }
            />

            <CampoNumero
              titulo="Câmeras offline"
              valor={
                camerasOffline
              }
              alterar={
                setCamerasOffline
              }
              icone={
                <CircleX
                  size={18}
                />
              }
            />

          </div>

          {/* PRÉVIA */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <Resumo
              titulo="Instaladas"
              valor={
                instaladasNumero
              }
            />

            <Resumo
              titulo="Online"
              valor={
                onlineNumero
              }
              detalhe={`${percentualOnline.toFixed(
                2
              )}%`}
            />

            <Resumo
              titulo="Offline"
              valor={
                offlineNumero
              }
              detalhe={`${percentualOffline.toFixed(
                2
              )}%`}
            />

          </div>

          {/* VALIDAÇÃO VISUAL */}
          {instaladasNumero >
            0 && (
            <div
              className={`mt-5 rounded-xl border p-4 text-sm ${
                onlineNumero +
                  offlineNumero ===
                instaladasNumero
                  ? 'border-emerald-900 bg-emerald-950/30 text-emerald-300'
                  : 'border-amber-900 bg-amber-950/30 text-amber-300'
              }`}
            >

              {onlineNumero +
                offlineNumero ===
              instaladasNumero
                ? 'Os valores estão consistentes: Online + Offline = Instaladas.'
                : `Atenção: Online + Offline = ${
                    onlineNumero +
                    offlineNumero
                  }, mas existem ${instaladasNumero} câmeras instaladas.`}

            </div>
          )}

          {/* OBSERVAÇÃO */}
          <div className="mt-6">

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Observação
            </label>

            <textarea
              value={
                observacao
              }
              onChange={(
                event
              ) =>
                setObservacao(
                  event.target
                    .value
                )
              }
              rows={4}
              placeholder="Ex.: Atualização realizada após conferência da operação..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
            />

          </div>

          {/* BOTÕES */}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/dashboard'
                )
              }
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Save
                size={17}
              />

              {salvando
                ? 'Salvando...'
                : 'Salvar atualização'}

            </button>

          </div>

        </form>

      </section>

    </main>
  )
}

function CampoNumero({
  titulo,
  valor,
  alterar,
  icone,
}: {
  titulo: string
  valor: string
  alterar: (
    valor: string
  ) => void
  icone: React.ReactNode
}) {
  return (
    <div>

      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">

        <span className="text-sky-400">
          {icone}
        </span>

        {titulo}

      </label>

      <input
        type="number"
        min="0"
        step="1"
        value={valor}
        onChange={(
          event
        ) =>
          alterar(
            event.target.value
          )
        }
        required
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
      />

    </div>
  )
}

function Resumo({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string
  valor: number
  detalhe?: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {titulo}
      </p>

      <div className="mt-2 flex items-end justify-between gap-2">

        <p className="text-2xl font-bold">
          {new Intl.NumberFormat(
            'pt-BR'
          ).format(valor)}
        </p>

        {detalhe && (
          <span className="text-sm font-medium text-sky-400">
            {detalhe}
          </span>
        )}

      </div>

    </div>
  )
}