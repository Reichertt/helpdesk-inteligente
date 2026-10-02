import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Triagem } from '../../api/types';
import { TriagemPainel } from './TriagemPainel';

const base: Triagem = {
  id: 1,
  status: 'CONCLUIDA',
  categoriaSugerida: { id: 2, nome: 'Financeiro' },
  prioridadeSugerida: 'ALTA',
  resumo: 'Cobrança duplicada no cartão.',
  respostaSugerida: 'Olá! Vamos verificar a cobrança.',
  confianca: 0.82,
  modelo: 'groq:openai/gpt-oss-20b',
  promptVersao: 'triagem-v1',
  erro: null,
  decididoPor: null,
  decididoEm: null,
  criadoEm: '2026-09-30T12:00:00.000Z',
};

describe('TriagemPainel', () => {
  it('no estado concluída mostra a sugestão, o aviso de IA e as ações', async () => {
    const onAcao = vi.fn();
    render(<TriagemPainel triagem={base} podeAgir acaoEmAndamento={null} onAcao={onAcao} />);

    expect(screen.getByText(/Conteúdo gerado automaticamente/)).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('Cobrança duplicada no cartão.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Aceitar sugestão' }));
    expect(onAcao).toHaveBeenCalledWith('aceitar');
    expect(screen.getByRole('button', { name: 'Rejeitar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refazer triagem' })).toBeInTheDocument();
  });

  it('no estado falhou mostra o motivo e permite tentar de novo, sem aceitar/rejeitar', async () => {
    const onAcao = vi.fn();
    const falhou: Triagem = { ...base, status: 'FALHOU', erro: 'A resposta da IA não é um JSON válido.', resumo: null };
    render(<TriagemPainel triagem={falhou} podeAgir acaoEmAndamento={null} onAcao={onAcao} />);

    expect(screen.getByText('Não foi possível gerar a sugestão.')).toBeInTheDocument();
    expect(screen.getByText(/não é um JSON válido/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceitar sugestão' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onAcao).toHaveBeenCalledWith('refazer');
  });

  it('no estado pendente mostra o carregamento e nenhuma ação', () => {
    render(<TriagemPainel triagem={{ ...base, status: 'PENDENTE' }} podeAgir acaoEmAndamento={null} onAcao={vi.fn()} />);

    expect(screen.getByText(/A IA está analisando o chamado/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('esconde as ações para quem não pode decidir', () => {
    render(<TriagemPainel triagem={base} podeAgir={false} acaoEmAndamento={null} onAcao={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Aceitar sugestão' })).not.toBeInTheDocument();
  });
});
