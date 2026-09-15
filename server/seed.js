import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Room from './models/Room.js';

dotenv.config();

/**
 * Script de arranque para desarrollo.
 *   npm run seed
 *
 * Crea (de forma idempotente) una cuenta de administrador y unas cuantas
 * habitaciones de ejemplo para que la app sea usable de inmediato. Si el
 * administrador ya existe no se toca.
 *
 * Credenciales del administrador por defecto:
 *   email:    admin@hotel.local
 *   password: admin12345
 * Se pueden cambiar con las variables de entorno ADMIN_EMAIL / ADMIN_PASSWORD.
 */
async function seed() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hotel.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({ name: 'Encargado del Hotel', email: adminEmail, password: adminPassword });
    console.log(`[SEED] Administrador creado: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('[SEED] El administrador ya existe, se omite.');
  }

  const roomCount = await Room.countDocuments();
  if (roomCount === 0) {
    const sampleRooms = [
      {
        number: '101',
        name: 'Habitación Queen Acogedora',
        description: 'Una habitación compacta con cama de matrimonio y vistas al jardín, ideal para viajeros en solitario y parejas.',
        capacity: 2,
        pricePerNight: 89,
        amenities: ['Wi-Fi gratis', 'Smart TV', 'Hervidor y té', 'Vistas al jardín'],
        imageUrl: 'https://picsum.photos/seed/cozy-queen/800/500',
        active: true,
      },
      {
        number: '202',
        name: 'Suite King de Lujo',
        description: 'Amplia suite con cama king, zona de estar, ducha de lluvia con vestidor y balcón.',
        capacity: 3,
        pricePerNight: 149,
        amenities: ['Wi-Fi gratis', 'Smart TV', 'Balcón', 'Ducha de lluvia', 'Minibar'],
        imageUrl: 'https://picsum.photos/seed/deluxe-king/800/500',
        active: true,
      },
      {
        number: '303',
        name: 'Lodge Familiar',
        description: 'Lodge de dos dormitorios para hasta cinco personas, con cocina equipada y patio con jardín.',
        capacity: 5,
        pricePerNight: 219,
        amenities: ['Wi-Fi gratis', 'Cocina equipada', 'Dos dormitorios', 'Patio', 'Aparcamiento gratis'],
        imageUrl: 'https://picsum.photos/seed/family-lodge/800/500',
        active: true,
      },
      {
        number: 'PH-1',
        name: 'Penthouse Panorámica',
        description: 'Penthouse en la última planta con ventanales de suelo a techo y terraza envolvente.',
        capacity: 2,
        pricePerNight: 279,
        amenities: ['Wi-Fi gratis', 'Terraza', 'Bañera de hidromasaje', 'Smart TV', 'Servicio de habitaciones'],
        imageUrl: 'https://picsum.photos/seed/penthouse/800/500',
        active: true,
      },
    ];
    await Room.insertMany(sampleRooms);
    console.log(`[SEED] Creadas ${sampleRooms.length} habitaciones de ejemplo.`);
  } else {
    console.log('[SEED] Las habitaciones ya existen, se omite.');
  }

  await mongoose.disconnect();
  console.log('[SEED] Listo.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});