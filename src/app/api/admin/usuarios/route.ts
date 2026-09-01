import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function criarAdminClient() {
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function verificarAdministrador(
  request: NextRequest
) {
  const authorization =
    request.headers.get('authorization')

  if (
    !authorization ||
    !authorization.startsWith('Bearer ')
  ) {
    return {
      autorizado: false,
      usuario: null,
      erro: 'Token não informado.',
    }
  }

  const token =
    authorization.replace('Bearer ', '')

  const admin = criarAdminClient()

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return {
      autorizado: false,
      usuario: null,
      erro: 'Sessão inválida.',
    }
  }

  const {
    data: perfil,
    error: perfilError,
  } = await admin
    .from('perfis')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (
    perfilError ||
    !perfil ||
    perfil.perfil !== 'administrador'
  ) {
    return {
      autorizado: false,
      usuario: user,
      erro:
        'Apenas administradores podem acessar esta área.',
    }
  }

  return {
    autorizado: true,
    usuario: user,
    erro: null,
  }
}

/*
====================================================
LISTAR USUÁRIOS
====================================================
*/

export async function GET(
  request: NextRequest
) {
  try {
    const verificacao =
      await verificarAdministrador(request)

    if (!verificacao.autorizado) {
      return NextResponse.json(
        {
          error: verificacao.erro,
        },
        {
          status: 403,
        }
      )
    }

    const admin = criarAdminClient()

    const {
      data: usuariosAuth,
      error: authError,
    } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 500,
        }
      )
    }

    const {
      data: perfis,
      error: perfisError,
    } = await admin
      .from('perfis')
      .select(
        'id, nome, perfil, criado_em'
      )

    if (perfisError) {
      return NextResponse.json(
        {
          error: perfisError.message,
        },
        {
          status: 500,
        }
      )
    }

    const mapaPerfis = new Map(
      (perfis || []).map((perfil) => [
        perfil.id,
        perfil,
      ])
    )

    const usuarios =
      usuariosAuth.users.map(
        (usuario) => {
          const perfil =
            mapaPerfis.get(usuario.id)

          return {
            id: usuario.id,
            email:
              usuario.email || '',
            nome:
              perfil?.nome ||
              'Sem nome',
            perfil:
              perfil?.perfil ||
              'visualizador',
            criado_em:
              usuario.created_at,
            ultimo_login:
              usuario.last_sign_in_at ||
              null,
            confirmado:
              Boolean(
                usuario.email_confirmed_at
              ),
          }
        }
      )

    usuarios.sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        'pt-BR'
      )
    )

    return NextResponse.json({
      usuarios,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Erro interno ao listar usuários.',
      },
      {
        status: 500,
      }
    )
  }
}

/*
====================================================
CRIAR USUÁRIO
====================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const verificacao =
      await verificarAdministrador(request)

    if (!verificacao.autorizado) {
      return NextResponse.json(
        {
          error: verificacao.erro,
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const nome =
      String(body.nome || '').trim()

    const email =
      String(body.email || '')
        .trim()
        .toLowerCase()

    const senha =
      String(body.senha || '')

    const perfil =
      String(body.perfil || '')

    if (!nome) {
      return NextResponse.json(
        {
          error:
            'Informe o nome do usuário.',
        },
        {
          status: 400,
        }
      )
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            'Informe o e-mail do usuário.',
        },
        {
          status: 400,
        }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        {
          error:
            'A senha deve possuir pelo menos 6 caracteres.',
        },
        {
          status: 400,
        }
      )
    }

    const perfisPermitidos = [
      'administrador',
      'operador',
      'visualizador',
    ]

    if (
      !perfisPermitidos.includes(perfil)
    ) {
      return NextResponse.json(
        {
          error:
            'Perfil de acesso inválido.',
        },
        {
          status: 400,
        }
      )
    }

    const admin = criarAdminClient()

    const {
      data: novoUsuario,
      error: createError,
    } =
      await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })

    if (
      createError ||
      !novoUsuario.user
    ) {
      return NextResponse.json(
        {
          error:
            createError?.message ||
            'Não foi possível criar o usuário.',
        },
        {
          status: 400,
        }
      )
    }

    const { error: perfilError } =
      await admin
        .from('perfis')
        .insert({
          id: novoUsuario.user.id,
          nome,
          perfil,
        })

    if (perfilError) {
      /*
       * Caso não consiga criar o
       * perfil, remove a conta para
       * não deixar usuário incompleto.
       */
      await admin.auth.admin.deleteUser(
        novoUsuario.user.id
      )

      return NextResponse.json(
        {
          error:
            `Erro ao criar perfil: ${perfilError.message}`,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem:
        'Usuário criado com sucesso.',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Erro interno ao criar usuário.',
      },
      {
        status: 500,
      }
    )
  }
}

/*
====================================================
ALTERAR USUÁRIO
====================================================
*/

export async function PATCH(
  request: NextRequest
) {
  try {
    const verificacao =
      await verificarAdministrador(request)

    if (!verificacao.autorizado) {
      return NextResponse.json(
        {
          error: verificacao.erro,
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const id =
      String(body.id || '')

    const nome =
      String(body.nome || '').trim()

    const perfil =
      String(body.perfil || '')

    if (!id || !nome) {
      return NextResponse.json(
        {
          error:
            'Dados do usuário incompletos.',
        },
        {
          status: 400,
        }
      )
    }

    const perfisPermitidos = [
      'administrador',
      'operador',
      'visualizador',
    ]

    if (
      !perfisPermitidos.includes(perfil)
    ) {
      return NextResponse.json(
        {
          error:
            'Perfil inválido.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Impede administrador de remover
     * o próprio privilégio.
     */
    if (
      verificacao.usuario?.id === id &&
      perfil !== 'administrador'
    ) {
      return NextResponse.json(
        {
          error:
            'Você não pode remover seu próprio acesso de administrador.',
        },
        {
          status: 400,
        }
      )
    }

    const admin = criarAdminClient()

    const { error } = await admin
      .from('perfis')
      .upsert({
        id,
        nome,
        perfil,
      })

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem:
        'Usuário atualizado com sucesso.',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Erro interno ao atualizar usuário.',
      },
      {
        status: 500,
      }
    )
  }
}

/*
====================================================
EXCLUIR USUÁRIO
====================================================
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const verificacao =
      await verificarAdministrador(request)

    if (!verificacao.autorizado) {
      return NextResponse.json(
        {
          error: verificacao.erro,
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const id =
      String(body.id || '')

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Usuário não informado.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Administrador não pode excluir
     * a própria conta.
     */
    if (
      verificacao.usuario?.id === id
    ) {
      return NextResponse.json(
        {
          error:
            'Você não pode excluir sua própria conta.',
        },
        {
          status: 400,
        }
      )
    }

    const admin = criarAdminClient()

    const { error } =
      await admin.auth.admin.deleteUser(
        id
      )

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem:
        'Usuário excluído com sucesso.',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Erro interno ao excluir usuário.',
      },
      {
        status: 500,
      }
    )
  }
}