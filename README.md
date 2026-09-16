# Altos del Lago Lodge & Boutique — Motor de reserva directa

Aplicación web de reservas para un alojamiento boutique: el **huésped** descubre
habitaciones, elige fechas, suma servicios adicionales y reserva directamente con
confirmación inmediata y un comprobante imprimible. El **administrador** gestiona
el inventario de habitaciones, sus calendarios y las reservas recibidas (a través
de un panel protegido con pestañas).

- **Frontend**: React 18 + Vite 5 + **TypeScript** (SPA en español, mobile-first).
- **Backend**: Express + Mongoose (MERN), JavaScript, JWT para la zona de administración.
- **Base de datos**: MongoDB local (`mongodb://127.0.0.1:27017/hotel_booking_db`).
- **Pagos**: Mercado Pago Checkout Pro (modo sandbox/test) además de los métodos simulados.

## Requisitos previos

- **Node.js 24.x** (compatible con la versión 24.14.0)
- **MongoDB local** en `127.0.0.1:27017` (arranca tu servicio de MongoDB).
  MongoDB Compass sirve para inspeccionar la base `hotel_booking_db`.
- **npm** (incluido con Node.js)

## Estructura

```
hotel-booking-mvp/
├── server/   # API Express (puerto 5000) — JavaScript
│   ├── controllers/paymentController.js  # integración Mercado Pago
│   ├── routes/pagos.js                    # POST /api/pagos/crear-preferencia
│   ├── .env        # configuración (crear a partir de .env.example)
│   └── seed.js     # datos de ejemplo (admin + habitaciones)
├── client/   # SPA React + Vite (dev en el puerto 5173) — TypeScript
│   ├── tsconfig.json
│   └── src/
│       ├── types.ts               # tipos compartidos (Room, Booking, …)
│       ├── services/              # api, dates, theme, site
│       ├── hooks/useReveal.ts     # animaciones de aparición al hacer scroll
│       ├── components/            # Hero, CheckoutModal, RoomsManager, …
│       └── pages/                 # Home, Checkout, AdminDashboard, …
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

| Variable          | Descripción                                             | Valor por defecto                            |
| ----------------- | ------------------------------------------------------- | -------------------------------------------- |
| `PORT`            | Puerto del servidor Express                             | `5000`                                       |
| `MONGO_URI`       | Cadena de conexión a MongoDB                            | `mongodb://127.0.0.1:27017/hotel_booking_db` |
| `JWT_SECRET`      | Secreto para firmar los tokens JWT                      | (cámbialo a un valor largo y aleatorio)      |
| `JWT_EXPIRES_IN`  | Caducidad del token                                     | `7d`                                         |
| `MP_ACCESS_TOKEN` | Access token **TEST** de Mercado Pago (Checkout Pro)    | (vacío: el pago online queda deshabilitado)  |

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

### Scripts útiles del cliente

| Comando             | Qué hace                                              |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo de Vite                        |
| `npm run typecheck` | Comprueba los tipos con `tsc --noEmit`                |
| `npm run build`     | `tsc --noEmit && vite build` (falla si hay errores TS)|

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
introduce las credenciales. El panel tiene dos pestañas:

- **Habitaciones**: alta de habitaciones y **edición completa en línea** de cada
  unidad (nombre, número, descripción, capacidad, tarifa por noche, servicios,
  URL de imagen y activar/desactivar disponibilidad). Los cambios se guardan con
  `PATCH /api/admin/habitaciones/:id` y cada fila muestra su propia confirmación
  visual ("Guardado"). También incluye, por habitación, la sección
  **"Integraciones y Calendario"** con su enlace iCal
  (`/api/rooms/:id/calendar.ics`) para pegar en Booking/Airbnb y el campo para
  vincular un calendario externo (simulado en `localStorage`).
- **Reservas realizadas**: tabla con búsqueda por huésped o código, filtro por
  estado (confirmadas / pendientes / canceladas) y acciones rápidas de
  confirmar, reactivar y cancelar. Al cancelar una reserva se liberan sus noches;
  al reactivarla se comprueba que las fechas sigan libres.

## Pagos con Mercado Pago (sandbox)

El checkout ofrece una pestaña **"Pago online con Mercado Pago"** que usa
Checkout Pro en modo de prueba:

1. El frontend crea la reserva en estado `pending` con método `mercadopago`.
2. Llama a `POST /api/pagos/crear-preferencia` con los datos de la estancia; el
   servidor **recalcula el importe total** (noches × tarifa + extras) y crea la
   preferencia con el SDK oficial (`mercadopago`), devolviendo
   `{ preferenceId, initPoint, total }`.
3. El navegador guarda la referencia de la reserva en `sessionStorage` y
   redirige a `initPoint` (el `sandbox_init_point` en modo test).
4. Al volver a `/confirmation?mp=success|pending|failure`, la app recupera la
   reserva con la referencia guardada y muestra el comprobante con el aviso
   correspondiente al estado del pago.

Configuración: define `MP_ACCESS_TOKEN` con un token **TEST-** de Mercado Pago.
Si está vacío (o la pasarela no responde), el endpoint devuelve `503` pero la
reserva **igual queda registrada como pendiente** y el checkout muestra el
comprobante con un aviso; no se bloquea al huésped. No se realizan cobros reales.

## Novedades de la versión 1.5

- **Migración del cliente a TypeScript**: todos los componentes y páginas son
  `.tsx`, con tipos compartidos en `src/types.ts`, `tsconfig.json` estricto y
  `tsc --noEmit` integrado en el build. El backend permanece en JavaScript.
- **Rebranding completo** a *Altos del Lago Lodge & Boutique* (marca, contacto,
  redes, títulos, vouchers y calendario iCal).
- **Hero con video de fondo** (Coverr, dominio público) más capa de degradado y
  póster de respaldo.
- **Animaciones de aparición al hacer scroll** con `IntersectionObserver`
  (`useReveal`), sin librerías y respetando `prefers-reduced-motion`.
- **Mercado Pago Checkout Pro** en sandbox (ver arriba).
- **Edición de habitaciones en el panel admin** campo por campo, con PATCH
  dedicado y confirmación por fila.
- **Correcciones de UI**: el resumen de la reserva ya no recorta valores largos
  (correos, nombres compuestos) y las tarjetas del catálogo respetan el contexto
  de apilamiento al elevarse en hover.

## Funcionalidades base

- **Checkout interactivo con upselling**: el huésped suma extras (desayuno,
  traslado, late check-out) con precio dinámico por noche antes de confirmar.
- **Métodos de pago**: tarjeta, transferencia bancaria, pago en el check-in o
  Mercado Pago; el importe total y el método quedan guardados en la reserva.
- **Comprobante imprimible**: la confirmación incluye un voucher que se guarda
  como PDF (`Imprimir / Guardar Voucher PDF`).
- **Panel admin de reservas**: lista, busca, filtra, confirma o cancela reservas.
- **Reseñas de huéspedes** en la portada como prueba social.
- **Sincronización de calendario iCal** por habitación (export + enlace).

## Consultas del huésped

- El huésped puede consultar una reserva creada en **"Mi reserva"** usando el
  código de referencia (`RES-XXXXX`) y el correo con el que reservó. La consulta
  muestra también los extras contratados y el método de pago elegido.
