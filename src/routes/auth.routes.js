import { Router } from 'express';
import { renderLogin, renderRegister, login, register, logout } from '../controllers/auth.controller.js';

const router = Router();

router.get('/login', renderLogin);
router.post('/login', login);
router.get('/register', renderRegister);
router.post('/register', register);
router.get('/logout', logout);

export default router;
