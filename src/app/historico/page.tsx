'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  RefreshCcw,
  Search,
  UserRound,
  X,
} from 'lucide-react'

type Historico = {
  id: number
  registro_id: number | null
  acao: 'criado' | 'atualizado'
  usuario_id: string | null
  usuario_nome: string | null
  usuario_perfil: string | null
  data_referencia: string

  instaladas_anterior: number | null
  online_anterior: number | null
  offline_anterior: number | null
  offline_sem_furto_anterior: number | null
  furtadas_anterior: number | null
  observacao_anterior: string | null

  instaladas_novo: number | null
  online_novo: number | null
  offline_novo: number | null
  offline_sem_furto_novo: number | null
  furtadas_novo: number | null
  observacao_novo: string | null

  criado_em: string
}

const ITENS_POR_PAGINA = 10

export default function HistoricoPage() {
  const router = useRouter()

  const [historico, setHistorico] = useState<Historico[]>([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('todos')

  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)

  useEffect(() => {
    verificarUsuario()
  }, [])

  useEffect(() => {
    if (paginaAtual > 0) {
      carregarHistorico()
    }
  }, [
    paginaAtual,
    filtroAcao,
    dataInicial,
    dataFinal,
  ])

  async function verificarUsuario() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      router.push('/login')
      return
    }

    await carregarHistorico()
  }

  async function carregarHistorico() {
    setCarregando(true)
    setErro('')

    const inicio =
      (paginaAtual - 1) *
      ITENS_POR_PAGINA

    const fim =
      inicio +
      ITENS_POR_PAGINA -
      1

    let query = supabase
      .from('historico_monitoramento')
      .select('*', {
        count: 'exact',
      })

    if (
      filtroAcao !== 'todos'
    ) {
      query = query.eq(
        'acao',
        filtroAcao
      )
    }

    if (dataInicial) {
      query = query.gte(
        'data_referencia',
        dataInicial
      )
    }

    if (dataFinal) {
      query = query.lte(
        'data_referencia',
        dataFinal
      )
    }

    const textoBusca =
      busca.trim()

    if (textoBusca) {
      query = query.or(
        [
          `usuario_nome.ilike.%${textoBusca}%`,
          `usuario_perfil.ilike.%${textoBusca}%`,
          `observacao_novo.ilike.%${textoBusca}%`,
          `observacao_anterior.ilike.%${textoBusca}%`,
        ].join(',')
      )
    }

    const {
      data,
      error,
      count,
    } = await query
      .order('criado_em', {
        ascending: false,
      })
      .range(inicio, fim)

    if (error) {
      console.error(error)

      setErro(
        `Erro ao carregar histórico: ${error.message}`
      )

      setCarregando(false)

      return
    }

    setHistorico(
      data || []
    )

    setTotalRegistros(
      count || 0
    )

    setCarregando(false)
  }

  function pesquisar() {
    setPaginaAtual(1)

    if (paginaAtual === 1) {
      carregarHistorico()
    }
  }

  function limparFiltros() {
    setBusca('')
    setFiltroAcao('todos')
    setDataInicial('')
    setDataFinal('')
    setPaginaAtual(1)

    setTimeout(() => {
      carregarHistorico()
    }, 0)
  }

  function formatarNumero(
    valor: number | null
  ) {
    if (valor === null) {
      return '-'
    }

    return new Intl.NumberFormat(
      'pt-BR'
    ).format(valor)
  }

  function formatarDataHora(
    data: string
  ) {
    return new Date(
      data
    ).toLocaleString('pt-BR')
  }

  function formatarDataReferencia(
    data: string
  ) {
    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString('pt-BR')
  }

  function nomePerfil(
    perfil: string | null
  ) {
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

    if (
      perfil === 'sistema'
    ) {
      return 'Sistema'
    }

    return (
      perfil ||
      'Não identificado'
    )
  }

  const totalPaginas =
    Math.max(
      Math.ceil(
        totalRegistros /
          ITENS_POR_PAGINA
      ),
      1
    )

  const primeiroRegistro =
    totalRegistros === 0
      ? 0
      : (paginaAtual - 1) *
          ITENS_POR_PAGINA +
        1

  const ultimoRegistro =
    Math.min(
      paginaAtual *
        ITENS_POR_PAGINA,
      totalRegistros
    )

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* CABEÇALHO */}
      <header className="border-b border-slate-800 bg-slate-900/80">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                router.push(
                  '/dashboard'
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800"
              title="Voltar ao Dashboard"
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
                Histórico de Alterações
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Auditoria das atualizações realizadas no monitoramento.
              </p>

            </div>

          </div>

          <button
            onClick={
              carregarHistorico
            }
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCcw
              size={16}
            />

            Atualizar
          </button>

        </div>

      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* RESUMO */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total encontrado
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    totalRegistros
                  }
                </p>

              </div>

              <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
                <History
                  size={22}
                />
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Página atual
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    paginaAtual
                  }
                </p>

              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Clock3
                  size={22}
                />
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total de páginas
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    totalPaginas
                  }
                </p>

              </div>

              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                <RefreshCcw
                  size={22}
                />
              </div>

            </div>

          </div>

        </div>

        {/* FILTROS */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="grid gap-4 lg:grid-cols-4">

            {/* BUSCA */}
            <div className="relative lg:col-span-2">

              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={busca}
                onChange={(
                  event
                ) =>
                  setBusca(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    pesquisar()
                  }
                }}
                placeholder="Buscar usuário, perfil ou observação..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
              />

            </div>

            {/* AÇÃO */}
            <select
              value={
                filtroAcao
              }
              onChange={(
                event
              ) => {
                setFiltroAcao(
                  event.target
                    .value
                )

                setPaginaAtual(
                  1
                )
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-sky-500"
            >
              <option value="todos">
                Todas as ações
              </option>

              <option value="criado">
                Criado
              </option>

              <option value="atualizado">
                Atualizado
              </option>
            </select>

            {/* PESQUISAR */}
            <button
              onClick={
                pesquisar
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              <Search
                size={16}
              />

              Pesquisar
            </button>

          </div>

          {/* PERÍODO */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Data inicial
              </label>

              <input
                type="date"
                value={
                  dataInicial
                }
                onChange={(
                  event
                ) => {
                  setDataInicial(
                    event.target
                      .value
                  )

                  setPaginaAtual(
                    1
                  )
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-sky-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Data final
              </label>

              <input
                type="date"
                value={
                  dataFinal
                }
                onChange={(
                  event
                ) => {
                  setDataFinal(
                    event.target
                      .value
                  )

                  setPaginaAtual(
                    1
                  )
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-sky-500"
              />

            </div>

            <div className="flex items-end lg:col-span-2">

              <button
                onClick={
                  limparFiltros
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                <X size={16} />

                Limpar filtros
              </button>

            </div>

          </div>

        </div>

        {erro && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {erro}
          </div>
        )}

        {/* INFORMAÇÃO DE PAGINAÇÃO */}
        {!carregando &&
          totalRegistros > 0 && (
            <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

              <p>
                Mostrando{' '}
                <span className="font-medium text-slate-300">
                  {
                    primeiroRegistro
                  }
                </span>
                {' '}a{' '}
                <span className="font-medium text-slate-300">
                  {
                    ultimoRegistro
                  }
                </span>
                {' '}de{' '}
                <span className="font-medium text-slate-300">
                  {
                    totalRegistros
                  }
                </span>
                {' '}registros.
              </p>

              <p>
                {
                  ITENS_POR_PAGINA
                }{' '}
                registros por página
              </p>

            </div>
          )}

        {/* LISTAGEM */}
        <div className="mt-4">

          {carregando ? (

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
              Carregando histórico...
            </div>

          ) : historico.length ===
            0 ? (

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              Nenhum registro encontrado.
            </div>

          ) : (

            <div className="space-y-4">

              {historico.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >

                    {/* TOPO */}
                    <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-sky-400">
                          <UserRound
                            size={20}
                          />
                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-semibold">
                              {item.usuario_nome ||
                                'Usuário não identificado'}
                            </p>

                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                              {nomePerfil(
                                item.usuario_perfil
                              )}
                            </span>

                            <span
                              className={
                                item.acao ===
                                'criado'
                                  ? 'rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400'
                                  : 'rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400'
                              }
                            >
                              {item.acao ===
                              'criado'
                                ? 'Criado'
                                : 'Atualizado'}
                            </span>

                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatarDataHora(
                              item.criado_em
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="text-sm text-slate-400">

                        Data de referência:{' '}

                        <span className="font-medium text-slate-200">
                          {formatarDataReferencia(
                            item.data_referencia
                          )}
                        </span>

                      </div>

                    </div>

                    {/* DADOS */}
                    <div className="mt-5 grid gap-5 lg:grid-cols-2">

                      {/* ANTES */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                          Antes
                        </p>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

                          <Valor
                            titulo="Instaladas"
                            valor={formatarNumero(
                              item.instaladas_anterior
                            )}
                          />

                          <Valor
                            titulo="Online"
                            valor={formatarNumero(
                              item.online_anterior
                            )}
                          />

                          <Valor
                            titulo="Offline geral"
                            valor={formatarNumero(
                              item.offline_anterior
                            )}
                          />

                          <Valor
                            titulo="Sem furto"
                            valor={formatarNumero(
                              item.offline_sem_furto_anterior
                            )}
                          />

                          <Valor
                            titulo="Furtadas"
                            valor={formatarNumero(
                              item.furtadas_anterior
                            )}
                          />

                        </div>

                        {item.observacao_anterior && (
                          <div className="mt-4 border-t border-slate-800 pt-4">

                            <p className="text-xs uppercase tracking-wider text-slate-600">
                              Observação
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {
                                item.observacao_anterior
                              }
                            </p>

                          </div>
                        )}

                      </div>

                      {/* DEPOIS */}
                      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">

                        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-sky-400">
                          Depois
                        </p>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

                          <Valor
                            titulo="Instaladas"
                            valor={formatarNumero(
                              item.instaladas_novo
                            )}
                          />

                          <Valor
                            titulo="Online"
                            valor={formatarNumero(
                              item.online_novo
                            )}
                          />

                          <Valor
                            titulo="Offline geral"
                            valor={formatarNumero(
                              item.offline_novo
                            )}
                          />

                          <Valor
                            titulo="Sem furto"
                            valor={formatarNumero(
                              item.offline_sem_furto_novo
                            )}
                          />

                          <Valor
                            titulo="Furtadas"
                            valor={formatarNumero(
                              item.furtadas_novo
                            )}
                          />

                        </div>

                        {item.observacao_novo && (
                          <div className="mt-4 border-t border-sky-500/10 pt-4">

                            <p className="text-xs uppercase tracking-wider text-slate-600">
                              Observação
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {
                                item.observacao_novo
                              }
                            </p>

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </div>

        {/* PAGINAÇÃO */}
        {!carregando &&
          totalRegistros > 0 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row">

              <p className="text-sm text-slate-500">
                Página{' '}
                <span className="font-semibold text-slate-300">
                  {
                    paginaAtual
                  }
                </span>
                {' '}de{' '}
                <span className="font-semibold text-slate-300">
                  {
                    totalPaginas
                  }
                </span>
              </p>

              <div className="flex items-center gap-3">

                <button
                  disabled={
                    paginaAtual <=
                    1
                  }
                  onClick={() =>
                    setPaginaAtual(
                      (
                        pagina
                      ) =>
                        Math.max(
                          pagina -
                            1,
                          1
                        )
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />

                  Anterior
                </button>

                <button
                  disabled={
                    paginaAtual >=
                    totalPaginas
                  }
                  onClick={() =>
                    setPaginaAtual(
                      (
                        pagina
                      ) =>
                        Math.min(
                          pagina +
                            1,
                          totalPaginas
                        )
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima

                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>
          )}

      </section>

    </main>
  )
}

function Valor({
  titulo,
  valor,
}: {
  titulo: string
  valor: string
}) {
  return (
    <div>

      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-200">
        {valor}
      </p>

    </div>
  )
}