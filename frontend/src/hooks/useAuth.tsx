import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EVENTO_SESSAO_EXPIRADA, lerSessao, limparSessao, salvarSessao } from '../api/client';
import { authApi } from '../api/endpoints';
import type { Usuario } from '../api/types';

interface AuthContexto {
  usuario: Usuario | null;
  ehAtendente: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const Contexto = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(() => lerSessao()?.usuario ?? null);

  const sair = useCallback(() => {
    limparSessao();
    queryClient.clear();
    setUsuario(null);
  }, [queryClient]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const sessao = await authApi.login(email, senha);
    salvarSessao(sessao);
    setUsuario(sessao.usuario);
  }, []);

  useEffect(() => {
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, sair);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, sair);
  }, [sair]);

  const valor = useMemo(
    () => ({ usuario, ehAtendente: usuario?.perfil === 'ATENDENTE', entrar, sair }),
    [usuario, entrar, sair],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return contexto;
}
