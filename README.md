# HelpDesk Inteligente

Aplicação de abertura e acompanhamento de chamados de suporte com triagem assistida por IA. Ao criar um chamado, um LLM sugere categoria, prioridade, resumo e uma resposta inicial; um atendente decide se aceita ou rejeita a sugestão.

**Stack:** Node.js 20 + TypeScript + Express 5 + Prisma (backend), React 18 + Vite + TypeScript + TanStack Query (frontend), PostgreSQL 16, Groq como provedor de LLM, Docker Compose.

## Como rodar

Pré-requisito: Docker com Docker Compose.

```bash
docker compose up --build
```

Esse comando sobe o banco, aplica as migrations (estrutura e dados iniciais), inicia a API e o frontend, usando a IA fake por padrão (não precisa de chave).

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:8080 |
| API | http://localhost:3333 |
| Swagger Documentação | http://localhost:3333/docs |

Usuários criados pela migration de dados iniciais:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Atendente | admin@helpdesk.local | admin123 |
| Solicitante | solicitante@helpdesk.local | solicitante123 |

O atendente pode mudar status e aceitar, rejeitar ou refazer a triagem. O solicitante pode abrir chamados, consultar e comentar.

## IA

A IA utilizada para realizar as automações foi a Groq versão openai/gpt-oss-20b pois foi a mais compatível que encontrei para testes local.

## Como rodar os testes

```bash
# Backend: unitários (sem banco)
cd backend && npm install && npm run test:unit

# Backend: integração contra PostgreSQL real (Testcontainers, precisa do Docker rodando)
npm run test:integration

# Backend: tudo
npm test

# Frontend: testes de componente
cd frontend && npm install && npm test
```

## Bibliotecas utilizadas

| Biblioteca | Motivo |
| --- | --- |
| Express 5 | HTTP simples e conhecido; a v5 trata erros de handlers assíncronos sem wrapper |
| Prisma | ORM tipado com migrations versionadas em SQL |
| jsonwebtoken / bcryptjs | Autenticação JWT e verificação de senha |
| swagger-ui-express | Documentação OpenAPI em /docs |
| Vitest, Supertest, Testcontainers | Testes unitários e de integração contra PostgreSQL real |
| React Router | Rotas e filtros na URL |
| Recharts | Gráficos do dashboard |
| Testing Library | Testes de componente |