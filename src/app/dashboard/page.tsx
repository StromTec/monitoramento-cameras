'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Camera,
  CircleCheck,
  CircleX,
  Target,
  RefreshCcw,
  LogOut,
  Pencil,
  FolderOpen,
  Users,
  History,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

type Registro = {
  id: number
  data: string
  cameras_instaladas: number
  cameras_online: number
  cameras_offline: number
  observacao?: string | null
  atualizado_em: string
}

export default function DashboardPage() {
  const router = useRouter()

  const [registros, setRegistros] = useState<Registro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [perfil, setPerfil] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')

  useEffect(() => {
    verificarUsuario()
  }, [])

  async function verificarUsuario() {
    setCarregando(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    const { data: perfilUsuario, error: perfilError } =
      await supabase
        .from('perfis')
        .select('nome, perfil')
        .eq('id', user.id)
        .single()

    if (perfilError) {
      console.error(perfilError)
      setErro(
        'Não foi possível identificar o perfil deste usuário.'
      )
    }

    if (perfilUsuario) {
      setPerfil(perfilUsuario.perfil)
      setNomeUsuario(perfilUsuario.nome)
    }

    await carregarDados()
  }

  async function carregarDados() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('monitoramento_diario')
      .select('*')
      .order('data', { ascending: true })

    if (error) {
      setErro(`Erro ao carregar dados: ${error.message}`)
      setCarregando(false)
      return
    }

    setRegistros(data || [])
    setCarregando(false)
  }

  const ultimoRegistro =
    registros[registros.length - 1]

  const instaladas =
    ultimoRegistro?.cameras_instaladas ?? 0

  const online =
    ultimoRegistro?.cameras_online ?? 0

  const offline =
    ultimoRegistro?.cameras_offline ?? 0

  const meta = 3000

  const percentualOnline =
    instaladas > 0
      ? (online / instaladas) * 100
      : 0

  const percentualOffline =
    instaladas > 0
      ? (offline / instaladas) * 100
      : 0

  const percentualMeta =
    instaladas > 0
      ? Math.min(
          (instaladas / meta) * 100,
          100
        )
      : 0

  const faltam = Math.max(
    meta - instaladas,
    0
  )

  const dadosPizza = useMemo(
    () => [
      {
        name: 'Online',
        value: online,
      },
      {
        name: 'Offline',
        value: offline,
      },
    ],
    [online, offline]
  )

  const dadosHistorico =
    registros.map((item) => ({
      data: new Date(
        `${item.data}T00:00:00`
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),

      instaladas:
        item.cameras_instaladas,

      online:
        item.cameras_online,

      offline:
        item.cameras_offline,
    }))

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function formatarNumero(
    valor: number
  ) {
    return new Intl.NumberFormat(
      'pt-BR'
    ).format(valor)
  }

  function formatarData(
    data?: string
  ) {
    if (!data) {
      return 'Nenhuma atualização'
    }

    return new Date(
      data
    ).toLocaleString('pt-BR')
  }

  function nomePerfil() {
    if (
      perfil === 'administrador'
    ) {
      return 'Administrador'
    }

    if (
      perfil === 'operador'
    ) {
      return 'Operador'
    }

    if (
      perfil === 'visualizador'
    ) {
      return 'Visualizador'
    }

    return 'Usuário'
  }

  const podeEditar =
    perfil === 'administrador' ||
    perfil === 'operador'

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* CABEÇALHO */}
      <header className="border-b border-slate-800 bg-slate-900/80">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
              Smart City
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Monitoramento de Câmeras
            </h1>

            {nomeUsuario && (
              <div className="mt-2 flex flex-wrap items-center gap-2">

                <span className="text-sm text-slate-400">
                  {nomeUsuario}
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {nomePerfil()}
                </span>

              </div>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* ATUALIZAR DADOS - ADMIN / OPERADOR */}
            {podeEditar && (
              <button
                onClick={() =>
                  router.push(
                    '/atualizar'
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                <Pencil size={16} />

                Atualizar dados
              </button>
            )}

            {/* ARQUIVOS */}
            <button
              onClick={() =>
                router.push(
                  '/arquivos'
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <FolderOpen size={16} />

              Arquivos
            </button>

            {/* HISTÓRICO */}
            <button
              onClick={() =>
                router.push(
                  '/historico'
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <History size={16} />

              Histórico
            </button>

            {/* USUÁRIOS - SOMENTE ADMINISTRADOR */}
            {perfil === 'administrador' && (
              <button
                onClick={() =>
                  router.push(
                    '/admin/usuarios'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                <Users size={16} />

                Usuários
              </button>
            )}

            {/* RECARREGAR */}
            <button
              onClick={
                carregarDados
              }
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCcw size={16} />

              Atualizar
            </button>

            {/* SAIR */}
            <button
              onClick={sair}
              className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
            >
              <LogOut size={16} />

              Sair
            </button>

          </div>

        </div>

      </header>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              Visão geral da operação
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Acompanhamento das câmeras instaladas e disponibilidade.
            </p>

          </div>

          <p className="text-sm text-slate-500">

            Última atualização:{' '}

            <span className="text-slate-300">

              {formatarData(
                ultimoRegistro?.atualizado_em
              )}

            </span>

          </p>

        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {erro}
          </div>
        )}

        {/* CARREGAMENTO */}
        {carregando ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Carregando informações...
          </div>

        ) : (

          <>

            {/* CARDS */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              <Card
                titulo="Câmeras instaladas"
                valor={formatarNumero(
                  instaladas
                )}
                descricao={`Meta: ${formatarNumero(
                  meta
                )}`}
                icone={
                  <Camera size={22} />
                }
              />

              <Card
                titulo="Online"
                valor={formatarNumero(
                  online
                )}
                descricao={`${percentualOnline.toFixed(
                  2
                )}% das instaladas`}
                icone={
                  <CircleCheck
                    size={22}
                  />
                }
              />

              <Card
                titulo="Offline"
                valor={formatarNumero(
                  offline
                )}
                descricao={`${percentualOffline.toFixed(
                  2
                )}% das instaladas`}
                icone={
                  <CircleX
                    size={22}
                  />
                }
              />

              <Card
                titulo="Faltam para 3.000"
                valor={formatarNumero(
                  faltam
                )}
                descricao={`${percentualMeta.toFixed(
                  2
                )}% da meta atingida`}
                icone={
                  <Target size={22} />
                }
              />

            </div>

            {/* GRÁFICOS */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">

              {/* ONLINE X OFFLINE */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">

                <div>

                  <h3 className="text-lg font-semibold">
                    Online x Offline
                  </h3>

                  <p className="text-sm text-slate-400">
                    Distribuição atual das câmeras instaladas.
                  </p>

                </div>

                <div className="mt-5 h-[280px]">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={dadosPizza}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                      >

                        <Cell fill="#22c55e" />

                        <Cell fill="#ef4444" />

                      </Pie>

                      <Tooltip />

                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-emerald-500/10 p-4">

                    <p className="text-sm text-emerald-300">
                      Online
                    </p>

                    <p className="mt-1 text-2xl font-bold">

                      {percentualOnline.toFixed(
                        2
                      )}
                      %

                    </p>

                    <p className="mt-1 text-xs text-slate-500">

                      {formatarNumero(
                        online
                      )}{' '}
                      câmeras

                    </p>

                  </div>

                  <div className="rounded-xl bg-red-500/10 p-4">

                    <p className="text-sm text-red-300">
                      Offline
                    </p>

                    <p className="mt-1 text-2xl font-bold">

                      {percentualOffline.toFixed(
                        2
                      )}
                      %

                    </p>

                    <p className="mt-1 text-xs text-slate-500">

                      {formatarNumero(
                        offline
                      )}{' '}
                      câmeras

                    </p>

                  </div>

                </div>

              </div>

              {/* HISTÓRICO GRÁFICO */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">

                <div className="mb-6">

                  <h3 className="text-lg font-semibold">
                    Evolução do monitoramento
                  </h3>

                  <p className="text-sm text-slate-400">
                    Histórico das atualizações registradas.
                  </p>

                </div>

                {dadosHistorico.length === 0 ? (

                  <div className="flex h-[360px] items-center justify-center text-slate-500">
                    Nenhum histórico disponível.
                  </div>

                ) : (

                  <div className="h-[360px]">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <LineChart
                        data={
                          dadosHistorico
                        }
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                        />

                        <XAxis
                          dataKey="data"
                          stroke="#94a3b8"
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                        />

                        <Tooltip />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="instaladas"
                          name="Instaladas"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          dot={false}
                        />

                        <Line
                          type="monotone"
                          dataKey="online"
                          name="Online"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={false}
                        />

                        <Line
                          type="monotone"
                          dataKey="offline"
                          name="Offline"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={false}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>

                )}

              </div>

            </div>

            {/* META */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold">
                    Meta de instalação
                  </h3>

                  <p className="text-sm text-slate-400">
                    Progresso para 3.000 câmeras instaladas.
                  </p>

                </div>

                <span className="text-lg font-bold text-sky-400">

                  {percentualMeta.toFixed(
                    2
                  )}
                  %

                </span>

              </div>

              <div className="h-4 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-500"
                  style={{
                    width: `${percentualMeta}%`,
                  }}
                />

              </div>

              <div className="mt-3 flex justify-between text-sm text-slate-400">

                <span>

                  {formatarNumero(
                    instaladas
                  )}{' '}
                  instaladas

                </span>

                <span>

                  {formatarNumero(
                    meta
                  )}{' '}
                  meta

                </span>

              </div>

              <div className="mt-5 rounded-xl bg-slate-950 p-4">

                {faltam > 0 ? (

                  <p className="text-center text-sm text-slate-300">

                    Faltam{' '}

                    <strong className="text-sky-400">

                      {formatarNumero(
                        faltam
                      )}

                    </strong>{' '}

                    câmeras para atingir a meta de 3.000.

                  </p>

                ) : (

                  <p className="text-center font-semibold text-emerald-400">
                    Meta de 3.000 câmeras atingida!
                  </p>

                )}

              </div>

            </div>

          </>

        )}

      </section>

    </main>
  )
}

function Card({
  titulo,
  valor,
  descricao,
  icone,
}: {
  titulo: string
  valor: string
  descricao: string
  icone: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-400">
            {titulo}
          </p>

          <p className="mt-3 text-4xl font-bold tracking-tight">
            {valor}
          </p>

        </div>

        <div className="rounded-xl bg-slate-800 p-3 text-sky-400">
          {icone}
        </div>

      </div>

      <p className="mt-4 text-sm text-slate-500">
        {descricao}
      </p>

    </div>
  )
}