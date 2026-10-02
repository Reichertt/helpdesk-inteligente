export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(detail ?? title);
  }
}

export const badRequest = (detail: string, errors?: Record<string, string[]>) =>
  new AppError(400, 'Requisição inválida', detail, errors);
export const unauthorized = (detail = 'Autenticação necessária.') => new AppError(401, 'Não autenticado', detail);
export const forbidden = (detail = 'Você não tem permissão para esta ação.') => new AppError(403, 'Acesso negado', detail);
export const notFound = (detail: string) => new AppError(404, 'Recurso não encontrado', detail);
export const conflict = (detail: string) => new AppError(409, 'Conflito de estado', detail);
export const unprocessable = (detail: string) => new AppError(422, 'Regra de negócio violada', detail);
