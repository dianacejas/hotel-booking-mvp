import { Router } from 'express';
import {
  createBooking,
  getBookingByReference,
} from '../controllers/bookingController.js';

const router = Router();

// Público — crear una reserva y consultarla por referencia + correo
router.post('/', createBooking);
router.get('/lookup/:referenceCode', getBookingByReference);

export default router;