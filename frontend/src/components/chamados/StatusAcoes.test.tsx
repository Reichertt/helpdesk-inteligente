import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusAcoes } from './StatusAcoes';

describe('StatusAcoes', () => {
  it('mostra somente as transições permitidas para um chamado aberto', () => {
    render(<StatusAcoes statusAtual="ABERTO" transicoes={['EM_ANDAMENTO', 'CANCELADO']} carregando={false} onMudar={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Iniciar atendimento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar chamado' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como resolvido' })).not.toBeInTheDocument();
  });

  it('em um chamado resolvido oferece reabrir e fechar', async () => {
    const onMudar = vi.fn();
    render(<StatusAcoes statusAtual="RESOLVIDO" transicoes={['FECHADO', 'EM_ANDAMENTO']} carregando={false} onMudar={onMudar} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reabrir' }));
    expect(onMudar).toHaveBeenCalledWith('EM_ANDAMENTO');
    expect(screen.getByRole('button', { name: 'Fechar chamado' })).toBeInTheDocument();
  });

  it('não mostra botões para estado final', () => {
    render(<StatusAcoes statusAtual="FECHADO" transicoes={[]} carregando={false} onMudar={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/finalizado/)).toBeInTheDocument();
  });
});
