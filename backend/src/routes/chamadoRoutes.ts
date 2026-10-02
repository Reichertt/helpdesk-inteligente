import { PerfilUsuario } from '@prisma/client';
import { Router } from 'express';
import * as chamadoController from '../controllers/chamadoController';
import { autenticar, exigirPerfil } from '../middlewares/auth';

export const chamadoRoutes = Router();
const apenasAtendente = exigirPerfil(PerfilUsuario.ATENDENTE);

chamadoRoutes.use(autenticar);

chamadoRoutes.get('/', chamadoController.listar);
chamadoRoutes.post('/', chamadoController.criar);
chamadoRoutes.get('/:id', chamadoController.detalhar);
chamadoRoutes.patch('/:id/status', apenasAtendente, chamadoController.mudarStatus);
chamadoRoutes.post('/:id/comentarios', chamadoController.comentar);
chamadoRoutes.post('/:id/triagem', apenasAtendente, chamadoController.refazerTriagem);
chamadoRoutes.post('/:id/triagem/aceitar', apenasAtendente, chamadoController.aceitarTriagem);
chamadoRoutes.post('/:id/triagem/rejeitar', apenasAtendente, chamadoController.rejeitarTriagem);
