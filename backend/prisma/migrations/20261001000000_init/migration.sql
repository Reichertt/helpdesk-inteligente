-- Extensões: pg_trgm acelera ILIKE '%texto%'; pgcrypto é usada no seed para gerar o hash bcrypt.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('SOLICITANTE', 'ATENDENTE');
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO', 'CANCELADO');
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
CREATE TYPE "StatusTriagem" AS ENUM ('PENDENTE', 'CONCLUIDA', 'FALHOU', 'ACEITA', 'REJEITADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categorias_nome_check" CHECK (char_length(trim("nome")) > 0)
);

CREATE TABLE "chamados" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "solicitante_nome" VARCHAR(120) NOT NULL,
    "solicitante_email" VARCHAR(160) NOT NULL,
    "categoria_id" INTEGER,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "resolvido_em" TIMESTAMP(3),
    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chamados_titulo_check" CHECK (char_length(trim("titulo")) > 0),
    CONSTRAINT "chamados_resolvido_em_check" CHECK ("resolvido_em" IS NULL OR "resolvido_em" >= "criado_em"),
    -- resolvido_em existe se, e somente se, o chamado estiver Resolvido ou Fechado.
    CONSTRAINT "chamados_resolvido_status_check" CHECK (("status" IN ('RESOLVIDO', 'FECHADO')) = ("resolvido_em" IS NOT NULL))
);

CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "chamado_id" INTEGER NOT NULL,
    "autor" VARCHAR(120) NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comentarios_texto_check" CHECK (char_length(trim("texto")) > 0)
);

CREATE TABLE "historico_status" (
    "id" SERIAL NOT NULL,
    "chamado_id" INTEGER NOT NULL,
    "status_anterior" "StatusChamado",
    "status_novo" "StatusChamado" NOT NULL,
    "alterado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alterado_por" VARCHAR(120) NOT NULL,
    CONSTRAINT "historico_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "triagens_ia" (
    "id" SERIAL NOT NULL,
    "chamado_id" INTEGER NOT NULL,
    "categoria_sugerida_id" INTEGER,
    "prioridade_sugerida" "Prioridade",
    "resumo" VARCHAR(200),
    "resposta_sugerida" TEXT,
    "confianca" DOUBLE PRECISION,
    "modelo" VARCHAR(100) NOT NULL,
    "prompt_versao" VARCHAR(30) NOT NULL,
    "status" "StatusTriagem" NOT NULL DEFAULT 'PENDENTE',
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "latencia_ms" INTEGER,
    "tokens_entrada" INTEGER,
    "tokens_saida" INTEGER,
    "decidido_por" VARCHAR(120),
    "decidido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "triagens_ia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "triagens_ia_confianca_check" CHECK ("confianca" IS NULL OR ("confianca" >= 0 AND "confianca" <= 1)),
    CONSTRAINT "triagens_ia_tokens_check" CHECK (COALESCE("tokens_entrada", 0) >= 0 AND COALESCE("tokens_saida", 0) >= 0),
    -- Uma triagem só pode ser aceita/rejeitada/concluída se tiver a sugestão completa.
    CONSTRAINT "triagens_ia_sugestao_check" CHECK (
        "status" IN ('PENDENTE', 'FALHOU')
        OR ("categoria_sugerida_id" IS NOT NULL AND "prioridade_sugerida" IS NOT NULL AND "resumo" IS NOT NULL AND "resposta_sugerida" IS NOT NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

CREATE INDEX "chamados_status_criado_em_idx" ON "chamados"("status", "criado_em" DESC);
CREATE INDEX "chamados_prioridade_criado_em_idx" ON "chamados"("prioridade", "criado_em" DESC);
CREATE INDEX "chamados_categoria_id_idx" ON "chamados"("categoria_id");
CREATE INDEX "chamados_criado_em_idx" ON "chamados"("criado_em" DESC);
CREATE INDEX "chamados_titulo_idx" ON "chamados" USING GIN ("titulo" gin_trgm_ops);
CREATE INDEX "chamados_descricao_idx" ON "chamados" USING GIN ("descricao" gin_trgm_ops);

CREATE INDEX "comentarios_chamado_id_criado_em_idx" ON "comentarios"("chamado_id", "criado_em");
CREATE INDEX "historico_status_chamado_id_alterado_em_idx" ON "historico_status"("chamado_id", "alterado_em");
CREATE INDEX "triagens_ia_chamado_id_criado_em_idx" ON "triagens_ia"("chamado_id", "criado_em" DESC);
CREATE INDEX "triagens_ia_status_idx" ON "triagens_ia"("status");

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "triagens_ia" ADD CONSTRAINT "triagens_ia_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "triagens_ia" ADD CONSTRAINT "triagens_ia_categoria_sugerida_id_fkey" FOREIGN KEY ("categoria_sugerida_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
