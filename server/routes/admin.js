import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import {
  listAdminBookings,
  updateAdminBookingStatus,
} from '../controllers/bookingController.js';

const router = Router();

// Gestión de reservas (protegida con JWT de administración)
router.get('/reservas', protect, listAdminBookings);
router.patch('/reservas/:id', protect, updateAdminBookingStatus);

export default router;