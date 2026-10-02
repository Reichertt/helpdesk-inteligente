const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const CPF = /(?<!\d)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?!\d)/g;
// Cobre formatos como (48) 99999-1234, +55 48 99999-1234, 48 3333-4444 e 3333-4444.
const TELEFONE = /(?<!\d)(?:\+?55[\s-]?)?(?:\(?\d{2}\)?[\s-]?)?9?\d{4}[\s-]?\d{4}(?!\d)/g;

// A ordem importa: CPF antes de telefone para que um CPF não seja rotulado como telefone.
export function mascararDadosPessoais(texto: string): string {
  return texto.replace(EMAIL, '[EMAIL]').replace(CPF, '[CPF]').replace(TELEFONE, '[TELEFONE]');
}
