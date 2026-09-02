'use client'

import {
  useEffect,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  XCircle,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

export default function RedefinirSenhaPage() {
  const router = useRouter()

  const [
    verificando,
    setVerificando,
  ] = useState(true)

  const [
    sessaoValida,
    setSessaoValida,
  ] = useState(false)

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

  useEffect(() => {
    let montado = true

    async function verificarSessao() {
      try {
        /*
          Dependendo da configuração/versão
          do Supabase, a sessão pode ser
          disponibilizada após o retorno
          do link de recuperação.
        */
        const {
          data,
        } =
          await supabase.auth.getSession()

        if (
          montado &&
          data.session
        ) {
          setSessaoValida(true)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (montado) {
          setVerificando(false)
        }
      }
    }

    verificarSessao()

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (!montado) {
            return
          }

          if (
            event ===
              'PASSWORD_RECOVERY' ||
            session
          ) {
            setSessaoValida(true)
            setVerificando(false)
          }
        }
      )

    return () => {
      montado = false

      authListener.subscription.unsubscribe()
    }
  }, [])

  async function redefinirSenha() {
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
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password:
            novaSenha,
        })

      if (updateError) {
        console.error(
          'Erro ao redefinir senha:',
          updateError
        )

        throw new Error(
          'Não foi possível redefinir sua senha. O link pode ter expirado.'
        )
      }

      setMensagem(
        'Senha redefinida com sucesso. Você será direcionado para o login.'
      )

      setNovaSenha('')
      setConfirmarSenha('')

      /*
        Encerramos a sessão de recuperação
        após a troca para exigir login
        com a nova senha.
      */
      await supabase.auth.signOut()

      window.setTimeout(
        () => {
          router.replace(
            '/login'
          )
        },
        1800
      )
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao redefinir senha.'
      )
    } finally {
      setSalvando(false)
    }
  }

  if (verificando) {
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
          "
        >
          <Loader2
            className="
              h-5 w-5
              animate-spin
              text-cyan-400
            "
          />

          Validando link...
        </div>
      </main>
    )
  }

  if (!sessaoValida) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
          px-4
          text-slate-100
        "
      >
        <div
          className="
            w-full
            max-w-lg
            rounded-3xl
            border
            border-red-500/20
            bg-slate-900
            p-7
            text-center
            shadow-2xl
          "
        >
          <ShieldAlert
            className="
              mx-auto
              h-12 w-12
              text-red-400
            "
          />

          <h1
            className="
              mt-4
              text-2xl
              font-bold
            "
          >
            Link inválido ou expirado
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
            "
          >
            Solicite um novo link
            de recuperação de senha.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/recuperar-senha'
              )
            }
            className="
              mt-6
              w-full
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Solicitar novo link
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-950
        px-4
        py-8
        text-slate-100
      "
    >
      <section
        className="
          w-full
          max-w-lg
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
            p-6
          "
        >
          <div
            className="
              flex
              items-center
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
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-cyan-400
                "
              >
                Recuperação de acesso
              </p>

              <h1
                className="
                  mt-1
                  text-2xl
                  font-bold
                "
              >
                Criar nova senha
              </h1>
            </div>
          </div>
        </div>

        <div
          className="
            space-y-5
            p-6
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
                  h-5 w-5
                  shrink-0
                "
              />

              {mensagem}
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
                  h-5 w-5
                  shrink-0
                "
              />

              {erro}
            </div>
          )}

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

            <div className="relative">
              <LockKeyhole
                className="
                  absolute
                  left-4
                  top-1/2
                  h-5 w-5
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
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
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
                  focus:border-cyan-500
                "
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarNovaSenha(
                    (valor) => !valor
                  )
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              >
                {mostrarNovaSenha ? (
                  <EyeOff
                    className="h-5 w-5"
                  />
                ) : (
                  <Eye
                    className="h-5 w-5"
                  />
                )}
              </button>
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

            <div className="relative">
              <LockKeyhole
                className="
                  absolute
                  left-4
                  top-1/2
                  h-5 w-5
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
                autoComplete="new-password"
                placeholder="Digite novamente"
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
                  focus:border-cyan-500
                "
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacao(
                    (valor) => !valor
                  )
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              >
                {mostrarConfirmacao ? (
                  <EyeOff
                    className="h-5 w-5"
                  />
                ) : (
                  <Eye
                    className="h-5 w-5"
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
          </div>

          <button
            type="button"
            onClick={
              redefinirSenha
            }
            disabled={salvando}
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              disabled:opacity-50
            "
          >
            {salvando ? (
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

            Salvar nova senha
          </button>
        </div>
      </section>
    </main>
  )
}