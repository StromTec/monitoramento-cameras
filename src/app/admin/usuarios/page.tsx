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
  Edit3,
  KeyRound,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react'

type PerfilUsuario =
  | 'administrador'
  | 'operador'
  | 'visualizador'

type Usuario = {
  id: string
  email: string
  nome: string
  perfil: PerfilUsuario | string
  criado_em: string | null
  ultimo_login: string | null
  confirmado: boolean
}

export default function UsuariosPage() {
  const router = useRouter()

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([])

  const [carregando, setCarregando] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [erro, setErro] =
    useState('')

  const [sucesso, setSucesso] =
    useState('')

  const [nomeAdmin, setNomeAdmin] =
    useState('')

  const [usuarioAtualId, setUsuarioAtualId] =
    useState('')

  const [nome, setNome] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [senha, setSenha] =
    useState('')

  const [perfil, setPerfil] =
    useState<PerfilUsuario>(
      'visualizador'
    )

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] = useState<Usuario | null>(
    null
  )

  const [
    nomeEdicao,
    setNomeEdicao,
  ] = useState('')

  const [
    perfilEdicao,
    setPerfilEdicao,
  ] = useState<PerfilUsuario>(
    'visualizador'
  )

  useEffect(() => {
    verificarAdministrador()
  }, [])

  async function verificarAdministrador() {
    setCarregando(true)
    setErro('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !user
    ) {
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

    if (
      perfilUsuario.perfil !==
      'administrador'
    ) {
      router.replace('/dashboard')
      return
    }

    setNomeAdmin(
      perfilUsuario.nome
    )

    setUsuarioAtualId(
      user.id
    )

    await carregarUsuarios()
  }

  async function obterToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace('/login')
      return null
    }

    return session.access_token
  }

  async function carregarUsuarios() {
    setCarregando(true)
    setErro('')

    try {
      const token =
        await obterToken()

      if (!token) {
        return
      }

      const resposta =
        await fetch(
          '/api/admin/usuarios',
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const resultado =
        await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            'Erro ao carregar usuários.'
        )
      }

      setUsuarios(
        resultado.usuarios ||
          []
      )
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar usuários.'

      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  async function criarUsuario(
    event: FormEvent
  ) {
    event.preventDefault()

    setErro('')
    setSucesso('')

    if (!nome.trim()) {
      setErro(
        'Informe o nome do usuário.'
      )
      return
    }

    if (!email.trim()) {
      setErro(
        'Informe o e-mail do usuário.'
      )
      return
    }

    if (
      senha.length < 6
    ) {
      setErro(
        'A senha deve possuir pelo menos 6 caracteres.'
      )
      return
    }

    setSalvando(true)

    try {
      const token =
        await obterToken()

      if (!token) {
        return
      }

      const resposta =
        await fetch(
          '/api/admin/usuarios',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nome:
                nome.trim(),

              email:
                email
                  .trim()
                  .toLowerCase(),

              senha,

              perfil,
            }),
          }
        )

      const resultado =
        await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            'Erro ao criar usuário.'
        )
      }

      setNome('')
      setEmail('')
      setSenha('')
      setPerfil(
        'visualizador'
      )

      setSucesso(
        'Usuário criado com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Erro ao criar usuário.'

      setErro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function abrirEdicao(
    usuario: Usuario
  ) {
    setErro('')
    setSucesso('')

    setUsuarioEditando(
      usuario
    )

    setNomeEdicao(
      usuario.nome
    )

    if (
      usuario.perfil ===
        'administrador' ||
      usuario.perfil ===
        'operador' ||
      usuario.perfil ===
        'visualizador'
    ) {
      setPerfilEdicao(
        usuario.perfil
      )
    } else {
      setPerfilEdicao(
        'visualizador'
      )
    }
  }

  function fecharEdicao() {
    setUsuarioEditando(
      null
    )

    setNomeEdicao('')
    setPerfilEdicao(
      'visualizador'
    )
  }

  async function salvarEdicao() {
    if (!usuarioEditando) {
      return
    }

    setErro('')
    setSucesso('')

    if (!nomeEdicao.trim()) {
      setErro(
        'Informe o nome do usuário.'
      )
      return
    }

    if (
      usuarioEditando.id ===
        usuarioAtualId &&
      perfilEdicao !==
        'administrador'
    ) {
      setErro(
        'Você não pode remover sua própria permissão de administrador.'
      )
      return
    }

    setSalvando(true)

    try {
      const token =
        await obterToken()

      if (!token) {
        return
      }

      const resposta =
        await fetch(
          '/api/admin/usuarios',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id:
                usuarioEditando.id,

              nome:
                nomeEdicao.trim(),

              perfil:
                perfilEdicao,
            }),
          }
        )

      const resultado =
        await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            'Erro ao atualizar usuário.'
        )
      }

      fecharEdicao()

      setSucesso(
        'Usuário atualizado com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar usuário.'

      setErro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  async function excluirUsuario(
    usuario: Usuario
  ) {
    setErro('')
    setSucesso('')

    if (
      usuario.id ===
      usuarioAtualId
    ) {
      setErro(
        'Você não pode excluir sua própria conta.'
      )
      return
    }

    const confirmar =
      window.confirm(
        `Deseja realmente excluir o usuário "${usuario.nome}"?\n\nEsta ação não poderá ser desfeita.`
      )

    if (!confirmar) {
      return
    }

    setSalvando(true)

    try {
      const token =
        await obterToken()

      if (!token) {
        return
      }

      const resposta =
        await fetch(
          '/api/admin/usuarios',
          {
            method: 'DELETE',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id: usuario.id,
            }),
          }
        )

      const resultado =
        await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            'Erro ao excluir usuário.'
        )
      }

      setSucesso(
        'Usuário excluído com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Erro ao excluir usuário.'

      setErro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return 'Nunca'
    }

    return new Date(
      data
    ).toLocaleString(
      'pt-BR'
    )
  }

  function nomePerfil(
    perfilUsuario: string
  ) {
    if (
      perfilUsuario ===
      'administrador'
    ) {
      return 'Administrador'
    }

    if (
      perfilUsuario ===
      'operador'
    ) {
      return 'Operador'
    }

    if (
      perfilUsuario ===
      'visualizador'
    ) {
      return 'Visualizador'
    }

    return perfilUsuario
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* CABEÇALHO */}
      <header className="border-b border-slate-800 bg-slate-900/80">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <button
              type="button"
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
                Gerenciamento de Usuários
              </h1>

              {nomeAdmin && (
                <p className="mt-1 text-sm text-slate-400">
                  Administrador:{' '}
                  <span className="text-slate-300">
                    {nomeAdmin}
                  </span>
                </p>
              )}

            </div>

          </div>

          <button
            type="button"
            onClick={
              carregarUsuarios
            }
            disabled={
              carregando
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
            />

            Atualizar
          </button>

        </div>

      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* SEGURANÇA */}
        <div className="mb-6 flex gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">

          <ShieldCheck
            size={23}
            className="mt-0.5 shrink-0 text-sky-400"
          />

          <div>

            <p className="font-semibold">
              Área administrativa
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Apenas usuários com perfil de administrador podem criar, editar ou excluir contas.
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

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

          {/* CRIAR USUÁRIO */}
          <form
            onSubmit={
              criarUsuario
            }
            className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
                <Plus
                  size={20}
                />
              </div>

              <div>

                <h2 className="font-semibold">
                  Novo usuário
                </h2>

                <p className="text-sm text-slate-500">
                  Criar acesso ao sistema
                </p>

              </div>

            </div>

            <div className="mt-6">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Nome
              </label>

              <input
                type="text"
                value={nome}
                onChange={(
                  event
                ) =>
                  setNome(
                    event.target
                      .value
                  )
                }
                placeholder="Nome do usuário"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
                required
              />

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
                required
              />

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Senha inicial
              </label>

              <div className="relative">

                <KeyRound
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="password"
                  value={senha}
                  onChange={(
                    event
                  ) =>
                    setSenha(
                      event.target
                        .value
                    )
                  }
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
                  required
                />

              </div>

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Perfil
              </label>

              <select
                value={perfil}
                onChange={(
                  event
                ) =>
                  setPerfil(
                    event.target
                      .value as PerfilUsuario
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-sky-500"
              >
                <option value="visualizador">
                  Visualizador
                </option>

                <option value="operador">
                  Operador
                </option>

                <option value="administrador">
                  Administrador
                </option>
              </select>

            </div>

            <button
              type="submit"
              disabled={
                salvando
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus
                size={17}
              />

              {salvando
                ? 'Salvando...'
                : 'Criar usuário'}

            </button>

          </form>

          {/* LISTA */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-800 p-6">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-slate-800 p-3 text-sky-400">
                  <Users
                    size={20}
                  />
                </div>

                <div>

                  <h2 className="font-semibold">
                    Usuários cadastrados
                  </h2>

                  <p className="text-sm text-slate-500">
                    {usuarios.length}{' '}
                    usuário(s)
                  </p>

                </div>

              </div>

            </div>

            {carregando ? (

              <div className="p-12 text-center text-slate-500">
                Carregando usuários...
              </div>

            ) : usuarios.length ===
              0 ? (

              <div className="p-12 text-center text-slate-500">
                Nenhum usuário encontrado.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px]">

                  <thead>

                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

                      <th className="px-6 py-4">
                        Usuário
                      </th>

                      <th className="px-6 py-4">
                        Perfil
                      </th>

                      <th className="px-6 py-4">
                        Último acesso
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right">
                        Ações
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {usuarios.map(
                      (
                        usuario
                      ) => (
                        <tr
                          key={
                            usuario.id
                          }
                          className="border-b border-slate-800/70 transition last:border-0 hover:bg-slate-800/30"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sky-400">
                                <UserCog
                                  size={18}
                                />
                              </div>

                              <div>

                                <p className="font-semibold text-slate-200">
                                  {
                                    usuario.nome
                                  }
                                </p>

                                <p className="mt-0.5 text-sm text-slate-500">
                                  {
                                    usuario.email
                                  }
                                </p>

                                {usuario.id ===
                                  usuarioAtualId && (
                                  <span className="mt-1 inline-block text-xs font-medium text-sky-400">
                                    Sua conta
                                  </span>
                                )}

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                usuario.perfil ===
                                'administrador'
                                  ? 'bg-sky-500/10 text-sky-300'
                                  : usuario.perfil ===
                                    'operador'
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {nomePerfil(
                                usuario.perfil
                              )}
                            </span>

                          </td>

                          <td className="px-6 py-5 text-sm text-slate-400">
                            {formatarData(
                              usuario.ultimo_login
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                usuario.confirmado
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-amber-500/10 text-amber-300'
                              }`}
                            >
                              {usuario.confirmado
                                ? 'Ativo'
                                : 'Pendente'}
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicao(
                                    usuario
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-sky-300"
                                title="Editar usuário"
                              >
                                <Edit3
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  excluirUsuario(
                                    usuario
                                  )
                                }
                                disabled={
                                  usuario.id ===
                                  usuarioAtualId
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                title={
                                  usuario.id ===
                                  usuarioAtualId
                                    ? 'Não é possível excluir sua própria conta'
                                    : 'Excluir usuário'
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </section>

      {/* MODAL EDITAR */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-800 p-6">

              <div>

                <h2 className="text-lg font-semibold">
                  Editar usuário
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    usuarioEditando.email
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={
                  fecharEdicao
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X
                  size={18}
                />
              </button>

            </div>

            <div className="p-6">

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nome
                </label>

                <input
                  type="text"
                  value={
                    nomeEdicao
                  }
                  onChange={(
                    event
                  ) =>
                    setNomeEdicao(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                />

              </div>

              <div className="mt-4">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Perfil
                </label>

                <select
                  value={
                    perfilEdicao
                  }
                  onChange={(
                    event
                  ) =>
                    setPerfilEdicao(
                      event.target
                        .value as PerfilUsuario
                    )
                  }
                  disabled={
                    usuarioEditando.id ===
                    usuarioAtualId
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-300 outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="visualizador">
                    Visualizador
                  </option>

                  <option value="operador">
                    Operador
                  </option>

                  <option value="administrador">
                    Administrador
                  </option>
                </select>

                {usuarioEditando.id ===
                  usuarioAtualId && (
                  <p className="mt-2 text-xs text-amber-400">
                    Seu próprio perfil de administrador não pode ser removido.
                  </p>
                )}

              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharEdicao
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    salvarEdicao
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}