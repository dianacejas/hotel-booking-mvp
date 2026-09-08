import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', protect, me);

export default router;