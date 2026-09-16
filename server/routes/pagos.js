import { Router } from 'express';
import { crearPreferencia } from '../controllers/paymentController.js';

const router = Router();

// Checkout Pro (sandbox/test): devuelve el id de preferencia y el init_point
router.post('/crear-preferencia', crearPreferencia);

export default router;