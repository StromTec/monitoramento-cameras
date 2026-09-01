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
  UserPlus,
  Users,
  ShieldCheck,
  Pencil,
  Trash2,
  RefreshCcw,
  X,
  Save,
} from 'lucide-react'

type Usuario = {
  id: string
  email: string
  nome: string
  perfil: string
  criado_em: string
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

  const [mensagem, setMensagem] =
    useState('')

  const [nome, setNome] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [senha, setSenha] =
    useState('')

  const [perfil, setPerfil] =
    useState('visualizador')

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
  ] = useState('visualizador')

  useEffect(() => {
    iniciar()
  }, [])

  async function obterToken() {
    const {
      data: { session },
    } =
      await supabase.auth.getSession()

    return (
      session?.access_token ||
      null
    )
  }

  async function iniciar() {
    setCarregando(true)

    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const {
      data: perfilUsuario,
      error,
    } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', user.id)
      .single()

    if (
      error ||
      !perfilUsuario ||
      perfilUsuario.perfil !==
        'administrador'
    ) {
      router.replace('/dashboard')
      return
    }

    await carregarUsuarios()
  }

  async function carregarUsuarios() {
    setCarregando(true)
    setErro('')

    const token =
      await obterToken()

    if (!token) {
      router.replace('/login')
      return
    }

    const resposta = await fetch(
      '/api/admin/usuarios',
      {
        method: 'GET',
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    )

    const dados =
      await resposta.json()

    if (!resposta.ok) {
      setErro(
        dados.error ||
          'Erro ao carregar usuários.'
      )

      setCarregando(false)
      return
    }

    setUsuarios(
      dados.usuarios || []
    )

    setCarregando(false)
  }

  async function criarUsuario(
    event: FormEvent
  ) {
    event.preventDefault()

    setErro('')
    setMensagem('')
    setSalvando(true)

    const token =
      await obterToken()

    if (!token) {
      router.replace('/login')
      return
    }

    const resposta = await fetch(
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
          nome,
          email,
          senha,
          perfil,
        }),
      }
    )

    const dados =
      await resposta.json()

    if (!resposta.ok) {
      setErro(
        dados.error ||
          'Erro ao criar usuário.'
      )

      setSalvando(false)
      return
    }

    setMensagem(
      'Usuário criado com sucesso.'
    )

    setNome('')
    setEmail('')
    setSenha('')
    setPerfil('visualizador')

    setSalvando(false)

    await carregarUsuarios()
  }

  function abrirEdicao(
    usuario: Usuario
  ) {
    setUsuarioEditando(usuario)

    setNomeEdicao(
      usuario.nome
    )

    setPerfilEdicao(
      usuario.perfil
    )

    setErro('')
    setMensagem('')
  }

  async function salvarEdicao() {
    if (!usuarioEditando) return

    setSalvando(true)
    setErro('')
    setMensagem('')

    const token =
      await obterToken()

    if (!token) {
      router.replace('/login')
      return
    }

    const resposta = await fetch(
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
          id: usuarioEditando.id,
          nome: nomeEdicao,
          perfil: perfilEdicao,
        }),
      }
    )

    const dados =
      await resposta.json()

    if (!resposta.ok) {
      setErro(
        dados.error ||
          'Erro ao alterar usuário.'
      )

      setSalvando(false)
      return
    }

    setUsuarioEditando(null)

    setMensagem(
      'Usuário atualizado com sucesso.'
    )

    setSalvando(false)

    await carregarUsuarios()
  }

  async function excluirUsuario(
    usuario: Usuario
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir o usuário "${usuario.nome}"?\n\nEsta ação removerá o acesso ao sistema.`
      )

    if (!confirmar) return

    setErro('')
    setMensagem('')

    const token =
      await obterToken()

    if (!token) {
      router.replace('/login')
      return
    }

    const resposta = await fetch(
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

    const dados =
      await resposta.json()

    if (!resposta.ok) {
      setErro(
        dados.error ||
          'Erro ao excluir usuário.'
      )

      return
    }

    setMensagem(
      'Usuário excluído com sucesso.'
    )

    await carregarUsuarios()
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

    return 'Visualizador'
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) return 'Nunca'

    return new Date(
      data
    ).toLocaleString(
      'pt-BR'
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        <button
          onClick={() =>
            router.push(
              '/dashboard'
            )
          }
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />

          Voltar ao Dashboard
        </button>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <div className="flex items-center justify-between gap-5">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
                Administração
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Gerenciamento de Usuários
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Cadastre e controle quem possui acesso ao sistema.
              </p>

            </div>

            <div className="rounded-2xl bg-sky-500/10 p-4 text-sky-400">
              <Users size={34} />
            </div>

          </div>

        </div>

        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        {/* CRIAR USUÁRIO */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <UserPlus size={22} />
            </div>

            <div>

              <h2 className="text-lg font-semibold">
                Novo usuário
              </h2>

              <p className="text-sm text-slate-400">
                Cadastre uma nova pessoa no sistema.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              criarUsuario
            }
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >

            <div>

              <label className="mb-2 block text-sm text-slate-300">
                Nome
              </label>

              <input
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                required
                placeholder="Nome completo"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm text-slate-300">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm text-slate-300">
                Senha inicial
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm text-slate-300">
                Perfil
              </label>

              <select
                value={perfil}
                onChange={(e) =>
                  setPerfil(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
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

            <div className="md:col-span-2 xl:col-span-4">

              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-semibold transition hover:bg-sky-500 disabled:opacity-50"
              >

                <UserPlus size={18} />

                {salvando
                  ? 'Criando...'
                  : 'Criar usuário'}

              </button>

            </div>

          </form>

        </div>

        {/* LISTA */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900">

          <div className="flex items-center justify-between border-b border-slate-800 p-6">

            <div>

              <h2 className="text-lg font-semibold">
                Usuários cadastrados
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {usuarios.length} usuário(s)
              </p>

            </div>

            <button
              onClick={
                carregarUsuarios
              }
              className="rounded-xl border border-slate-700 p-3 text-slate-300 hover:bg-slate-800"
              title="Atualizar"
            >
              <RefreshCcw size={18} />
            </button>

          </div>

          {carregando ? (

            <div className="p-10 text-center text-slate-400">
              Carregando usuários...
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-950/50">

                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      Usuário
                    </th>

                    <th className="px-6 py-4">
                      Perfil
                    </th>

                    <th className="px-6 py-4">
                      Último acesso
                    </th>

                    <th className="px-6 py-4 text-right">
                      Ações
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {usuarios.map(
                    (usuario) => (

                      <tr
                        key={usuario.id}
                        className="hover:bg-slate-800/30"
                      >

                        <td className="px-6 py-5">

                          <p className="font-medium">
                            {usuario.nome}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {usuario.email}
                          </p>

                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs">

                            <ShieldCheck
                              size={14}
                              className="text-sky-400"
                            />

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

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                abrirEdicao(
                                  usuario
                                )
                              }
                              className="rounded-lg bg-slate-800 p-2.5 text-slate-300 transition hover:bg-slate-700"
                              title="Editar"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() =>
                                excluirUsuario(
                                  usuario
                                )
                              }
                              className="rounded-lg bg-red-500/10 p-2.5 text-red-300 transition hover:bg-red-500/20"
                              title="Excluir"
                            >
                              <Trash2 size={17} />
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

      {/* MODAL EDIÇÃO */}

      {usuarioEditando && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Editar usuário
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {usuarioEditando.email}
                </p>

              </div>

              <button
                onClick={() =>
                  setUsuarioEditando(
                    null
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-5">

              <div>

                <label className="mb-2 block text-sm text-slate-300">
                  Nome
                </label>

                <input
                  value={nomeEdicao}
                  onChange={(e) =>
                    setNomeEdicao(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm text-slate-300">
                  Perfil
                </label>

                <select
                  value={
                    perfilEdicao
                  }
                  onChange={(e) =>
                    setPerfilEdicao(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-500"
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

              <div className="flex justify-end gap-3">

                <button
                  onClick={() =>
                    setUsuarioEditando(
                      null
                    )
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    salvarEdicao
                  }
                  disabled={salvando}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 disabled:opacity-50"
                >

                  <Save size={18} />

                  Salvar

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}