import { Router } from 'express';
import * as categoriaController from '../controllers/categoriaController';
import * as dashboardController from '../controllers/dashboardController';
import { autenticar } from '../middlewares/auth';
import { authRoutes } from './authRoutes';
import { chamadoRoutes } from './chamadoRoutes';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/chamados', chamadoRoutes);
routes.get('/categorias', autenticar, categoriaController.listar);
routes.get('/dashboard/resumo', autenticar, dashboardController.resumo);
