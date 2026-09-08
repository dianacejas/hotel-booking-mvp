# Boutique Carajito — Motor de reserva directa

Aplicación web de reservas para un alojamiento boutique: el **huésped** descubre
habitaciones, elige fechas y reserva directamente con confirmación inmediata.
El **administrador** dispone de una utilidad mínima para gestionar el inventario
de habitaciones (crear, editar tarifas, activar/desactivar disponibilidad).

- **Frontend**: React 18 + Vite 5 (SPA en español, mobile-first).
- **Backend**: Express + Mongoose (MERN), JWT para la zona de administración.
- **Base de datos**: MongoDB local (`mongodb://127.0.0.1:27017/hotel_booking_db`).

## Requisitos previos

- **Node.js 24.x** (compatible con la versión 24.14.0)
- **MongoDB local** en `127.0.0.1:27017` (arranca tu servicio de MongoDB).
  MongoDB Compass sirve para inspeccionar la base `hotel_booking_db`.
- **npm** (incluido con Node.js)

## Estructura

```
hotel-booking-mvp/
├── server/   # API Express (puerto 5000)
│   ├── .env        # configuración (crear a partir de .env.example)
│   └── seed.js     # datos de ejemplo (admin + habitaciones)
├── client/   # SPA React + Vite (dev en el puerto 5173)
└── README.md
```

## Puesta en marcha

### 1. Instalar dependencias

Desde la raíz del proyecto, en dos terminales:

```bash
# Terminal 1 — backend
cd server
npm install

# Terminal 2 — frontend
cd client
npm install
```

### 2. Configurar variables de entorno

```bash
cd server
cp .env.example .env   # en Windows: copy .env.example .env
```

Edita `.env` si quieres cambiar valores:

| Variable        | Descripción                                        | Valor por defecto                          |
| --------------- | -------------------------------------------------- | ------------------------------------------ |
| `PORT`          | Puerto del servidor Express                        | `5000`                                     |
| `MONGO_URI`     | Cadena de conexión a MongoDB                       | `mongodb://127.0.0.1:27017/hotel_booking_db` |
| `JWT_SECRET`    | Secreto para firmar los tokens JWT                 | (cámbialo a un valor largo y aleatorio)    |
| `JWT_EXPIRES_IN`| Caducidad del token                                | `7d`                                       |

### 3. Sembrar la base de datos (solo la primera vez)

Crea de forma idempotente el administrador y 4 habitaciones de ejemplo:

```bash
cd server
npm run seed
```

### 4. Ejecutar backend y frontend a la vez

Abre **dos terminales** y ejecuta en cada una:

```bash
# Terminal 1 — API en http://localhost:5000
cd server
npm run dev
```

```bash
# Terminal 2 — frontend en http://localhost:5173
cd client
npm run dev
```

El frontend de Vite redirige `/api/*` al backend del puerto 5000, así que solo
visitas `http://localhost:5173`.

### Modo producción (opcional)

Compila el frontend y deja que Express lo sirva junto a la API:

```bash
# 1. Build del cliente
cd client
npm run build

# 2. Arranque del servidor (sirve SPA + API en http://localhost:5000)
cd ../server
npm start
```

## Administrador

El script `seed` crea la cuenta por defecto:

- **Email**: `admin@hotel.local`
- **Contraseña**: `admin12345`

> Cambia las credenciales con las variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`
> antes de ejecutar `npm run seed` (por ejemplo, en producción).

Para acceder: pulsa **"Iniciar sesión / Admin"** en la barra superior e
introduce las credenciales. El panel permite crear habitaciones, editar la
tarifa por noche y activar o desactivar su disponibilidad con un interruptor.

## Consultas del huésped

- El huésped puede consultar una reserva creada en **"Mi reserva"** usando el
  código de referencia (`RES-XXXXX`) y el correo con el que reservó.