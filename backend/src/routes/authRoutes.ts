import { Router } from 'express';
import * as authController from '../controllers/authController';
import { autenticar } from '../middlewares/auth';

export const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.get('/me', autenticar, authController.me);
