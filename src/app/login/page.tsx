'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Camera,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [verificandoSessao, setVerificandoSessao] =
    useState(true)

  useEffect(() => {
    verificarSessao()
  }, [])

  async function verificarSessao() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      router.replace('/dashboard')
      return
    }

    setVerificandoSessao(false)
  }

  async function entrar(event: FormEvent) {
    event.preventDefault()

    setErro('')
    setCarregando(true)

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })

    if (error || !data.user) {
      setErro('E-mail ou senha inválidos.')
      setCarregando(false)
      return
    }

    const { data: perfilUsuario, error: perfilError } =
      await supabase
        .from('perfis')
        .select('perfil')
        .eq('id', data.user.id)
        .single()

    if (perfilError || !perfilUsuario) {
      await supabase.auth.signOut()

      setErro(
        'Seu usuário não possui um perfil cadastrado no sistema.'
      )

      setCarregando(false)
      return
    }

    router.replace('/dashboard')
  }

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />

          <p className="text-sm text-slate-400">
            Verificando acesso...
          </p>

        </div>

      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">

      {/* EFEITOS DE FUNDO */}
      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="absolute bottom-[-200px] right-[-150px] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-3xl" />

      </div>

      {/* LOGIN */}
      <div className="relative z-10 w-full max-w-md">

        {/* IDENTIDADE */}
        <div className="mb-7 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">

            <Camera size={32} />

          </div>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
            Smart City
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Monitoramento de Câmeras
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Acesse o painel de acompanhamento operacional.
          </p>

        </div>

        {/* CARD */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl backdrop-blur">

          <div className="mb-6">

            <h2 className="text-xl font-semibold text-white">
              Acessar sistema
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Informe suas credenciais para continuar.
            </p>

          </div>

          <form
            onSubmit={entrar}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                E-mail
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                />

              </div>

            </div>

            {/* SENHA */}
            <div>

              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Senha
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="senha"
                  type={
                    mostrarSenha
                      ? 'text'
                      : 'password'
                  }
                  value={senha}
                  onChange={(e) =>
                    setSenha(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  title={
                    mostrarSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >

                  {mostrarSenha ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>

            {/* ERRO */}
            {erro && (
              <div className="rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
                {erro}
              </div>
            )}

            {/* ENTRAR */}
            <button
              type="submit"
              disabled={carregando}
              className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {carregando
                ? 'Entrando...'
                : 'Entrar'}

            </button>

          </form>

        </div>

        {/* RODAPÉ */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Sistema de Monitoramento • Smart City
        </p>

      </div>

    </main>
  )
}