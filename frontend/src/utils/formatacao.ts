const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

export const formatarDataHora = (iso: string) => dataHora.format(new Date(iso));
export const formatarData = (iso: string) => data.format(new Date(iso));
export const numeroChamado = (id: number) => `#${String(id).padStart(4, '0')}`;
export const formatarPercentual = (valor: number | null) =>
  valor === null ? '—' : `${Math.round(valor * 100)}%`;
export const formatarHoras = (horas: number | null) => {
  if (horas === null) return '—';
  return horas >= 48 ? `${(horas / 24).toFixed(1).replace('.', ',')} dias` : `${horas.toFixed(1).replace('.', ',')} h`;
};
export const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');
