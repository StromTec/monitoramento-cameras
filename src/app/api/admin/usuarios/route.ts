import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

type PerfilUsuario =
  | 'administrador'
  | 'operador'
  | 'visualizador'

const perfisPermitidos: PerfilUsuario[] = [
  'administrador',
  'operador',
  'visualizador',
]

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
      autorizado: false as const,
      status: 401,
      erro: 'Token de autenticação não informado.',
    }
  }

  const token = authorization.replace(
    'Bearer ',
    ''
  )

  const {
    data: { user },
    error: userError,
  } =
    await supabaseAdmin.auth.getUser(
      token
    )

  if (
    userError ||
    !user
  ) {
    console.error(
      'Erro ao validar usuário:',
      userError
    )

    return {
      autorizado: false as const,
      status: 401,
      erro:
        'Sessão inválida ou expirada.',
    }
  }

  const {
    data: perfil,
    error: perfilError,
  } = await supabaseAdmin
    .from('perfis')
    .select('id, nome, perfil')
    .eq('id', user.id)
    .single()

  if (
    perfilError ||
    !perfil
  ) {
    console.error(
      'Erro ao consultar perfil:',
      perfilError
    )

    return {
      autorizado: false as const,
      status: 403,
      erro:
        'Perfil de usuário não encontrado.',
    }
  }

  if (
    perfil.perfil !==
    'administrador'
  ) {
    return {
      autorizado: false as const,
      status: 403,
      erro:
        'Acesso permitido somente para administradores.',
    }
  }

  return {
    autorizado: true as const,
    user,
    perfil,
  }
}

/* =========================================================
   GET - LISTAR USUÁRIOS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const acesso =
      await verificarAdministrador(
        request
      )

    if (!acesso.autorizado) {
      return NextResponse.json(
        {
          error: acesso.erro,
        },
        {
          status: acesso.status,
        }
      )
    }

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.listUsers(
        {
          page: 1,
          perPage: 1000,
        }
      )

    if (authError) {
      console.error(
        'Erro ao listar usuários do Auth:',
        authError
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar os usuários.',
        },
        {
          status: 500,
        }
      )
    }

    const {
      data: perfis,
      error: perfisError,
    } = await supabaseAdmin
      .from('perfis')
      .select(
        'id, nome, perfil, criado_em'
      )

    if (perfisError) {
      console.error(
        'Erro ao carregar perfis:',
        perfisError
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar os perfis.',
        },
        {
          status: 500,
        }
      )
    }

    const mapaPerfis =
      new Map(
        (perfis || []).map(
          (perfil) => [
            perfil.id,
            perfil,
          ]
        )
      )

    const usuarios =
      authData.users.map(
        (usuario) => {
          const perfil =
            mapaPerfis.get(
              usuario.id
            )

          return {
            id: usuario.id,

            email:
              usuario.email || '',

            nome:
              perfil?.nome ||
              usuario.email ||
              'Usuário',

            perfil:
              perfil?.perfil ||
              'visualizador',

            criado_em:
              usuario.created_at ||
              perfil?.criado_em ||
              null,

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
    console.error(
      'Erro inesperado GET /api/admin/usuarios:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   POST - CRIAR USUÁRIO
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const acesso =
      await verificarAdministrador(
        request
      )

    if (!acesso.autorizado) {
      return NextResponse.json(
        {
          error: acesso.erro,
        },
        {
          status: acesso.status,
        }
      )
    }

    const body =
      await request.json()

    const nome =
      typeof body.nome === 'string'
        ? body.nome.trim()
        : ''

    const email =
      typeof body.email === 'string'
        ? body.email
            .trim()
            .toLowerCase()
        : ''

    const senha =
      typeof body.senha === 'string'
        ? body.senha
        : ''

    const perfil =
      body.perfil as PerfilUsuario

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

    if (senha.length < 8) {
      return NextResponse.json(
        {
          error:
            'A senha deve possuir pelo menos 8 caracteres.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !perfisPermitidos.includes(
        perfil
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Perfil de usuário inválido.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data: novoUsuario,
      error: criarError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password: senha,
          email_confirm: true,
        }
      )

    if (
      criarError ||
      !novoUsuario.user
    ) {
      console.error(
        'Erro ao criar usuário:',
        criarError
      )

      let mensagem =
        'Não foi possível criar o usuário.'

      const textoErro =
        criarError?.message
          ?.toLowerCase() || ''

      if (
        textoErro.includes(
          'already'
        ) ||
        textoErro.includes(
          'registered'
        ) ||
        textoErro.includes(
          'exists'
        )
      ) {
        mensagem =
          'Já existe um usuário cadastrado com este e-mail.'
      }

      return NextResponse.json(
        {
          error: mensagem,
        },
        {
          status: 400,
        }
      )
    }

    const {
      error: perfilError,
    } = await supabaseAdmin
      .from('perfis')
      .insert({
        id:
          novoUsuario.user.id,

        nome,

        perfil,
      })

    if (perfilError) {
      console.error(
        'Erro ao criar perfil:',
        perfilError
      )

      await supabaseAdmin.auth.admin.deleteUser(
        novoUsuario.user.id
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível criar o perfil do usuário.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        sucesso: true,

        message:
          'Usuário criado com sucesso.',

        usuario: {
          id:
            novoUsuario.user.id,

          email:
            novoUsuario.user.email,

          nome,

          perfil,
        },
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'Erro inesperado POST /api/admin/usuarios:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   PATCH - EDITAR USUÁRIO / REDEFINIR SENHA
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const acesso =
      await verificarAdministrador(
        request
      )

    if (!acesso.autorizado) {
      return NextResponse.json(
        {
          error: acesso.erro,
        },
        {
          status: acesso.status,
        }
      )
    }

    const body =
      await request.json()

    const id =
      typeof body.id === 'string'
        ? body.id.trim()
        : ''

    if (!id) {
      return NextResponse.json(
        {
          error:
            'ID do usuário não informado.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data: usuarioDestino,
      error: usuarioError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        id
      )

    if (
      usuarioError ||
      !usuarioDestino.user
    ) {
      console.error(
        'Usuário não encontrado:',
        usuarioError
      )

      return NextResponse.json(
        {
          error:
            'Usuário não encontrado.',
        },
        {
          status: 404,
        }
      )
    }

    const alterarNome =
      body.nome !== undefined

    const alterarPerfil =
      body.perfil !== undefined

    const alterarSenha =
      body.novaSenha !== undefined

    if (
      !alterarNome &&
      !alterarPerfil &&
      !alterarSenha
    ) {
      return NextResponse.json(
        {
          error:
            'Nenhuma alteração foi informada.',
        },
        {
          status: 400,
        }
      )
    }

    let nome:
      | string
      | undefined

    if (alterarNome) {
      if (
        typeof body.nome !==
        'string'
      ) {
        return NextResponse.json(
          {
            error:
              'Nome inválido.',
          },
          {
            status: 400,
          }
        )
      }

      nome =
        body.nome.trim()

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
    }

    let perfil:
      | PerfilUsuario
      | undefined

    if (alterarPerfil) {
      perfil =
        body.perfil as PerfilUsuario

      if (
        !perfisPermitidos.includes(
          perfil
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Perfil de usuário inválido.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        acesso.user.id === id &&
        perfil !==
          'administrador'
      ) {
        return NextResponse.json(
          {
            error:
              'Você não pode remover sua própria permissão de administrador.',
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
      CORREÇÃO DO ERRO TS18048

      Em vez de acessar novaSenha.length
      quando ela ainda poderia ser undefined,
      validamos primeiro senhaInformada.
    */

    let novaSenha:
      | string
      | undefined

    if (alterarSenha) {
      if (
        typeof body.novaSenha !==
        'string'
      ) {
        return NextResponse.json(
          {
            error:
              'Nova senha inválida.',
          },
          {
            status: 400,
          }
        )
      }

      const senhaInformada: string =
        body.novaSenha

      if (
        senhaInformada.length < 8
      ) {
        return NextResponse.json(
          {
            error:
              'A nova senha deve possuir pelo menos 8 caracteres.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        senhaInformada.length > 72
      ) {
        return NextResponse.json(
          {
            error:
              'A nova senha não pode ultrapassar 72 caracteres.',
          },
          {
            status: 400,
          }
        )
      }

      novaSenha =
        senhaInformada
    }

    if (
      alterarNome ||
      alterarPerfil
    ) {
      const atualizacaoPerfil: {
        nome?: string
        perfil?: PerfilUsuario
      } = {}

      if (
        nome !== undefined
      ) {
        atualizacaoPerfil.nome =
          nome
      }

      if (
        perfil !== undefined
      ) {
        atualizacaoPerfil.perfil =
          perfil
      }

      const {
        error: atualizarPerfilError,
      } = await supabaseAdmin
        .from('perfis')
        .update(
          atualizacaoPerfil
        )
        .eq('id', id)

      if (
        atualizarPerfilError
      ) {
        console.error(
          'Erro ao atualizar perfil:',
          atualizarPerfilError
        )

        return NextResponse.json(
          {
            error:
              'Não foi possível atualizar o usuário.',
          },
          {
            status: 500,
          }
        )
      }
    }

    if (
      alterarSenha &&
      novaSenha
    ) {
      const {
        error: senhaError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            password:
              novaSenha,
          }
        )

      if (senhaError) {
        console.error(
          'Erro ao redefinir senha:',
          senhaError
        )

        return NextResponse.json(
          {
            error:
              'Não foi possível redefinir a senha do usuário.',
          },
          {
            status: 500,
          }
        )
      }
    }

    return NextResponse.json({
      sucesso: true,

      message:
        alterarSenha &&
        !alterarNome &&
        !alterarPerfil
          ? 'Senha redefinida com sucesso.'
          : alterarSenha
            ? 'Usuário e senha atualizados com sucesso.'
            : 'Usuário atualizado com sucesso.',
    })
  } catch (error) {
    console.error(
      'Erro inesperado PATCH /api/admin/usuarios:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   DELETE - EXCLUIR USUÁRIO
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const acesso =
      await verificarAdministrador(
        request
      )

    if (!acesso.autorizado) {
      return NextResponse.json(
        {
          error: acesso.erro,
        },
        {
          status: acesso.status,
        }
      )
    }

    const body =
      await request.json()

    const id =
      typeof body.id === 'string'
        ? body.id.trim()
        : ''

    if (!id) {
      return NextResponse.json(
        {
          error:
            'ID do usuário não informado.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      acesso.user.id === id
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

    const {
      data: usuarioDestino,
      error: usuarioError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        id
      )

    if (
      usuarioError ||
      !usuarioDestino.user
    ) {
      return NextResponse.json(
        {
          error:
            'Usuário não encontrado.',
        },
        {
          status: 404,
        }
      )
    }

    const {
      error: excluirError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        id
      )

    if (excluirError) {
      console.error(
        'Erro ao excluir usuário:',
        excluirError
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível excluir o usuário.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      sucesso: true,

      message:
        'Usuário excluído com sucesso.',
    })
  } catch (error) {
    console.error(
      'Erro inesperado DELETE /api/admin/usuarios:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    )
  }
}