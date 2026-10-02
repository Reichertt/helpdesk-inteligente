import { describe, expect, it } from 'vitest';
import { mascararDadosPessoais } from '../../src/ai/mascaramento';

describe('mascaramento de dados pessoais', () => {
  it('mascara e-mails', () => {
    expect(mascararDadosPessoais('Responder para joao.silva+teste@empresa.com.br hoje')).toBe('Responder para [EMAIL] hoje');
  });

  it.each(['123.456.789-09', '12345678909'])('mascara CPF no formato %s', (cpf) => {
    expect(mascararDadosPessoais(`Meu CPF é ${cpf}.`)).toBe('Meu CPF é [CPF].');
  });

  it.each(['(48) 99812-3456', '+55 48 99812-3456', '48 3333-4444', '3333-4444', '(11)987654321'])(
    'mascara telefone no formato %s',
    (telefone) => {
      expect(mascararDadosPessoais(`Ligue em ${telefone} por favor`)).toBe('Ligue em [TELEFONE] por favor');
    },
  );

  it('mascara vários dados no mesmo texto e preserva o restante', () => {
    const texto = 'Sou a Ana, CPF 111.222.333-44, tel (21) 91234-5678, e-mail ana@x.com. Erro 500 desde 2026.';
    expect(mascararDadosPessoais(texto)).toBe(
      'Sou a Ana, CPF [CPF], tel [TELEFONE], e-mail [EMAIL]. Erro 500 desde 2026.',
    );
  });

  it('não altera textos sem dados pessoais', () => {
    const texto = 'O relatório de vendas trava ao exportar 1500 linhas.';
    expect(mascararDadosPessoais(texto)).toBe(texto);
  });
});
