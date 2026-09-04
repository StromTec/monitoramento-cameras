'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Activity,
  Camera,
  CircleCheck,
  CircleX,
  Clock3,
  FolderOpen,
  History,
  LogOut,
  Pencil,
  RefreshCcw,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
  ShieldAlert,
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
  cameras_offline_sem_furto: number
  cameras_furtadas: number
  observacao?: string | null
  atualizado_em: string
}

type Historico = {
  id: number
  acao: 'criado' | 'atualizado'
  usuario_nome: string | null
  usuario_perfil: string | null
  data_referencia: string
  instaladas_anterior: number | null
  online_anterior: number | null
  offline_anterior: number | null
  offline_sem_furto_anterior: number | null
  furtadas_anterior: number | null
  instaladas_novo: number | null
  online_novo: number | null
  offline_novo: number | null
  offline_sem_furto_novo: number | null
  furtadas_novo: number | null
  criado_em: string
}

export default function DashboardPage() {
  const router = useRouter()

  const [registros, setRegistros] = useState<Registro[]>([])
  const [ultimasAlteracoes, setUltimasAlteracoes] = useState<Historico[]>([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [perfil, setPerfil] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')

  useEffect(() => {
    verificarUsuario()
  }, [])

  async function verificarUsuario() {
    setCarregando(true)
    setErro('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    const { data: perfilUsuario, error: perfilError } = await supabase
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

    const [
      resultadoMonitoramento,
      resultadoHistorico,
    ] = await Promise.all([
      supabase
        .from('monitoramento_diario')
        .select('*')
        .order('data', {
          ascending: true,
        }),

      supabase
        .from('historico_monitoramento')
        .select(
          `
            id,
            acao,
            usuario_nome,
            usuario_perfil,
            data_referencia,
            instaladas_anterior,
            online_anterior,
            offline_anterior,
            offline_sem_furto_anterior,
            furtadas_anterior,
            instaladas_novo,
            online_novo,
            offline_novo,
            offline_sem_furto_novo,
            furtadas_novo,
            criado_em
          `
        )
        .order('criado_em', {
          ascending: false,
        })
        .limit(5),
    ])

    if (resultadoMonitoramento.error) {
      console.error(
        resultadoMonitoramento.error
      )

      setErro(
        `Erro ao carregar monitoramento: ${resultadoMonitoramento.error.message}`
      )

      setCarregando(false)
      return
    }

    if (resultadoHistorico.error) {
      console.error(
        resultadoHistorico.error
      )
    }

    setRegistros(
      resultadoMonitoramento.data || []
    )

    setUltimasAlteracoes(
      resultadoHistorico.data || []
    )

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

  const offlineSemFurto =
    ultimoRegistro?.cameras_offline_sem_furto ?? 0

  const furtadas =
    ultimoRegistro?.cameras_furtadas ?? 0

  const meta = 3000

  const percentualOnline =
    instaladas > 0
      ? (online / instaladas) * 100
      : 0

  const percentualOffline =
    instaladas > 0
      ? (offline / instaladas) * 100
      : 0

  const percentualSemFurto =
    offline > 0
      ? (offlineSemFurto / offline) * 100
      : 0

  const percentualFurtadas =
    offline > 0
      ? (furtadas / offline) * 100
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
        name: 'Offline geral',
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

      semFurto:
        item.cameras_offline_sem_furto,

      furtadas:
        item.cameras_furtadas,
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

  function formatarDataReferencia(
    data?: string
  ) {
    if (!data) {
      return '-'
    }

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString('pt-BR')
  }

  function nomePerfil() {
    if (perfil === 'administrador') {
      return 'Administrador'
    }

    if (perfil === 'operador') {
      return 'Operador'
    }

    if (perfil === 'visualizador') {
      return 'Visualizador'
    }

    return 'Usuário'
  }

  function nomePerfilHistorico(
    perfilHistorico: string | null
  ) {
    if (
      perfilHistorico ===
      'administrador'
    ) {
      return 'Administrador'
    }

    if (
      perfilHistorico ===
      'operador'
    ) {
      return 'Operador'
    }

    if (
      perfilHistorico ===
      'visualizador'
    ) {
      return 'Visualizador'
    }

    if (
      perfilHistorico ===
      'sistema'
    ) {
      return 'Sistema'
    }

    return (
      perfilHistorico ||
      'Não identificado'
    )
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

            {/* ATUALIZAR DADOS */}
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

            {/* USUÁRIOS - SOMENTE ADMIN */}
            {perfil ===
              'administrador' && (
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

            {/* RESUMO OPERACIONAL */}
            <div className="mb-6 rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-slate-900 to-slate-900 p-6">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="flex items-center gap-2 text-sky-400">

                    <Activity size={20} />

                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Resumo operacional
                    </span>

                  </div>

                  <h3 className="mt-3 text-3xl font-bold">

                    {percentualOnline.toFixed(
                      2
                    )}
                    % das câmeras estão online

                  </h3>

                  <p className="mt-2 text-sm text-slate-400">

                    {formatarNumero(
                      online
                    )}{' '}
                    câmeras disponíveis de{' '}

                    {formatarNumero(
                      instaladas
                    )}{' '}
                    instaladas.

                  </p>

                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <ResumoMini
                    titulo="Online"
                    valor={formatarNumero(
                      online
                    )}
                    descricao={`${percentualOnline.toFixed(
                      2
                    )}%`}
                  />

                  <ResumoMini
                    titulo="Offline"
                    valor={formatarNumero(
                      offline
                    )}
                    descricao={`${percentualOffline.toFixed(
                      2
                    )}%`}
                  />

                  <ResumoMini
                    titulo="Meta"
                    valor={`${percentualMeta.toFixed(
                      1
                    )}%`}
                    descricao={`${formatarNumero(
                      faltam
                    )} restantes`}
                  />

                </div>

              </div>

            </div>

            {/* CARDS */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

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

              <OfflineDetalhadoCard
                offline={formatarNumero(offline)}
                percentualOffline={`${percentualOffline.toFixed(2)}% das instaladas`}
                semFurto={formatarNumero(offlineSemFurto)}
                percentualSemFurto={`${percentualSemFurto.toFixed(2)}% do offline`}
                furtadas={formatarNumero(furtadas)}
                percentualFurtadas={`${percentualFurtadas.toFixed(2)}% do offline`}
              />

            </div>

            {/* GRÁFICOS */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">

              {/* ONLINE X OFFLINE */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">

                <div>

                  <h3 className="text-lg font-semibold">
                    Online x Offline geral
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

              {/* EVOLUÇÃO */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">

                <div className="mb-6">

                  <div className="flex items-center gap-2">

                    <TrendingUp
                      size={19}
                      className="text-sky-400"
                    />

                    <h3 className="text-lg font-semibold">
                      Evolução do monitoramento
                    </h3>

                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    Evolução das câmeras instaladas, online e offline.
                  </p>

                </div>

                {dadosHistorico.length ===
                0 ? (

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
                          name="Offline geral"
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

            {/* ÚLTIMAS ALTERAÇÕES */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900">

              <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={19}
                      className="text-sky-400"
                    />

                    <h3 className="text-lg font-semibold">
                      Últimas alterações
                    </h3>

                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    Últimas atualizações registradas no sistema.
                  </p>

                </div>

                <button
                  onClick={() =>
                    router.push(
                      '/historico'
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  <History size={16} />

                  Ver histórico completo
                </button>

              </div>

              {ultimasAlteracoes.length ===
              0 ? (

                <div className="p-10 text-center text-slate-500">
                  Nenhuma alteração registrada.
                </div>

              ) : (

                <div className="divide-y divide-slate-800">

                  {ultimasAlteracoes.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 p-5 transition hover:bg-slate-800/30 lg:flex-row lg:items-center lg:justify-between"
                      >

                        <div className="flex items-start gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sky-400">

                            <UserRound
                              size={18}
                            />

                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-semibold text-slate-200">

                                {item.usuario_nome ||
                                  'Usuário não identificado'}

                              </p>

                              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">

                                {nomePerfilHistorico(
                                  item.usuario_perfil
                                )}

                              </span>

                              <span
                                className={
                                  item.acao ===
                                  'criado'
                                    ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400'
                                    : 'rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400'
                                }
                              >

                                {item.acao ===
                                'criado'
                                  ? 'Criado'
                                  : 'Atualizado'}

                              </span>

                            </div>

                            <p className="mt-1 text-sm text-slate-500">

                              Referência:{' '}

                              {formatarDataReferencia(
                                item.data_referencia
                              )}

                              {' • '}

                              {formatarData(
                                item.criado_em
                              )}

                            </p>

                          </div>

                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:min-w-[600px]">

                          <MiniIndicador
                            titulo="Instaladas"
                            valor={formatarNumero(
                              item.instaladas_novo ??
                                0
                            )}
                          />

                          <MiniIndicador
                            titulo="Online"
                            valor={formatarNumero(
                              item.online_novo ??
                                0
                            )}
                          />

                          <MiniIndicador
                            titulo="Offline geral"
                            valor={formatarNumero(
                              item.offline_novo ??
                                0
                            )}
                          />

                          <MiniIndicador
                            titulo="Sem furto"
                            valor={formatarNumero(
                              item.offline_sem_furto_novo ??
                                0
                            )}
                          />

                          <MiniIndicador
                            titulo="Furtadas"
                            valor={formatarNumero(
                              item.furtadas_novo ??
                                0
                            )}
                          />

                        </div>

                      </div>
                    )
                  )}

                </div>

              )}

            </div>

          </>

        )}

      </section>

    </main>
  )
}

function OfflineDetalhadoCard({
  offline,
  percentualOffline,
  semFurto,
  percentualSemFurto,
  furtadas,
  percentualFurtadas,
}: {
  offline: string
  percentualOffline: string
  semFurto: string
  percentualSemFurto: string
  furtadas: string
  percentualFurtadas: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">Offline geral</p>
          <p className="mt-3 text-4xl font-bold tracking-tight">{offline}</p>
          <p className="mt-2 text-sm text-slate-500">{percentualOffline}</p>
        </div>

        <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
          <CircleX size={22} />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Wrench size={16} />
              <p className="text-sm font-medium text-slate-300">Sem furto</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{semFurto}</p>
            <p className="mt-1 text-xs text-slate-500">{percentualSemFurto}</p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert size={16} />
              <p className="text-sm font-medium text-slate-300">Furtadas</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{furtadas}</p>
            <p className="mt-1 text-xs text-slate-500">{percentualFurtadas}</p>
          </div>
        </div>
      </div>
    </div>
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

function ResumoMini({
  titulo,
  valor,
  descricao,
}: {
  titulo: string
  valor: string
  descricao: string
}) {
  return (
    <div className="min-w-[120px] rounded-xl border border-slate-800 bg-slate-950/70 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {descricao}
      </p>

    </div>
  )
}

function MiniIndicador({
  titulo,
  valor,
}: {
  titulo: string
  valor: string
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-3 text-center">

      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 font-bold text-slate-200">
        {valor}
      </p>

    </div>
  )
}