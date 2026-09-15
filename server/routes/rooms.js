import { Router } from 'express';
import {
  listRooms,
  getRoom,
  getRoomCalendarIcs,
  listRoomsForAdmin,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

// Público — exploración de habitaciones
router.get('/', listRooms);
// OJO: /manage debe registrarse antes que /:id o Express trataría "manage"
// como un ObjectId y enrutaría la petición a getRoom.
router.get('/manage', protect, listRoomsForAdmin);
// Calendario de ocupación en iCal, usado por "Integraciones y Calendario".
router.get('/:id/calendar.ics', getRoomCalendarIcs);
router.get('/:id', getRoom);

// Admin — gestión del inventario de habitaciones
router.post('/', protect, createRoom);
router.put('/:id', protect, updateRoom);
router.delete('/:id', protect, deleteRoom);

export default router;