import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChamadoForm } from './ChamadoForm';

const categorias = [
  { id: 1, nome: 'Acesso/Login' },
  { id: 2, nome: 'Financeiro' },
];

describe('ChamadoForm', () => {
  it('mostra os erros de validação e não envia quando os campos estão vazios', async () => {
    const onSubmit = vi.fn();
    render(<ChamadoForm categorias={categorias} enviando={false} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));

    expect(screen.getByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByText('Descreva o problema.')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail do solicitante.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejeita e-mail em formato inválido', async () => {
    const onSubmit = vi.fn();
    render(<ChamadoForm categorias={categorias} enviando={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Erro ao gerar boleto');
    await userEvent.type(screen.getByLabelText('Descrição'), 'O boleto sai com valor errado desde ontem.');
    await userEvent.type(screen.getByLabelText('Nome do solicitante'), 'Maria');
    await userEvent.type(screen.getByLabelText('E-mail do solicitante'), 'maria@semdominio');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));

    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia os dados normalizados quando o formulário é válido', async () => {
    const onSubmit = vi.fn();
    render(<ChamadoForm categorias={categorias} enviando={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), '  Erro ao gerar boleto ');
    await userEvent.type(screen.getByLabelText('Descrição'), 'O boleto sai com valor errado desde ontem.');
    await userEvent.type(screen.getByLabelText('Nome do solicitante'), 'Maria');
    await userEvent.type(screen.getByLabelText('E-mail do solicitante'), 'maria@exemplo.com');
    await userEvent.selectOptions(screen.getByLabelText('Categoria (opcional)'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));

    expect(onSubmit).toHaveBeenCalledWith({
      titulo: 'Erro ao gerar boleto',
      descricao: 'O boleto sai com valor errado desde ontem.',
      solicitanteNome: 'Maria',
      solicitanteEmail: 'maria@exemplo.com',
      categoriaId: 2,
      prioridade: 'MEDIA',
    });
  });

  it('exibe o erro de campo devolvido pela API', () => {
    render(
      <ChamadoForm
        categorias={categorias}
        enviando={false}
        onSubmit={vi.fn()}
        errosServidor={{ solicitanteEmail: ['Informe um e-mail válido.'] }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
  });
});
