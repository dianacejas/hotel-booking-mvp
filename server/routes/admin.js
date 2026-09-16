import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import {
  listAdminBookings,
  updateAdminBookingStatus,
} from '../controllers/bookingController.js';
import { updateRoom } from '../controllers/roomController.js';

const router = Router();

// Gestión de reservas (protegida con JWT de administración)
router.get('/reservas', protect, listAdminBookings);
router.patch('/reservas/:id', protect, updateAdminBookingStatus);

// Gestión de habitaciones (PATCH parcial, protegida con JWT de administración).
// Reutiliza la validación de campos de updateRoom fijada en roomsController.
router.patch('/habitaciones/:id', protect, updateRoom);

export default router;