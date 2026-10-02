# Decisões técnicas

## Node.js + TypeScript + Express + Prisma
A vaga indica C# como diferencial; optei por Node/TypeScript para entregar o escopo completo no prazo, com uma estrutura simples (rotas, controllers, services, Prisma). Express 5 foi escolhido em vez de NestJS para gerenciar ações mais rapidas.

## Groq como IA
Acredito que não seja a recomendada para utilizar em produção ou em grande escala, mas como é um projeto teste e sem custos, resolvi pela facilidade na integração utilizar o Groq versão openai/gpt-oss-20b como agente IA

## IA Fake
Resolvi também realizar a criação de uma IA fake que realiza as sugestões caso a IA principal verdadeira caia, chamada de "fake:topmed-v1" em fakeProvedor.ts

## IA prompt.ts
Nesse arquivo você consegue observar o resumo que dei para a IA ser determinada como um atendente para realizar as sugestões que aparecem no frontend

## Dados iniciais por migration
A carga inicial é uma migration SQL (`dados_iniciais`), aplicada pelo mesmo `prisma migrate deploy` do container. Isso garante que `docker compose up` sempre tenha usuários e dados, sem script extra.

## Autenticação
JWT simples com dois perfis. O frontend guarda a sessão no `localStorage` por simplicidade; em produção, cookie `httpOnly` reduziria a exposição a XSS.

## Dashboards e Gráficos

Para a visualização dos dados, optei pela biblioteca **Recharts** devido à sua performance, simplicidade de integração e forte adoção pela comunidade. O painel centraliza as principais métricas da operação de forma clara:

- **Desempenho da IA:** Taxa de aceitação das sugestões feitas pela IA e qualidade da triagem (categorias sugeridas, aguardando decisão e falhas).
- **Métricas de Atendimento:** Tempo médio de resolução e volume total de chamados registrados.
- **Acompanhamento de Status:** Distribuição visual dos chamados (em aberto, em andamento, resolvidos ou fechados).

## Padrão de pastas Back e Front
O padrão de estruturas que utilizei, foi o indicado em qualquer projeto para manter uma organização, utilizando o modelo back com Model, controller, rotas, services, uma pasta com IA. Já no front, utilizei o padrão também, podendo ser observado em projetos antigos do meu GITHUB, com pastas para componentes, hooks, pages etc.

## Uso de IA no Desenvolvimento

Neste projeto, utilizei o **Google Gemini** como copiloto de desenvolvimento. A adoção da IA teve como foco principal otimizar o tempo de produção, automatizando a escrita de códigos repetitivos e auxiliando na estruturação de lógicas mais complexas.