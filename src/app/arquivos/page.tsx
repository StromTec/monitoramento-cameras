'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Upload,
  FileText,
  Eye,
  RefreshCcw,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react'

type Arquivo = {
  id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string | null
  tamanho: number | null
  enviado_por: string | null
  criado_em: string
}

export default function ArquivosPage() {
  const router = useRouter()

  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [arquivoSelecionado, setArquivoSelecionado] =
    useState<File | null>(null)

  const [perfil, setPerfil] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    iniciarPagina()
  }, [])

  async function iniciarPagina() {
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

    const { data: perfilUsuario, error: perfilError } =
      await supabase
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

    await carregarArquivos()
  }

  async function carregarArquivos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('arquivos')
      .select('*')
      .order('criado_em', {
        ascending: false,
      })

    if (error) {
      setErro(
        `Erro ao carregar arquivos: ${error.message}`
      )
    } else {
      setArquivos(data || [])
    }

    setCarregando(false)
  }

  function selecionarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) {
      return
    }

    setArquivoSelecionado(arquivo)
    setMensagem('')
    setErro('')
  }

  async function enviarArquivo() {
    if (!podeEditar) {
      setErro(
        'Seu usuário não possui permissão para enviar arquivos.'
      )
      return
    }

    if (!arquivoSelecionado) {
      setErro('Selecione um arquivo.')
      return
    }

    setErro('')
    setMensagem('')
    setEnviando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErro('Usuário não autenticado.')
      setEnviando(false)
      return
    }

    const extensao =
      arquivoSelecionado.name.split('.').pop() ||
      'arquivo'

    const nomeSeguro =
      arquivoSelecionado.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')

    const caminhoArquivo =
      `${user.id}/${Date.now()}-${nomeSeguro}`

    const { error: storageError } =
      await supabase.storage
        .from('arquivos')
        .upload(
          caminhoArquivo,
          arquivoSelecionado,
          {
            cacheControl: '3600',
            upsert: false,
          }
        )

    if (storageError) {
      setErro(
        `Erro ao enviar arquivo: ${storageError.message}`
      )
      setEnviando(false)
      return
    }

    const { error: bancoError } =
      await supabase
        .from('arquivos')
        .insert({
          nome_arquivo:
            arquivoSelecionado.name,

          caminho_arquivo:
            caminhoArquivo,

          tipo_arquivo:
            arquivoSelecionado.type ||
            extensao,

          tamanho:
            arquivoSelecionado.size,

          enviado_por:
            user.id,
        })

    if (bancoError) {
      setErro(
        `Arquivo enviado ao Storage, mas ocorreu erro ao registrar no banco: ${bancoError.message}`
      )
      setEnviando(false)
      return
    }

    setArquivoSelecionado(null)

    setMensagem(
      'Arquivo enviado com sucesso!'
    )

    setEnviando(false)

    await carregarArquivos()
  }

  async function visualizarArquivo(
    caminhoArquivo: string
  ) {
    setErro('')

    const { data, error } =
      await supabase.storage
        .from('arquivos')
        .createSignedUrl(
          caminhoArquivo,
          60 * 10
        )

    if (error || !data) {
      setErro(
        `Não foi possível abrir o arquivo: ${
          error?.message ||
          'Erro desconhecido'
        }`
      )
      return
    }

    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  function formatarData(data: string) {
    return new Date(
      data
    ).toLocaleString('pt-BR')
  }

  function formatarTamanho(
    bytes: number | null
  ) {
    if (!bytes) {
      return '-'
    }

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`
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

  const podeEditar =
    perfil === 'administrador' ||
    perfil === 'operador'

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        {/* VOLTAR */}
        <button
          onClick={() =>
            router.push('/dashboard')
          }
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />

          Voltar ao Dashboard
        </button>

        {/* CABEÇALHO */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
                Smart City
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Arquivos da Produção
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Consulte os documentos utilizados no acompanhamento da produção.
              </p>

              {nomeUsuario && (
                <div className="mt-4 flex flex-wrap items-center gap-2">

                  <span className="text-sm text-slate-400">
                    {nomeUsuario}
                  </span>

                  <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {nomePerfil()}
                  </span>

                </div>
              )}

            </div>

            <FolderOpen
              size={44}
              className="text-sky-400"
            />

          </div>

        </div>

        {/* ÁREA DE UPLOAD - SOMENTE ADMIN / OPERADOR */}
        {podeEditar && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-7">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Adicionar arquivo
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Envie documentos utilizados na produção.
                </p>

              </div>

              <ShieldCheck
                size={24}
                className="text-emerald-400"
              />

            </div>

            <p className="mt-4 text-xs text-slate-500">
              XML, PDF, XLSX, XLS, CSV, TXT e outros documentos.
            </p>

            <div className="mt-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-8 text-center">

              <Upload
                size={34}
                className="mx-auto mb-4 text-sky-400"
              />

              <input
                type="file"
                onChange={
                  selecionarArquivo
                }
                className="mx-auto block max-w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-sky-500"
              />

              {arquivoSelecionado && (
                <div className="mt-5 rounded-lg bg-slate-900 p-4">

                  <p className="font-medium text-white">
                    {
                      arquivoSelecionado.name
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatarTamanho(
                      arquivoSelecionado.size
                    )}
                  </p>

                </div>
              )}

            </div>

            <button
              onClick={enviarArquivo}
              disabled={
                enviando ||
                !arquivoSelecionado
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-4 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload size={19} />

              {enviando
                ? 'Enviando arquivo...'
                : 'Enviar arquivo'}
            </button>

          </div>
        )}

        {/* AVISO PARA VISUALIZADOR */}
        {perfil === 'visualizador' && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex items-center gap-3">

              <ShieldCheck
                size={20}
                className="text-sky-400"
              />

              <div>

                <p className="font-medium text-slate-200">
                  Acesso de visualização
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Seu usuário pode consultar os documentos, mas não possui permissão para enviar novos arquivos.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ERRO */}
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {/* SUCESSO */}
        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        {/* LISTA DE ARQUIVOS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">

          <div className="flex items-center justify-between border-b border-slate-800 p-6">

            <div>

              <h2 className="text-lg font-semibold">
                Documentos enviados
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {arquivos.length}{' '}
                arquivo(s)
              </p>

            </div>

            <button
              onClick={
                carregarArquivos
              }
              className="rounded-xl border border-slate-700 p-3 text-slate-300 transition hover:bg-slate-800"
              title="Atualizar lista"
            >
              <RefreshCcw
                size={18}
              />
            </button>

          </div>

          {carregando ? (

            <div className="p-10 text-center text-slate-400">
              Carregando arquivos...
            </div>

          ) : arquivos.length === 0 ? (

            <div className="p-12 text-center">

              <FileText
                size={40}
                className="mx-auto text-slate-600"
              />

              <p className="mt-4 text-slate-400">
                Nenhum arquivo enviado.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-950/50">

                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      Arquivo
                    </th>

                    <th className="px-6 py-4">
                      Data
                    </th>

                    <th className="px-6 py-4">
                      Tamanho
                    </th>

                    <th className="px-6 py-4 text-right">
                      Ação
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {arquivos.map(
                    (arquivo) => (

                      <tr
                        key={arquivo.id}
                        className="transition hover:bg-slate-800/40"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">

                              <FileText
                                size={19}
                              />

                            </div>

                            <div>

                              <p className="font-medium">
                                {
                                  arquivo.nome_arquivo
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  arquivo.tipo_arquivo ||
                                  'Arquivo'
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-5 text-sm text-slate-400">

                          {formatarData(
                            arquivo.criado_em
                          )}

                        </td>

                        <td className="px-6 py-5 text-sm text-slate-400">

                          {formatarTamanho(
                            arquivo.tamanho
                          )}

                        </td>

                        <td className="px-6 py-5 text-right">

                          <button
                            onClick={() =>
                              visualizarArquivo(
                                arquivo.caminho_arquivo
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                          >
                            <Eye size={16} />

                            Visualizar
                          </button>

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

    </main>
  )
}