const problema = { $ref: '#/components/responses/Problema' };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const detalhe = { description: 'Chamado com comentários, histórico e triagem', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChamadoDetalhe' } } } };
const seguro = [{ bearerAuth: [] }];

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HelpDesk Inteligente API',
    version: '1.0.0',
    description: 'Gestão de chamados com triagem assistida por IA. Faça login em /api/auth/login e use o token no botão Authorize.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    responses: {
      Problema: {
        description: 'Erro no formato Problem Details (RFC 9457)',
        content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetails' } } },
      },
    },
    schemas: {
      ProblemDetails: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'integer' },
          detail: { type: 'string' },
          instance: { type: 'string' },
          correlationId: { type: 'string' },
          errors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
        },
      },
      Status: { type: 'string', enum: ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO', 'CANCELADO'] },
      Prioridade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] },
      StatusTriagem: { type: 'string', enum: ['PENDENTE', 'CONCLUIDA', 'FALHOU', 'ACEITA', 'REJEITADA'] },
      Categoria: { type: 'object', properties: { id: { type: 'integer' }, nome: { type: 'string' } } },
      NovoChamado: {
        type: 'object',
        required: ['titulo', 'descricao', 'solicitanteNome', 'solicitanteEmail'],
        properties: {
          titulo: { type: 'string', minLength: 5, maxLength: 150 },
          descricao: { type: 'string', minLength: 10, maxLength: 5000 },
          solicitanteNome: { type: 'string' },
          solicitanteEmail: { type: 'string', format: 'email' },
          categoriaId: { type: 'integer', nullable: true },
          prioridade: { $ref: '#/components/schemas/Prioridade' },
        },
      },
      Triagem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          status: { $ref: '#/components/schemas/StatusTriagem' },
          categoriaSugerida: { $ref: '#/components/schemas/Categoria' },
          prioridadeSugerida: { $ref: '#/components/schemas/Prioridade' },
          resumo: { type: 'string' },
          respostaSugerida: { type: 'string' },
          confianca: { type: 'number' },
          modelo: { type: 'string' },
          promptVersao: { type: 'string' },
          erro: { type: 'string', nullable: true },
          tokensEntrada: { type: 'integer', nullable: true },
          tokensSaida: { type: 'integer', nullable: true },
        },
      },
      ChamadoDetalhe: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          titulo: { type: 'string' },
          descricao: { type: 'string' },
          solicitanteNome: { type: 'string' },
          solicitanteEmail: { type: 'string' },
          categoria: { $ref: '#/components/schemas/Categoria' },
          prioridade: { $ref: '#/components/schemas/Prioridade' },
          status: { $ref: '#/components/schemas/Status' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
          resolvidoEm: { type: 'string', format: 'date-time', nullable: true },
          comentarios: { type: 'array', items: { type: 'object' } },
          historico: { type: 'array', items: { type: 'object' } },
          triagem: { $ref: '#/components/schemas/Triagem' },
          transicoesPermitidas: { type: 'array', items: { $ref: '#/components/schemas/Status' } },
        },
      },
    },
  },
  paths: {
    '/health': { get: { tags: ['Infra'], summary: 'Health check da API e do banco', responses: { 200: { description: 'OK' }, 503: { description: 'Banco indisponível' } } } },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica e devolve um JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, senha: { type: 'string' } } } } } },
        responses: { 200: { description: 'Token e usuário' }, 400: problema, 401: problema },
      },
    },
    '/api/auth/me': { get: { tags: ['Auth'], security: seguro, summary: 'Usuário autenticado', responses: { 200: { description: 'Usuário' }, 401: problema } } },
    '/api/categorias': { get: { tags: ['Categorias'], security: seguro, summary: 'Lista categorias', responses: { 200: { description: 'Categorias' } } } },
    '/api/chamados': {
      get: {
        tags: ['Chamados'],
        security: seguro,
        summary: 'Lista chamados com filtros, paginação e ordenação',
        parameters: [
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/Status' } },
          { name: 'prioridade', in: 'query', schema: { $ref: '#/components/schemas/Prioridade' } },
          { name: 'categoriaId', in: 'query', schema: { type: 'integer' } },
          { name: 'busca', in: 'query', description: 'Texto no título ou na descrição', schema: { type: 'string' } },
          { name: 'dataInicio', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dataFim', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'tamanhoPagina', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'ordenarPor', in: 'query', schema: { type: 'string', enum: ['criadoEm', 'prioridade'] } },
          { name: 'direcao', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: { description: 'Página de chamados' }, 400: problema, 401: problema },
      },
      post: {
        tags: ['Chamados'],
        security: seguro,
        summary: 'Cria um chamado e dispara a triagem por IA em background',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NovoChamado' } } } },
        responses: { 201: detalhe, 400: problema, 401: problema, 422: problema },
      },
    },
    '/api/chamados/{id}': { get: { tags: ['Chamados'], security: seguro, summary: 'Detalhe do chamado', parameters: [idParam], responses: { 200: detalhe, 404: problema } } },
    '/api/chamados/{id}/status': {
      patch: {
        tags: ['Chamados'],
        security: seguro,
        summary: 'Muda o status respeitando as transições permitidas (atendente)',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { $ref: '#/components/schemas/Status' } } } } } },
        responses: { 200: detalhe, 400: problema, 403: problema, 404: problema, 409: problema, 422: problema },
      },
    },
    '/api/chamados/{id}/comentarios': {
      post: {
        tags: ['Chamados'],
        security: seguro,
        summary: 'Adiciona um comentário',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { texto: { type: 'string' } } } } } },
        responses: { 201: { description: 'Comentário criado' }, 400: problema, 404: problema, 409: problema },
      },
    },
    '/api/chamados/{id}/triagem': { post: { tags: ['Triagem IA'], security: seguro, summary: 'Refaz a triagem por IA', parameters: [idParam], responses: { 202: detalhe, 404: problema, 409: problema } } },
    '/api/chamados/{id}/triagem/aceitar': { post: { tags: ['Triagem IA'], security: seguro, summary: 'Aplica categoria e prioridade sugeridas', parameters: [idParam], responses: { 200: detalhe, 404: problema, 409: problema } } },
    '/api/chamados/{id}/triagem/rejeitar': { post: { tags: ['Triagem IA'], security: seguro, summary: 'Rejeita a sugestão sem alterar o chamado', parameters: [idParam], responses: { 200: detalhe, 404: problema, 409: problema } } },
    '/api/dashboard/resumo': { get: { tags: ['Dashboard'], security: seguro, summary: 'Totais, tempo médio de resolução e métricas da IA', responses: { 200: { description: 'Resumo agregado' } } } },
  },
};
