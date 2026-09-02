'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'

import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] = useState(true)

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    senha,
    setSenha,
  ] = useState('')

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false)

  const [
    carregando,
    setCarregando,
  ] = useState(false)

  const [
    erro,
    setErro,
  ] = useState('')

  /*
  =========================================================
  VERIFICAR SE JÁ EXISTE SESSÃO
  =========================================================
  */

  useEffect(() => {
    async function verificarSessao() {
      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (session?.user) {
          /*
            Antes de liberar o Dashboard,
            confirmamos se existe um perfil
            cadastrado para este usuário.
          */

          const {
            data: perfil,
            error: perfilError,
          } = await supabase
            .from('perfis')
            .select(
              'id, nome, perfil'
            )
            .eq(
              'id',
              session.user.id
            )
            .single()

          if (
            !perfilError &&
            perfil
          ) {
            router.replace(
              '/dashboard'
            )

            return
          }

          /*
            Caso exista uma sessão,
            mas o usuário não possua perfil,
            encerramos a sessão.
          */

          await supabase.auth.signOut()
        }
      } catch (error) {
        console.error(
          'Erro ao verificar sessão:',
          error
        )
      } finally {
        setVerificandoSessao(
          false
        )
      }
    }

    verificarSessao()
  }, [router])

  /*
  =========================================================
  LOGIN
  =========================================================
  */

  async function entrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setErro('')

    const emailFormatado =
      email
        .trim()
        .toLowerCase()

    if (!emailFormatado) {
      setErro(
        'Informe seu e-mail.'
      )

      return
    }

    if (!senha) {
      setErro(
        'Informe sua senha.'
      )

      return
    }

    setCarregando(true)

    try {
      /*
        Realiza login no Supabase Auth.
      */

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              emailFormatado,

            password:
              senha,
          }
        )

      if (
        loginError ||
        !loginData.user
      ) {
        console.error(
          'Erro no login:',
          loginError
        )

        throw new Error(
          'E-mail ou senha incorretos.'
        )
      }

      /*
        Confirma se o usuário possui
        um perfil válido no sistema.
      */

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(
          'id, nome, perfil'
        )
        .eq(
          'id',
          loginData.user.id
        )
        .single()

      if (
        perfilError ||
        !perfil
      ) {
        console.error(
          'Perfil não encontrado:',
          perfilError
        )

        await supabase.auth.signOut()

        throw new Error(
          'Sua conta não possui permissão de acesso ao sistema.'
        )
      }

      /*
        Confirma que o perfil armazenado
        possui um dos valores permitidos.
      */

      const perfisPermitidos = [
        'administrador',
        'operador',
        'visualizador',
      ]

      if (
        !perfisPermitidos.includes(
          perfil.perfil
        )
      ) {
        await supabase.auth.signOut()

        throw new Error(
          'O perfil desta conta é inválido. Entre em contato com o administrador.'
        )
      }

      /*
        Login aprovado.
      */

      router.replace(
        '/dashboard'
      )
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível realizar o login.'
      )
    } finally {
      setCarregando(false)
    }
  }

  /*
  =========================================================
  CARREGANDO SESSÃO
  =========================================================
  */

  if (verificandoSessao) {
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

          <span
            className="
              text-sm
              text-slate-300
            "
          >
            Verificando sessão...
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
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-slate-950
        px-4
        py-10
        text-slate-100
      "
    >
      {/* ELEMENTOS DE FUNDO */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-40
            -top-40
            h-96
            w-96
            rounded-full
            bg-cyan-500/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-40
            -right-40
            h-96
            w-96
            rounded-full
            bg-blue-500/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[500px]
            w-[500px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-cyan-950/10
            blur-3xl
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          grid
          w-full
          max-w-5xl
          overflow-hidden
          rounded-3xl
          border
          border-slate-800
          bg-slate-900/90
          shadow-2xl
          backdrop-blur-xl
          lg:grid-cols-2
        "
      >
        {/* =====================================================
            LADO ESQUERDO
        ===================================================== */}

        <section
          className="
            relative
            hidden
            min-h-[650px]
            overflow-hidden
            border-r
            border-slate-800
            bg-slate-950
            p-10
            lg:flex
            lg:flex-col
            lg:justify-between
          "
        >
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-br
              from-cyan-500/10
              via-transparent
              to-blue-500/5
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-3
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-4
                py-3
              "
            >
              <Camera
                className="
                  h-7
                  w-7
                  text-cyan-400
                "
              />

              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    tracking-wide
                    text-slate-100
                  "
                >
                  SMART CITY
                </p>

                <p
                  className="
                    text-xs
                    text-cyan-400
                  "
                >
                  Monitoramento
                </p>
              </div>
            </div>

            <div
              className="
                mt-16
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.3em]
                  text-cyan-400
                "
              >
                Centro de operações
              </p>

              <h1
                className="
                  mt-4
                  max-w-md
                  text-4xl
                  font-bold
                  leading-tight
                  text-white
                "
              >
                Monitoramento
                inteligente de
                câmeras
              </h1>

              <p
                className="
                  mt-5
                  max-w-md
                  text-sm
                  leading-7
                  text-slate-400
                "
              >
                Ambiente centralizado
                para acompanhamento da
                disponibilidade,
                implantação e evolução
                do projeto.
              </p>
            </div>
          </div>

          <div
            className="
              relative
              z-10
              space-y-4
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
                bg-slate-900/60
                p-4
              "
            >
              <ShieldCheck
                className="
                  h-5
                  w-5
                  shrink-0
                  text-emerald-400
                "
              />

              <div>
                <p
                  className="
                    text-sm
                    font-medium
                    text-slate-200
                  "
                >
                  Acesso protegido
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Apenas usuários
                  autorizados podem
                  acessar a plataforma.
                </p>
              </div>
            </div>

            <p
              className="
                text-xs
                leading-relaxed
                text-slate-600
              "
            >
              Sistema de uso restrito.
              As ações realizadas
              podem ser registradas
              para fins de auditoria.
            </p>
          </div>
        </section>

        {/* =====================================================
            LOGIN
        ===================================================== */}

        <section
          className="
            flex
            min-h-[650px]
            items-center
            p-6
            sm:p-10
            lg:p-12
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-md
            "
          >
            {/* LOGO MOBILE */}

            <div
              className="
                mb-8
                flex
                items-center
                gap-3
                lg:hidden
              "
            >
              <div
                className="
                  rounded-xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  p-2.5
                "
              >
                <Camera
                  className="
                    h-6
                    w-6
                    text-cyan-400
                  "
                />
              </div>

              <div>
                <p
                  className="
                    font-bold
                    text-slate-100
                  "
                >
                  Smart City
                </p>

                <p
                  className="
                    text-xs
                    text-cyan-400
                  "
                >
                  Monitoramento
                </p>
              </div>
            </div>

            <div
              className="
                mb-8
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-cyan-400
                "
              >
                Acesso ao sistema
              </p>

              <h2
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-white
                "
              >
                Bem-vindo
              </h2>

              <p
                className="
                  mt-3
                  text-sm
                  leading-relaxed
                  text-slate-400
                "
              >
                Entre com suas
                credenciais para
                acessar o painel de
                monitoramento.
              </p>
            </div>

            {/* ERRO */}

            {erro && (
              <div
                className="
                  mb-6
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

            {/* FORMULÁRIO */}

            <form
              onSubmit={entrar}
              className="
                space-y-5
              "
            >
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  E-mail
                </label>

                <div
                  className="
                    relative
                  "
                >
                  <Mail
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
                    id="email"
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
                    disabled={
                      carregando
                    }
                    autoComplete="email"
                    placeholder="usuario@empresa.com"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      py-3.5
                      pl-12
                      pr-4
                      text-slate-100
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-cyan-500
                      focus:ring-2
                      focus:ring-cyan-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </div>

              {/* SENHA */}

              <div>
                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <label
                    htmlFor="senha"
                    className="
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Senha
                  </label>

                  {/* 17.3 - RECUPERAÇÃO */}

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        '/recuperar-senha'
                      )
                    }
                    disabled={
                      carregando
                    }
                    className="
                      text-xs
                      font-semibold
                      text-cyan-400
                      transition
                      hover:text-cyan-300
                      hover:underline
                      disabled:opacity-50
                    "
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div
                  className="
                    relative
                  "
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
                    id="senha"
                    type={
                      mostrarSenha
                        ? 'text'
                        : 'password'
                    }
                    value={senha}
                    onChange={(
                      event
                    ) =>
                      setSenha(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      carregando
                    }
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      py-3.5
                      pl-12
                      pr-12
                      text-slate-100
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-cyan-500
                      focus:ring-2
                      focus:ring-cyan-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(
                        (
                          valor
                        ) => !valor
                      )
                    }
                    disabled={
                      carregando
                    }
                    aria-label={
                      mostrarSenha
                        ? 'Ocultar senha'
                        : 'Mostrar senha'
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-500
                      transition
                      hover:text-slate-200
                      disabled:opacity-50
                    "
                  >
                    {mostrarSenha ? (
                      <EyeOff
                        className="
                          h-5
                          w-5
                        "
                      />
                    ) : (
                      <Eye
                        className="
                          h-5
                          w-5
                        "
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* BOTÃO */}

              <button
                type="submit"
                disabled={
                  carregando
                }
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-5
                  py-3.5
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-cyan-500
                  focus:ring-offset-2
                  focus:ring-offset-slate-900
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {carregando ? (
                  <>
                    <Loader2
                      className="
                        h-5
                        w-5
                        animate-spin
                      "
                    />

                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn
                      className="
                        h-5
                        w-5
                      "
                    />

                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* RODAPÉ */}

            <div
              className="
                mt-8
                border-t
                border-slate-800
                pt-6
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-4
                "
              >
                <ShieldCheck
                  className="
                    mt-0.5
                    h-5
                    w-5
                    shrink-0
                    text-emerald-400
                  "
                />

                <div>
                  <p
                    className="
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Ambiente seguro
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-relaxed
                      text-slate-500
                    "
                  >
                    Suas credenciais são
                    utilizadas somente
                    para autenticação no
                    sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}