# Decisões técnicas

## Node.js + TypeScript + Express + Prisma
A vaga indica C# como diferencial; optei por Node/TypeScript para entregar o escopo obrigatório completo no prazo, com uma estrutura simples (rotas, controllers, services, Prisma). Express 5 foi escolhido em vez de NestJS para manter pouca cerimônia; o custo é organizar a injeção de dependências manualmente (a troca do provedor de IA nos testes é feita por `definirProvedorIA`).

## Triagem assíncrona no próprio processo
A criação do chamado não espera a IA: a triagem é criada como `PENDENTE` na mesma transação e processada com `setImmediate`. Alternativas consideradas: fila (Redis/RabbitMQ) ou tabela outbox com worker. Ficaram de fora para não adicionar infraestrutura; para reduzir o risco de perda, triagens pendentes são retomadas na inicialização. Limitação: com várias instâncias da API, duas poderiam processar a mesma triagem (a atualização condicionada a `status = PENDENTE` evita sobrescrita, mas não a chamada duplicada ao LLM).

## Groq como provedor real
API compatível com OpenAI, plano gratuito generoso e suporte a `response_format: json_object`. O provedor fica atrás da interface `ProvedorIA`; trocar por OpenAI, Anthropic ou Ollama é uma nova classe. O provedor fake é determinístico (heurística por palavras-chave) e é o padrão no Docker Compose.

## Sugestão nunca aplicada automaticamente
Aceitar é uma ação explícita do atendente, gravada com `decididoPor` e `decididoEm`. Só a triagem mais recente pode ser decidida, e apenas quando está `CONCLUIDA`. Refazer cria uma nova triagem e mantém as anteriores como histórico.

## Regras de transição centralizadas no backend
`services/regrasStatus.ts` é a única fonte das transições. O detalhe do chamado devolve `transicoesPermitidas`, e o frontend apenas renderiza esses botões, evitando duplicar a regra.

Premissas sobre o diagrama do enunciado:
- Cancelado só a partir de Aberto (é o único caminho desenhado).
- "Reabrir" é Resolvido → EmAndamento, limpando `resolvidoEm`.
- Fechado mantém `resolvidoEm` (o chamado foi resolvido antes de fechar), o que permite calcular o tempo de resolução de chamados fechados.

Erros: 409 para transição inexistente ou estado final; 422 para regra de negócio sobre um caminho que existe (cancelar Crítico).

## Concorrência na mudança de status
A atualização usa `UPDATE ... WHERE id = ? AND status = <status lido>`. Se outra requisição mudou o status entre a leitura e a escrita, nenhuma linha é afetada e a API devolve 409, em vez de gravar uma transição inválida.

## Categoria e prioridade na criação
A categoria é opcional na abertura (quem abre nem sempre sabe classificar; a IA sugere) e a prioridade tem padrão Média. Por isso `chamados.categoria_id` é anulável.

## Resumo maior que 200 caracteres
O parser trunca o resumo em vez de reprovar a triagem inteira: o restante da sugestão continua útil e o prompt já pede o limite.

## Dados iniciais por migration
A carga inicial é uma migration SQL (`dados_iniciais`), aplicada pelo mesmo `prisma migrate deploy` do container. Isso garante que `docker compose up` sempre tenha usuários e dados, sem script extra. As senhas são geradas com `crypt(..., gen_salt('bf'))` do `pgcrypto`, compatível com o `bcryptjs`. As datas são relativas a `now()` para o dashboard sempre ter dados recentes.

## Autenticação
JWT simples com dois perfis. O frontend guarda a sessão no `localStorage` por simplicidade; em produção, cookie `httpOnly` reduziria a exposição a XSS.

## Busca textual
`ILIKE` com índices trigram em vez de full-text (`tsvector`): atende buscas por trechos de palavras e códigos de erro, que o full-text em português trataria pior por causa do stemming.
