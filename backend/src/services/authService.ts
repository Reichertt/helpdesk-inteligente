import bcrypt from 'bcryptjs';
import { unauthorized } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { gerarToken } from '../middlewares/auth';

export async function login(email: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });

  // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw unauthorized('E-mail ou senha incorretos.');
  }

  const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
  return { token: gerarToken(dados), usuario: dados };
}
