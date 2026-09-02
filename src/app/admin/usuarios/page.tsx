'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

type PerfilUsuario =
  | 'administrador'
  | 'operador'
  | 'visualizador'

type Usuario = {
  id: string
  email: string
  nome: string
  perfil: PerfilUsuario
  criado_em: string | null
  ultimo_login: string | null
  confirmado: boolean
}

type RespostaApi = {
  usuarios?: Usuario[]
  sucesso?: boolean
  message?: string
  error?: string
}

export default function UsuariosPage() {
  const router = useRouter()

  const [carregandoPagina, setCarregandoPagina] =
    useState(true)

  const [carregandoUsuarios, setCarregandoUsuarios] =
    useState(false)

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([])

  const [usuarioAtualId, setUsuarioAtualId] =
    useState('')

  const [nomeAdministrador, setNomeAdministrador] =
    useState('Administrador')

  const [mensagem, setMensagem] =
    useState('')

  const [erro, setErro] =
    useState('')

  /*
  =========================================================
  CRIAR USUÁRIO
  =========================================================
  */

  const [modalCriar, setModalCriar] =
    useState(false)

  const [novoNome, setNovoNome] =
    useState('')

  const [novoEmail, setNovoEmail] =
    useState('')

  const [novaSenhaCriacao, setNovaSenhaCriacao] =
    useState('')

  const [
    mostrarSenhaCriacao,
    setMostrarSenhaCriacao,
  ] = useState(false)

  const [
    novoPerfil,
    setNovoPerfil,
  ] = useState<PerfilUsuario>(
    'visualizador'
  )

  const [criando, setCriando] =
    useState(false)

  /*
  =========================================================
  EDITAR USUÁRIO
  =========================================================
  */

  const [modalEditar, setModalEditar] =
    useState(false)

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] = useState<Usuario | null>(
    null
  )

  const [editarNome, setEditarNome] =
    useState('')

  const [
    editarPerfil,
    setEditarPerfil,
  ] = useState<PerfilUsuario>(
    'visualizador'
  )

  const [salvandoEdicao, setSalvandoEdicao] =
    useState(false)

  /*
  =========================================================
  REDEFINIR SENHA
  =========================================================
  */

  const [
    modalSenha,
    setModalSenha,
  ] = useState(false)

  const [
    usuarioSenha,
    setUsuarioSenha,
  ] = useState<Usuario | null>(
    null
  )

  const [
    novaSenha,
    setNovaSenha,
  ] = useState('')

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState('')

  const [
    mostrarNovaSenha,
    setMostrarNovaSenha,
  ] = useState(false)

  const [
    mostrarConfirmacaoSenha,
    setMostrarConfirmacaoSenha,
  ] = useState(false)

  const [
    redefinindoSenha,
    setRedefinindoSenha,
  ] = useState(false)

  /*
  =========================================================
  EXCLUSÃO
  =========================================================
  */

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<string | null>(
    null
  )

  /*
  =========================================================
  UTILITÁRIOS
  =========================================================
  */

  function limparAlertas() {
    setMensagem('')
    setErro('')
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return 'Nunca'
    }

    const objetoData =
      new Date(data)

    if (
      Number.isNaN(
        objetoData.getTime()
      )
    ) {
      return '-'
    }

    return objetoData.toLocaleString(
      'pt-BR',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    )
  }

  function nomePerfil(
    perfil: PerfilUsuario
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

    return 'Visualizador'
  }

  function estiloPerfil(
    perfil: PerfilUsuario
  ) {
    if (
      perfil === 'administrador'
    ) {
      return `
        border-purple-500/30
        bg-purple-500/10
        text-purple-300
      `
    }

    if (
      perfil === 'operador'
    ) {
      return `
        border-cyan-500/30
        bg-cyan-500/10
        text-cyan-300
      `
    }

    return `
      border-slate-600
      bg-slate-800
      text-slate-300
    `
  }

  async function obterToken() {
    const {
      data: sessionData,
      error: sessionError,
    } =
      await supabase.auth.getSession()

    if (
      sessionError ||
      !sessionData.session
    ) {
      return null
    }

    return (
      sessionData.session
        .access_token
    )
  }

  /*
  =========================================================
  CARREGAR USUÁRIOS
  =========================================================
  */

  const carregarUsuarios =
    useCallback(async () => {
      setCarregandoUsuarios(true)

      try {
        const {
          data: sessionData,
        } =
          await supabase.auth.getSession()

        const token =
          sessionData.session
            ?.access_token

        if (!token) {
          router.replace('/login')
          return
        }

        const response =
          await fetch(
            '/api/admin/usuarios',
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: 'no-store',
            }
          )

        const resultado:
          RespostaApi =
            await response.json()

        if (!response.ok) {
          throw new Error(
            resultado.error ||
              'Não foi possível carregar os usuários.'
          )
        }

        setUsuarios(
          resultado.usuarios || []
        )
      } catch (error) {
        console.error(error)

        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar usuários.'
        )
      } finally {
        setCarregandoUsuarios(
          false
        )
      }
    }, [router])

  /*
  =========================================================
  VERIFICAR ADMINISTRADOR
  =========================================================
  */

  useEffect(() => {
    async function verificarAdministrador() {
      try {
        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !userData.user
        ) {
          router.replace(
            '/login'
          )

          return
        }

        const {
          data: perfil,
          error: perfilError,
        } = await supabase
          .from('perfis')
          .select(
            'nome, perfil'
          )
          .eq(
            'id',
            userData.user.id
          )
          .single()

        if (
          perfilError ||
          !perfil
        ) {
          await supabase.auth.signOut()

          router.replace(
            '/login'
          )

          return
        }

        if (
          perfil.perfil !==
          'administrador'
        ) {
          router.replace(
            '/dashboard'
          )

          return
        }

        setUsuarioAtualId(
          userData.user.id
        )

        setNomeAdministrador(
          perfil.nome ||
            'Administrador'
        )

        await carregarUsuarios()
      } catch (error) {
        console.error(error)

        setErro(
          'Não foi possível verificar suas permissões.'
        )
      } finally {
        setCarregandoPagina(
          false
        )
      }
    }

    verificarAdministrador()
  }, [
    router,
    carregarUsuarios,
  ])

  /*
  =========================================================
  CRIAR USUÁRIO
  =========================================================
  */

  function abrirModalCriar() {
    limparAlertas()

    setNovoNome('')
    setNovoEmail('')
    setNovaSenhaCriacao('')
    setNovoPerfil(
      'visualizador'
    )
    setMostrarSenhaCriacao(
      false
    )

    setModalCriar(true)
  }

  function fecharModalCriar() {
    if (criando) {
      return
    }

    setModalCriar(false)
  }

  async function criarUsuario() {
    limparAlertas()

    const nome =
      novoNome.trim()

    const email =
      novoEmail
        .trim()
        .toLowerCase()

    if (!nome) {
      setErro(
        'Informe o nome do usuário.'
      )
      return
    }

    if (!email) {
      setErro(
        'Informe o e-mail do usuário.'
      )
      return
    }

    if (
      novaSenhaCriacao.length <
      8
    ) {
      setErro(
        'A senha deve possuir pelo menos 8 caracteres.'
      )
      return
    }

    setCriando(true)

    try {
      const token =
        await obterToken()

      if (!token) {
        router.replace('/login')
        return
      }

      const response =
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
              nome,
              email,
              senha:
                novaSenhaCriacao,
              perfil:
                novoPerfil,
            }),
          }
        )

      const resultado:
        RespostaApi =
          await response.json()

      if (!response.ok) {
        throw new Error(
          resultado.error ||
            'Não foi possível criar o usuário.'
        )
      }

      setModalCriar(false)

      setMensagem(
        resultado.message ||
          'Usuário criado com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar usuário.'
      )
    } finally {
      setCriando(false)
    }
  }

  /*
  =========================================================
  EDITAR USUÁRIO
  =========================================================
  */

  function abrirModalEditar(
    usuario: Usuario
  ) {
    limparAlertas()

    setUsuarioEditando(
      usuario
    )

    setEditarNome(
      usuario.nome
    )

    setEditarPerfil(
      usuario.perfil
    )

    setModalEditar(true)
  }

  function fecharModalEditar() {
    if (salvandoEdicao) {
      return
    }

    setModalEditar(false)

    setUsuarioEditando(
      null
    )
  }

  async function salvarEdicao() {
    if (!usuarioEditando) {
      return
    }

    limparAlertas()

    const nome =
      editarNome.trim()

    if (!nome) {
      setErro(
        'Informe o nome do usuário.'
      )
      return
    }

    if (
      usuarioEditando.id ===
        usuarioAtualId &&
      editarPerfil !==
        'administrador'
    ) {
      setErro(
        'Você não pode remover sua própria permissão de administrador.'
      )
      return
    }

    setSalvandoEdicao(true)

    try {
      const token =
        await obterToken()

      if (!token) {
        router.replace('/login')
        return
      }

      const response =
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

              nome,

              perfil:
                editarPerfil,
            }),
          }
        )

      const resultado:
        RespostaApi =
          await response.json()

      if (!response.ok) {
        throw new Error(
          resultado.error ||
            'Não foi possível atualizar o usuário.'
        )
      }

      setModalEditar(false)

      setUsuarioEditando(
        null
      )

      setMensagem(
        resultado.message ||
          'Usuário atualizado com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar usuário.'
      )
    } finally {
      setSalvandoEdicao(
        false
      )
    }
  }

  /*
  =========================================================
  REDEFINIR SENHA
  =========================================================
  */

  function abrirModalSenha(
    usuario: Usuario
  ) {
    limparAlertas()

    setUsuarioSenha(
      usuario
    )

    setNovaSenha('')
    setConfirmarSenha('')

    setMostrarNovaSenha(
      false
    )

    setMostrarConfirmacaoSenha(
      false
    )

    setModalSenha(true)
  }

  function fecharModalSenha() {
    if (redefinindoSenha) {
      return
    }

    setModalSenha(false)

    setUsuarioSenha(
      null
    )

    setNovaSenha('')
    setConfirmarSenha('')
  }

  async function redefinirSenha() {
    if (!usuarioSenha) {
      return
    }

    limparAlertas()

    if (
      novaSenha.length < 8
    ) {
      setErro(
        'A nova senha deve possuir pelo menos 8 caracteres.'
      )
      return
    }

    if (
      novaSenha.length > 72
    ) {
      setErro(
        'A nova senha não pode ultrapassar 72 caracteres.'
      )
      return
    }

    if (
      novaSenha !==
      confirmarSenha
    ) {
      setErro(
        'As senhas informadas não são iguais.'
      )
      return
    }

    setRedefinindoSenha(
      true
    )

    try {
      const token =
        await obterToken()

      if (!token) {
        router.replace('/login')
        return
      }

      const response =
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
                usuarioSenha.id,

              novaSenha,
            }),
          }
        )

      const resultado:
        RespostaApi =
          await response.json()

      if (!response.ok) {
        throw new Error(
          resultado.error ||
            'Não foi possível redefinir a senha.'
        )
      }

      setModalSenha(false)

      setUsuarioSenha(
        null
      )

      setNovaSenha('')
      setConfirmarSenha('')

      setMensagem(
        resultado.message ||
          'Senha redefinida com sucesso.'
      )
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao redefinir senha.'
      )
    } finally {
      setRedefinindoSenha(
        false
      )
    }
  }

  /*
  =========================================================
  EXCLUIR USUÁRIO
  =========================================================
  */

  async function excluirUsuario(
    usuario: Usuario
  ) {
    limparAlertas()

    if (
      usuario.id ===
      usuarioAtualId
    ) {
      setErro(
        'Você não pode excluir sua própria conta.'
      )

      return
    }

    const confirmou =
      window.confirm(
        `Deseja realmente excluir o usuário "${usuario.nome}"?\n\nEsta ação não poderá ser desfeita.`
      )

    if (!confirmou) {
      return
    }

    setExcluindoId(
      usuario.id
    )

    try {
      const token =
        await obterToken()

      if (!token) {
        router.replace('/login')
        return
      }

      const response =
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
              id:
                usuario.id,
            }),
          }
        )

      const resultado:
        RespostaApi =
          await response.json()

      if (!response.ok) {
        throw new Error(
          resultado.error ||
            'Não foi possível excluir o usuário.'
        )
      }

      setMensagem(
        resultado.message ||
          'Usuário excluído com sucesso.'
      )

      await carregarUsuarios()
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir usuário.'
      )
    } finally {
      setExcluindoId(null)
    }
  }

  /*
  =========================================================
  LOADING
  =========================================================
  */

  if (carregandoPagina) {
    return (
      <main
        className="
          flex min-h-screen
          items-center
          justify-center
          bg-slate-950
          text-slate-100
        "
      >
        <div
          className="
            flex items-center
            gap-3
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            px-6 py-4
            shadow-2xl
          "
        >
          <Loader2
            className="
              h-5 w-5
              animate-spin
              text-cyan-400
            "
          />

          <span>
            Verificando permissões...
          </span>
        </div>
      </main>
    )
  }

  /*
  =========================================================
  INTERFACE
  =========================================================
  */

  return (
    <main
      className="
        min-h-screen
        bg-slate-950
        text-slate-100
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          px-4 py-6
          sm:px-6
          lg:px-8
        "
      >
        {/* HEADER */}

        <header
          className="
            mb-6
            rounded-3xl
            border
            border-slate-800
            bg-slate-900/80
            p-6
            shadow-2xl
            backdrop-blur
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  p-3
                "
              >
                <Users
                  className="
                    h-7 w-7
                    text-cyan-400
                  "
                />
              </div>

              <div>
                <p
                  className="
                    mb-1
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.25em]
                    text-cyan-400
                  "
                >
                  Administração
                </p>

                <h1
                  className="
                    text-2xl
                    font-bold
                    sm:text-3xl
                  "
                >
                  Gerenciamento de usuários
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  Controle de contas,
                  permissões e senhas
                  do sistema.
                </p>
              </div>
            </div>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/dashboard'
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  px-4 py-2.5
                  text-sm
                  font-medium
                  transition
                  hover:bg-slate-700
                "
              >
                <ArrowLeft
                  className="h-4 w-4"
                />

                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  limparAlertas()
                  carregarUsuarios()
                }}
                disabled={
                  carregandoUsuarios
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  px-4 py-2.5
                  text-sm
                  font-medium
                  transition
                  hover:bg-slate-700
                  disabled:opacity-50
                "
              >
                <RefreshCcw
                  className={
                    carregandoUsuarios
                      ? 'h-4 w-4 animate-spin'
                      : 'h-4 w-4'
                  }
                />

                Atualizar
              </button>

              <button
                type="button"
                onClick={
                  abrirModalCriar
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >
                <Plus
                  className="h-4 w-4"
                />

                Novo usuário
              </button>
            </div>
          </div>

          <div
            className="
              mt-5
              flex
              flex-wrap
              items-center
              gap-3
              border-t
              border-slate-800
              pt-4
              text-sm
              text-slate-400
            "
          >
            <ShieldCheck
              className="
                h-4 w-4
                text-emerald-400
              "
            />

            Logado como

            <span
              className="
                font-semibold
                text-slate-200
              "
            >
              {nomeAdministrador}
            </span>

            <span
              className="
                rounded-full
                border
                border-purple-500/30
                bg-purple-500/10
                px-2.5 py-1
                text-xs
                font-semibold
                text-purple-300
              "
            >
              Administrador
            </span>
          </div>
        </header>

        {/* ALERTAS */}

        {mensagem && (
          <div
            className="
              mb-5
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-emerald-500/30
              bg-emerald-500/10
              p-4
              text-sm
              text-emerald-200
            "
          >
            <CheckCircle2
              className="
                mt-0.5
                h-5 w-5
                shrink-0
              "
            />

            <span>
              {mensagem}
            </span>
          </div>
        )}

        {erro && (
          <div
            className="
              mb-5
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-500/30
              bg-red-500/10
              p-4
              text-sm
              text-red-200
            "
          >
            <XCircle
              className="
                mt-0.5
                h-5 w-5
                shrink-0
              "
            />

            <span>
              {erro}
            </span>
          </div>
        )}

        {/* RESUMO */}

        <section
          className="
            mb-6
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >
            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Total de usuários
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
              "
            >
              {usuarios.length}
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >
            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Administradores
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-purple-300
              "
            >
              {
                usuarios.filter(
                  (usuario) =>
                    usuario.perfil ===
                    'administrador'
                ).length
              }
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >
            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Operadores
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-cyan-300
              "
            >
              {
                usuarios.filter(
                  (usuario) =>
                    usuario.perfil ===
                    'operador'
                ).length
              }
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >
            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Visualizadores
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-slate-200
              "
            >
              {
                usuarios.filter(
                  (usuario) =>
                    usuario.perfil ===
                    'visualizador'
                ).length
              }
            </p>
          </div>
        </section>

        {/* TABELA */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            shadow-xl
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-800
              px-5 py-4
            "
          >
            <div>
              <h2
                className="
                  font-semibold
                  text-slate-100
                "
              >
                Usuários cadastrados
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Gerencie acesso,
                perfil e senha.
              </p>
            </div>
          </div>

          {carregandoUsuarios ? (
            <div
              className="
                flex
                items-center
                justify-center
                gap-3
                py-16
                text-slate-400
              "
            >
              <Loader2
                className="
                  h-5 w-5
                  animate-spin
                "
              />

              Carregando usuários...
            </div>
          ) : usuarios.length === 0 ? (
            <div
              className="
                py-16
                text-center
                text-slate-500
              "
            >
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  min-w-full
                  text-left
                  text-sm
                "
              >
                <thead
                  className="
                    bg-slate-950/50
                    text-xs
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  <tr>
                    <th
                      className="
                        px-5 py-4
                        font-medium
                      "
                    >
                      Usuário
                    </th>

                    <th
                      className="
                        px-5 py-4
                        font-medium
                      "
                    >
                      Perfil
                    </th>

                    <th
                      className="
                        px-5 py-4
                        font-medium
                      "
                    >
                      Criado em
                    </th>

                    <th
                      className="
                        px-5 py-4
                        font-medium
                      "
                    >
                      Último login
                    </th>

                    <th
                      className="
                        px-5 py-4
                        font-medium
                      "
                    >
                      Status
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-right
                        font-medium
                      "
                    >
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-800
                  "
                >
                  {usuarios.map(
                    (usuario) => (
                      <tr
                        key={
                          usuario.id
                        }
                        className="
                          transition
                          hover:bg-slate-800/40
                        "
                      >
                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-800
                              "
                            >
                              <UserRound
                                className="
                                  h-5 w-5
                                  text-slate-400
                                "
                              />
                            </div>

                            <div>
                              <p
                                className="
                                  font-semibold
                                  text-slate-200
                                "
                              >
                                {
                                  usuario.nome
                                }

                                {usuario.id ===
                                  usuarioAtualId && (
                                  <span
                                    className="
                                      ml-2
                                      text-xs
                                      font-normal
                                      text-cyan-400
                                    "
                                  >
                                    Você
                                  </span>
                                )}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-xs
                                  text-slate-500
                                "
                              >
                                {
                                  usuario.email
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              border
                              px-2.5 py-1
                              text-xs
                              font-semibold
                              ${estiloPerfil(
                                usuario.perfil
                              )}
                            `}
                          >
                            {nomePerfil(
                              usuario.perfil
                            )}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-5 py-4
                            text-slate-400
                          "
                        >
                          {formatarData(
                            usuario.criado_em
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-5 py-4
                            text-slate-400
                          "
                        >
                          {formatarData(
                            usuario.ultimo_login
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          {usuario.confirmado ? (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-medium
                                text-emerald-400
                              "
                            >
                              <CheckCircle2
                                className="
                                  h-4 w-4
                                "
                              />

                              Confirmado
                            </span>
                          ) : (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-medium
                                text-amber-400
                              "
                            >
                              <XCircle
                                className="
                                  h-4 w-4
                                "
                              />

                              Pendente
                            </span>
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <div
                            className="
                              flex
                              justify-end
                              gap-2
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirModalEditar(
                                  usuario
                                )
                              }
                              title="Editar usuário"
                              className="
                                inline-flex
                                h-9 w-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-700
                                bg-slate-800
                                text-slate-300
                                transition
                                hover:border-cyan-500/50
                                hover:bg-cyan-500/10
                                hover:text-cyan-300
                              "
                            >
                              <Pencil
                                className="
                                  h-4 w-4
                                "
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                abrirModalSenha(
                                  usuario
                                )
                              }
                              title="Redefinir senha"
                              className="
                                inline-flex
                                h-9 w-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-700
                                bg-slate-800
                                text-slate-300
                                transition
                                hover:border-amber-500/50
                                hover:bg-amber-500/10
                                hover:text-amber-300
                              "
                            >
                              <KeyRound
                                className="
                                  h-4 w-4
                                "
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
                                  usuarioAtualId ||
                                excluindoId ===
                                  usuario.id
                              }
                              title={
                                usuario.id ===
                                usuarioAtualId
                                  ? 'Você não pode excluir sua própria conta'
                                  : 'Excluir usuário'
                              }
                              className="
                                inline-flex
                                h-9 w-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-700
                                bg-slate-800
                                text-slate-300
                                transition
                                hover:border-red-500/50
                                hover:bg-red-500/10
                                hover:text-red-300
                                disabled:cursor-not-allowed
                                disabled:opacity-30
                              "
                            >
                              {excluindoId ===
                              usuario.id ? (
                                <Loader2
                                  className="
                                    h-4 w-4
                                    animate-spin
                                  "
                                />
                              ) : (
                                <Trash2
                                  className="
                                    h-4 w-4
                                  "
                                />
                              )}
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
        </section>
      </div>

      {/* =====================================================
          MODAL CRIAR USUÁRIO
      ===================================================== */}

      {modalCriar && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-3xl
              border
              border-slate-700
              bg-slate-900
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-800
                px-6 py-5
              "
            >
              <div>
                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  Novo usuário
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Crie uma nova conta
                  de acesso ao sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharModalCriar
                }
                disabled={criando}
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-800
                  hover:text-white
                "
              >
                <X
                  className="h-5 w-5"
                />
              </button>
            </div>

            <div
              className="
                space-y-5
                p-6
              "
            >
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  Nome
                </label>

                <input
                  type="text"
                  value={novoNome}
                  onChange={(event) =>
                    setNovoNome(
                      event.target.value
                    )
                  }
                  placeholder="Nome do usuário"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-4 py-3
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-cyan-500
                  "
                />
              </div>

              <div>
                <label
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  E-mail
                </label>

                <input
                  type="email"
                  value={novoEmail}
                  onChange={(event) =>
                    setNovoEmail(
                      event.target.value
                    )
                  }
                  placeholder="usuario@empresa.com"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-4 py-3
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-cyan-500
                  "
                />
              </div>

              <div>
                <label
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  Senha
                </label>

                <div
                  className="
                    relative
                  "
                >
                  <input
                    type={
                      mostrarSenhaCriacao
                        ? 'text'
                        : 'password'
                    }
                    value={
                      novaSenhaCriacao
                    }
                    onChange={(event) =>
                      setNovaSenhaCriacao(
                        event.target
                          .value
                      )
                    }
                    placeholder="Mínimo de 8 caracteres"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      px-4 py-3
                      pr-12
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-cyan-500
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenhaCriacao(
                        (
                          valor
                        ) => !valor
                      )
                    }
                    className="
                      absolute
                      right-3 top-1/2
                      -translate-y-1/2
                      text-slate-500
                      transition
                      hover:text-slate-200
                    "
                  >
                    {mostrarSenhaCriacao ? (
                      <EyeOff
                        className="
                          h-5 w-5
                        "
                      />
                    ) : (
                      <Eye
                        className="
                          h-5 w-5
                        "
                      />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  Perfil
                </label>

                <select
                  value={
                    novoPerfil
                  }
                  onChange={(event) =>
                    setNovoPerfil(
                      event.target
                        .value as PerfilUsuario
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-cyan-500
                  "
                >
                  <option
                    value="visualizador"
                  >
                    Visualizador
                  </option>

                  <option
                    value="operador"
                  >
                    Operador
                  </option>

                  <option
                    value="administrador"
                  >
                    Administrador
                  </option>
                </select>
              </div>
            </div>

            <div
              className="
                flex
                justify-end
                gap-3
                border-t
                border-slate-800
                px-6 py-5
              "
            >
              <button
                type="button"
                onClick={
                  fecharModalCriar
                }
                disabled={criando}
                className="
                  rounded-xl
                  border
                  border-slate-700
                  px-4 py-2.5
                  text-sm
                  font-medium
                  transition
                  hover:bg-slate-800
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  criarUsuario
                }
                disabled={criando}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                  disabled:opacity-50
                "
              >
                {criando ? (
                  <Loader2
                    className="
                      h-4 w-4
                      animate-spin
                    "
                  />
                ) : (
                  <Plus
                    className="
                      h-4 w-4
                    "
                  />
                )}

                Criar usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL EDITAR USUÁRIO
      ===================================================== */}

      {modalEditar &&
        usuarioEditando && (
          <div
            className="
              fixed inset-0 z-50
              flex items-center
              justify-center
              bg-black/70
              p-4
              backdrop-blur-sm
            "
          >
            <div
              className="
                w-full
                max-w-lg
                rounded-3xl
                border
                border-slate-700
                bg-slate-900
                shadow-2xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-800
                  px-6 py-5
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    Editar usuário
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    {
                      usuarioEditando.email
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fecharModalEditar
                  }
                  disabled={
                    salvandoEdicao
                  }
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-800
                    hover:text-white
                  "
                >
                  <X
                    className="
                      h-5 w-5
                    "
                  />
                </button>
              </div>

              <div
                className="
                  space-y-5
                  p-6
                "
              >
                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Nome
                  </label>

                  <input
                    type="text"
                    value={
                      editarNome
                    }
                    onChange={(
                      event
                    ) =>
                      setEditarNome(
                        event.target
                          .value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-cyan-500
                    "
                  />
                </div>

                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Perfil de acesso
                  </label>

                  <select
                    value={
                      editarPerfil
                    }
                    onChange={(
                      event
                    ) =>
                      setEditarPerfil(
                        event.target
                          .value as PerfilUsuario
                      )
                    }
                    disabled={
                      usuarioEditando.id ===
                      usuarioAtualId
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-cyan-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <option
                      value="visualizador"
                    >
                      Visualizador
                    </option>

                    <option
                      value="operador"
                    >
                      Operador
                    </option>

                    <option
                      value="administrador"
                    >
                      Administrador
                    </option>
                  </select>

                  {usuarioEditando.id ===
                    usuarioAtualId && (
                    <p
                      className="
                        mt-2
                        text-xs
                        text-amber-400
                      "
                    >
                      Seu próprio perfil
                      administrativo não
                      pode ser removido.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-slate-800
                  px-6 py-5
                "
              >
                <button
                  type="button"
                  onClick={
                    fecharModalEditar
                  }
                  disabled={
                    salvandoEdicao
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-700
                    px-4 py-2.5
                    text-sm
                    font-medium
                    transition
                    hover:bg-slate-800
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    salvarEdicao
                  }
                  disabled={
                    salvandoEdicao
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-cyan-500
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-cyan-400
                    disabled:opacity-50
                  "
                >
                  {salvandoEdicao ? (
                    <Loader2
                      className="
                        h-4 w-4
                        animate-spin
                      "
                    />
                  ) : (
                    <Pencil
                      className="
                        h-4 w-4
                      "
                    />
                  )}

                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          MODAL REDEFINIR SENHA
      ===================================================== */}

      {modalSenha &&
        usuarioSenha && (
          <div
            className="
              fixed inset-0 z-50
              flex items-center
              justify-center
              bg-black/70
              p-4
              backdrop-blur-sm
            "
          >
            <div
              className="
                w-full
                max-w-lg
                rounded-3xl
                border
                border-slate-700
                bg-slate-900
                shadow-2xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-800
                  px-6 py-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      rounded-xl
                      border
                      border-amber-500/20
                      bg-amber-500/10
                      p-2.5
                    "
                  >
                    <KeyRound
                      className="
                        h-5 w-5
                        text-amber-400
                      "
                    />
                  </div>

                  <div>
                    <h2
                      className="
                        text-xl
                        font-bold
                      "
                    >
                      Redefinir senha
                    </h2>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                      "
                    >
                      Alteração administrativa
                      de credencial.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    fecharModalSenha
                  }
                  disabled={
                    redefinindoSenha
                  }
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-800
                    hover:text-white
                  "
                >
                  <X
                    className="
                      h-5 w-5
                    "
                  />
                </button>
              </div>

              <div
                className="
                  space-y-5
                  p-6
                "
              >
                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-950/60
                    p-4
                  "
                >
                  <p
                    className="
                      font-semibold
                      text-slate-200
                    "
                  >
                    {
                      usuarioSenha.nome
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    {
                      usuarioSenha.email
                    }
                  </p>

                  <span
                    className={`
                      mt-3
                      inline-flex
                      rounded-full
                      border
                      px-2.5 py-1
                      text-xs
                      font-semibold
                      ${estiloPerfil(
                        usuarioSenha.perfil
                      )}
                    `}
                  >
                    {nomePerfil(
                      usuarioSenha.perfil
                    )}
                  </span>
                </div>

                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Nova senha
                  </label>

                  <div
                    className="
                      relative
                    "
                  >
                    <input
                      type={
                        mostrarNovaSenha
                          ? 'text'
                          : 'password'
                      }
                      value={
                        novaSenha
                      }
                      onChange={(
                        event
                      ) =>
                        setNovaSenha(
                          event.target
                            .value
                        )
                      }
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-950
                        px-4 py-3
                        pr-12
                        outline-none
                        transition
                        placeholder:text-slate-600
                        focus:border-amber-500
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarNovaSenha(
                          (
                            valor
                          ) =>
                            !valor
                        )
                      }
                      className="
                        absolute
                        right-3 top-1/2
                        -translate-y-1/2
                        text-slate-500
                        transition
                        hover:text-slate-200
                      "
                    >
                      {mostrarNovaSenha ? (
                        <EyeOff
                          className="
                            h-5 w-5
                          "
                        />
                      ) : (
                        <Eye
                          className="
                            h-5 w-5
                          "
                        />
                      )}
                    </button>
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      justify-between
                      text-xs
                    "
                  >
                    <span
                      className={
                        novaSenha.length >=
                        8
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }
                    >
                      Mínimo: 8 caracteres
                    </span>

                    <span
                      className="
                        text-slate-600
                      "
                    >
                      {
                        novaSenha.length
                      }
                      /72
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Confirmar nova senha
                  </label>

                  <div
                    className="
                      relative
                    "
                  >
                    <input
                      type={
                        mostrarConfirmacaoSenha
                          ? 'text'
                          : 'password'
                      }
                      value={
                        confirmarSenha
                      }
                      onChange={(
                        event
                      ) =>
                        setConfirmarSenha(
                          event.target
                            .value
                        )
                      }
                      placeholder="Digite a senha novamente"
                      autoComplete="new-password"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-950
                        px-4 py-3
                        pr-12
                        outline-none
                        transition
                        placeholder:text-slate-600
                        focus:border-amber-500
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarConfirmacaoSenha(
                          (
                            valor
                          ) =>
                            !valor
                        )
                      }
                      className="
                        absolute
                        right-3 top-1/2
                        -translate-y-1/2
                        text-slate-500
                        transition
                        hover:text-slate-200
                      "
                    >
                      {mostrarConfirmacaoSenha ? (
                        <EyeOff
                          className="
                            h-5 w-5
                          "
                        />
                      ) : (
                        <Eye
                          className="
                            h-5 w-5
                          "
                        />
                      )}
                    </button>
                  </div>

                  {confirmarSenha &&
                    novaSenha ===
                      confirmarSenha && (
                      <p
                        className="
                          mt-2
                          flex
                          items-center
                          gap-1.5
                          text-xs
                          text-emerald-400
                        "
                      >
                        <CheckCircle2
                          className="
                            h-3.5 w-3.5
                          "
                        />

                        As senhas são iguais.
                      </p>
                    )}

                  {confirmarSenha &&
                    novaSenha !==
                      confirmarSenha && (
                      <p
                        className="
                          mt-2
                          flex
                          items-center
                          gap-1.5
                          text-xs
                          text-red-400
                        "
                      >
                        <XCircle
                          className="
                            h-3.5 w-3.5
                          "
                        />

                        As senhas não são iguais.
                      </p>
                    )}
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-amber-500/20
                    bg-amber-500/5
                    p-4
                    text-sm
                    leading-relaxed
                    text-amber-200/80
                  "
                >
                  A senha será alterada
                  imediatamente. O usuário
                  deverá utilizar a nova
                  senha no próximo acesso.
                </div>
              </div>

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-slate-800
                  px-6 py-5
                "
              >
                <button
                  type="button"
                  onClick={
                    fecharModalSenha
                  }
                  disabled={
                    redefinindoSenha
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-700
                    px-4 py-2.5
                    text-sm
                    font-medium
                    transition
                    hover:bg-slate-800
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    redefinirSenha
                  }
                  disabled={
                    redefinindoSenha
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-amber-500
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-amber-400
                    disabled:opacity-50
                  "
                >
                  {redefinindoSenha ? (
                    <Loader2
                      className="
                        h-4 w-4
                        animate-spin
                      "
                    />
                  ) : (
                    <KeyRound
                      className="
                        h-4 w-4
                      "
                    />
                  )}

                  Redefinir senha
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  )
}