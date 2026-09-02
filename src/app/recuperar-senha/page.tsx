'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

export default function RecuperarSenhaPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  async function enviarRecuperacao() {
    setMensagem('')
    setErro('')

    const emailFormatado =
      email.trim().toLowerCase()

    if (!emailFormatado) {
      setErro(
        'Informe seu e-mail.'
      )
      return
    }

    setEnviando(true)

    try {
      const redirectTo =
        `${window.location.origin}/redefinir-senha`

      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          emailFormatado,
          {
            redirectTo,
          }
        )

      if (resetError) {
        console.error(
          'Erro ao solicitar recuperação:',
          resetError
        )

        throw new Error(
          'Não foi possível processar sua solicitação.'
        )
      }

      /*
        Mensagem propositalmente genérica.

        Isso evita informar se o e-mail
        está ou não cadastrado no sistema.
      */
      setMensagem(
        'Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.'
      )

      setEmail('')
    } catch (error) {
      console.error(error)

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao solicitar recuperação de senha.'
      )
    } finally {
      setEnviando(false)
    }
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
      <div
        className="
          w-full
          max-w-lg
        "
      >
        <button
          type="button"
          onClick={() =>
            router.push('/login')
          }
          className="
            mb-5
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

          Voltar ao login
        </button>

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
                <Mail
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
                  Esqueci minha senha
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-relaxed
                    text-slate-400
                  "
                >
                  Informe o e-mail
                  utilizado no sistema.
                </p>
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
                  leading-relaxed
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
                E-mail
              </label>

              <div className="relative">
                <Mail
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
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      enviarRecuperacao()
                    }
                  }}
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    py-3
                    pl-12
                    pr-4
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-cyan-500
                  "
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                enviarRecuperacao
              }
              disabled={enviando}
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
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {enviando ? (
                <Loader2
                  className="
                    h-4 w-4
                    animate-spin
                  "
                />
              ) : (
                <Mail
                  className="
                    h-4 w-4
                  "
                />
              )}

              Enviar instruções
            </button>

            <div
              className="
                flex
                items-start
                gap-3
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/50
                p-4
                text-sm
                leading-relaxed
                text-slate-500
              "
            >
              <ShieldCheck
                className="
                  mt-0.5
                  h-5 w-5
                  shrink-0
                  text-emerald-400
                "
              />

              <p>
                Por segurança, o sistema
                não informa se determinado
                e-mail possui uma conta
                cadastrada.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}