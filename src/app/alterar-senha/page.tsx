'use client'

import {
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
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

type PerfilUsuario =
  | 'administrador'
  | 'operador'
  | 'visualizador'

export default function AlterarSenhaPage() {
  const router = useRouter()

  const [
    carregandoPagina,
    setCarregandoPagina,
  ] = useState(true)

  const [
    nomeUsuario,
    setNomeUsuario,
  ] = useState('Usuário')

  const [
    emailUsuario,
    setEmailUsuario,
  ] = useState('')

  const [
    perfilUsuario,
    setPerfilUsuario,
  ] = useState<PerfilUsuario>(
    'visualizador'
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
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false)

  const [
    salvando,
    setSalvando,
  ] = useState(false)

  const [
    mensagem,
    setMensagem,
  ] = useState('')

  const [
    erro,
    setErro,
  ] = useState('')

  /*
  =========================================================
  VERIFICAR USUÁRIO
  =========================================================
  */

  useEffect(() => {
    async function verificarUsuario() {
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
          router.replace('/login')
          return
        }

        setEmailUsuario(
          userData.user.email || ''
        )

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

          router.replace('/login')

          return
        }

        setNomeUsuario(
          perfil.nome ||
            'Usuário'
        )

        setPerfilUsuario(
          perfil.perfil as PerfilUsuario
        )
      } catch (error) {
        console.error(error)

        setErro(
          'Não foi possível carregar os dados da sua conta.'
        )
      } finally {
        setCarregandoPagina(
          false
        )
      }
    }

    verificarUsuario()
  }, [router])

  /*
  =========================================================
  UTILITÁRIOS
  =========================================================
  */

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

  function voltar() {
    router.push('/dashboard')
  }

  /*
  =========================================================
  ALTERAR SENHA
  =========================================================
  */

  async function alterarSenha() {
    setMensagem('')
    setErro('')

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

    setSalvando(true)

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
        router.replace('/login')
        return
      }

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password:
            novaSenha,
        })

      if (updateError) {
        console.error(
          'Erro ao alterar senha:',
          updateError
        )

        throw new Error(
          'Não foi possível alterar sua senha.'
        )
      }

      setNovaSenha('')
      setConfirmarSenha('')

      setMensagem(
        'Senha alterada com sucesso.'
      )
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao alterar senha.'
      )
    } finally {
      setSalvando(false)
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
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
          text-slate-100
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            px-6
            py-4
            shadow-2xl
          "
        >
          <Loader2
            className="
              h-5
              w-5
              animate-spin
              text-cyan-400
            "
          />

          <span>
            Carregando sua conta...
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
        px-4
        py-8
        text-slate-100
        sm:px-6
      "
    >
      <div
        className="
          mx-auto
          max-w-3xl
        "
      >
        {/* HEADER */}

        <div
          className="
            mb-6
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <button
            type="button"
            onClick={voltar}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-medium
              transition
              hover:bg-slate-800
            "
          >
            <ArrowLeft
              className="h-4 w-4"
            />

            Dashboard
          </button>

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              text-slate-500
            "
          >
            <ShieldCheck
              className="
                h-4 w-4
                text-emerald-400
              "
            />

            Sessão autenticada
          </div>
        </div>

        {/* CARD PRINCIPAL */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            shadow-2xl
          "
        >
          <div
            className="
              border-b
              border-slate-800
              bg-slate-900/80
              p-6
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
                <KeyRound
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
                  Segurança da conta
                </p>

                <h1
                  className="
                    text-2xl
                    font-bold
                    sm:text-3xl
                  "
                >
                  Alterar minha senha
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-relaxed
                    text-slate-400
                  "
                >
                  Defina uma nova senha
                  para acessar o sistema.
                </p>
              </div>
            </div>
          </div>

          {/* USUÁRIO */}

          <div
            className="
              border-b
              border-slate-800
              p-6
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/50
                p-5
              "
            >
              <p
                className="
                  text-lg
                  font-semibold
                  text-slate-200
                "
              >
                {nomeUsuario}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                {emailUsuario}
              </p>

              <span
                className={`
                  mt-3
                  inline-flex
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-xs
                  font-semibold
                  ${estiloPerfil(
                    perfilUsuario
                  )}
                `}
              >
                {nomePerfil(
                  perfilUsuario
                )}
              </span>
            </div>
          </div>

          {/* ALERTAS */}

          <div
            className="
              space-y-4
              px-6
              pt-6
            "
          >
            {mensagem && (
              <div
                className="
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
                    h-5
                    w-5
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
                    h-5
                    w-5
                    shrink-0
                  "
                />

                <span>
                  {erro}
                </span>
              </div>
            )}
          </div>

          {/* FORMULÁRIO */}

          <div
            className="
              space-y-6
              p-6
            "
          >
            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-300
                "
              >
                Nova senha
              </label>

              <div
                className="relative"
              >
                <LockKeyhole
                  className="
                    absolute
                    left-4
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-slate-600
                  "
                />

                <input
                  type={
                    mostrarNovaSenha
                      ? 'text'
                      : 'password'
                  }
                  value={novaSenha}
                  onChange={(event) =>
                    setNovaSenha(
                      event.target.value
                    )
                  }
                  placeholder="Digite sua nova senha"
                  autoComplete="new-password"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    py-3
                    pl-12
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
                    setMostrarNovaSenha(
                      (valor) =>
                        !valor
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
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
                    novaSenha.length >= 8
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }
                >
                  Mínimo de 8 caracteres
                </span>

                <span
                  className="
                    text-slate-600
                  "
                >
                  {novaSenha.length}/72
                </span>
              </div>
            </div>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-300
                "
              >
                Confirmar nova senha
              </label>

              <div
                className="relative"
              >
                <LockKeyhole
                  className="
                    absolute
                    left-4
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-slate-600
                  "
                />

                <input
                  type={
                    mostrarConfirmacao
                      ? 'text'
                      : 'password'
                  }
                  value={
                    confirmarSenha
                  }
                  onChange={(event) =>
                    setConfirmarSenha(
                      event.target.value
                    )
                  }
                  placeholder="Digite novamente"
                  autoComplete="new-password"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    py-3
                    pl-12
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
                    setMostrarConfirmacao(
                      (valor) =>
                        !valor
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                    transition
                    hover:text-slate-200
                  "
                >
                  {mostrarConfirmacao ? (
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
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/5
                p-4
                text-sm
                leading-relaxed
                text-slate-400
              "
            >
              <p
                className="
                  font-medium
                  text-cyan-300
                "
              >
                Proteja sua conta
              </p>

              <p className="mt-1">
                Evite utilizar senhas
                fáceis ou reutilizar a
                mesma senha de outros
                serviços.
              </p>
            </div>
          </div>

          {/* BOTÕES */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-slate-800
              p-6
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={voltar}
              disabled={salvando}
              className="
                rounded-xl
                border
                border-slate-700
                px-5
                py-3
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
                alterarSenha
              }
              disabled={salvando}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {salvando ? (
                <Loader2
                  className="
                    h-4
                    w-4
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

              Alterar senha
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}