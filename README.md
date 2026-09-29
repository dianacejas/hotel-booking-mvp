# Motor de reserva directa para alojamiento boutique

Aplicación web de reservas para un alojamiento tipo lodge o boutique: el **huésped**
descubre las habitaciones, elige fechas, suma servicios adicionales y reserva de
forma directa con confirmación inmediata y comprobante imprimible. El
**administrador** gestiona el inventario de habitaciones, sus calendarios y las
reservas recibidas desde un panel protegido con pestañas.

Este repositorio es un **MVP de portfolio**: la configuración de marca y contacto
está centralizada en `client/src/services/site.ts` y usa valores de ejemplo
sustituibles, de modo que el proyecto se puede publicar sin exponer datos reales
del alojamiento.

## Stack

- **Frontend**: React 18 + Vite 5 + **TypeScript** (SPA en español, mobile-first).
  `@tanstack/react-query` para el estado del servidor y `zod` para validar datos.
- **Backend**: Express 4 + Mongoose 8 (MERN), en JavaScript, con JWT para la zona
  de administración.
- **Base de datos**: MongoDB local (`mongodb://127.0.0.1:27017/hotel_booking_db`).
- **Pagos**: Mercado Pago Checkout Pro en modo sandbox, más métodos simulados.
- **Licencia**: MIT.

## Requisitos previos

- **Node.js 24.x**
- **npm** (incluido con Node.js)
- **MongoDB** escuchando en `127.0.0.1:27017`. MongoDB Compass sirve para
  inspeccionar la base `hotel_booking_db`.

## Estructura

```
hotel-booking-mvp/
├── server/   # API Express (puerto 5000) — JavaScript
│   ├── controllers/     # lógica de reservas, habitaciones y pagos
│   ├── routes/          # including pagos.js → POST /api/pagos/crear-preferencia
│   ├── models/          # esquemas de Mongoose
│   ├── .env.example     # plantilla de configuración (copiar a .env)
│   └── seed.js          # datos de ejemplo (admin + habitaciones)
└── client/   # SPA React + Vite (dev en el puerto 5173) — TypeScript
    ├── tsconfig.json    # TypeScript estricto
    └── src/
        ├── types.ts               # tipos compartidos (Room, Booking, …)
        ├── services/              # api, dates, theme, site
        ├── hooks/useReveal.ts     # animaciones de aparición al hacer scroll
        ├── components/            # Hero, CheckoutModal, RoomsManager, …
        └── pages/                 # Home, Checkout, AdminDashboard, …
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

| Variable            | Descripción                                          | Por defecto                              |
| ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `PORT`              | Puerto del servidor Express                          | `5000`                                   |
| `MONGO_URI`         | Cadena de conexión a MongoDB                         | `mongodb://127.0.0.1:27017/hotel_booking_db` |
| `JWT_SECRET`        | Clave para firmar los tokens                         | (obligatoria, sin valor por defecto)     |
| `JWT_EXPIRES_IN`    | Caducidad del token                                  | `7d`                                     |
| `MP_ACCESS_TOKEN`   | Access token **TEST** de Mercado Pago (Checkout Pro) | (vacío: el pago online queda deshabilitado) |
| `ADMIN_EMAIL`       | Correo del admin que crea el seed                    | (definilo antes de sembrar)              |
| `ADMIN_PASSWORD`    | Contraseña del admin que crea el seed                | (cámbiala antes de usar el seed)         |

> `JWT_SECRET` no tiene valor por defecto a propósito: si falta, el servidor
> arranca con una clave de firma conocida y cualquier token ajeno sería válido.
> Generá una con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### 3. Sembrar la base de datos (solo la primera vez)

Crea de forma idempotente el administrador y 4 habitaciones de ejemplo:

```bash
cd server
npm run seed
```

### 4. Ejecutar backend y frontend

En dos terminales:

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

Vite redirige `/api/*` al backend del puerto 5000, así que solo se visita
`http://localhost:5173`.

## Scripts

### Backend (`server/`)

| Comando       | Qué hace                                    |
| ------------- | ------------------------------------------- |
| `npm run dev` | Servidor en modo watch (`node --watch`)     |
| `npm start`   | Arranque normal                             |
| `npm run seed`| Crea el admin y las habitaciones de ejemplo  |

### Frontend (`client/`)

| Comando             | Qué hace                                     |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo de Vite               |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm run build`     | `tsc --noEmit && vite build`                  |
| `npm run preview`   | Sirve el build de producción                 |

### Modo producción (opcional)

```bash
# 1. Build del cliente
cd client && npm run build

# 2. Express sirve la SPA junto a la API
cd ../server && npm start
```

## Panel de administración

El acceso está en **“Iniciar sesión / Admin”** en la barra superior. El script
`seed` crea una cuenta de ejemplo definida por `ADMIN_EMAIL` / `ADMIN_PASSWORD`;
como son credenciales de desarrollo, lo correcto es fijar las tuyas antes de
sembrar:

```bash
ADMIN_EMAIL=tu-admin@ejemplo.com ADMIN_PASSWORD="<contraseña larga>" npm run seed
```

> Nunca subas credenciales reales al repositorio: `.env` está en `.gitignore`.

El panel tiene dos pestañas:

- **Habitaciones**: alta y edición completa en línea de cada unidad (nombre,
  número, descripción, capacidad, tarifa por noche, servicios, URL de imagen y
  disponibilidad). Los cambios se guardan con `PATCH /api/admin/habitaciones/:id`
  y cada fila confirma visualmente el guardado. Incluye la sección
  **“Integraciones y Calendario”** con el enlace iCal
  (`/api/rooms/:id/calendar.ics`) para publicar en plataformas externas.
- **Reservas realizadas**: tabla con búsqueda por huésped o código, filtro por
  estado (confirmadas / pendientes / canceladas) y acciones de confirmar,
  reactivar y cancelar. Al cancelar se liberan las noches; al reactivar se
  comprueba que las fechas sigan libres.

## Pagos con Mercado Pago (sandbox)

El checkout ofrece una pestaña de pago online con Checkout Pro en modo de prueba:

1. El frontend crea la reserva en estado `pending` con método `mercadopago`.
2. Llama a `POST /api/pagos/crear-preferencia`; el servidor **recalcula el
   total** (noches × tarifa + extras) y crea la preferencia con el SDK oficial,
   devolviendo `{ preferenceId, initPoint, total }`.
3. El navegador guarda la referencia en `sessionStorage` y redirige a
   `initPoint` (el `sandbox_init_point` en modo test).
4. Al volver a `/confirmation?mp=success|pending|failure`, la app recupera la
   reserva y muestra el comprobante con el aviso correspondiente.

Si `MP_ACCESS_TOKEN` está vacío o la pasarela no responde, el endpoint devuelve
`503` pero la reserva **igual queda registrada como pendiente**: no se bloquea al
huésped. No se realizan cobros reales.

## Funcionalidades

- **Checkout con upselling**: el huésped suma extras (desayuno, traslado, late
  check-out) con precio dinámico por noche antes de confirmar.
- **Métodos de pago**: tarjeta, transferencia, pago en el check-in o Mercado
  Pago; el total y el método quedan guardados en la reserva.
- **Comprobante imprimible**: la confirmación incluye un voucher que se puede
  imprimir o guardar como PDF.
- **Consulta de reserva**: el huésped recupera una reserva con su código
  (`RES-XXXXX`) y el correo usado, viendo extras y método de pago.
- **Calendario iCal** por habitación (exportación y enlace).
- **Animaciones de aparición al hacer scroll** con `IntersectionObserver`
  (`useReveal`), sin librerías y respetando `prefers-reduced-motion`.

## Personalizar la marca

`client/src/services/site.ts` concentra nombre, lema, teléfono, WhatsApp, correo,
dirección y redes. Todo el sitio lee de ahí, así que adaptar el alojamiento a otro
cliente es editar un solo archivo. Las imágenes y textos de la portada están en
`client/src/components/`.

## Notas de seguridad

- `.env` está ignorado por Git; solo se versiona `.env.example`.
- `JWT_SECRET` es obligatoria y no tiene valor por defecto.
- Las contraseñas se guardan con hash (`bcryptjs`), nunca en claro.
- Todos los endpoints del panel pasan por middleware de autenticación; la
  autorización se valida en el servidor y no solo ocultando elementos en la UI.
- Mercado Pago corre en modo test: usá siempre un token `TEST-` y no publiques
  un token de producción en el repositorio.

## Licencia

MIT.
