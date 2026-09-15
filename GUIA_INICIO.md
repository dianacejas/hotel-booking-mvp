# Guía de inicio — Boutique Carajito

Instrucciones paso a paso para levantar el proyecto completo (MongoDB, backend y
frontend) **sin necesidad de ninguna herramienta externa**. Solo usas la
terminal de Windows o la terminal integrada de VS Code.

---

## 0. Requisitos previos

- **Node.js 24.x** instalado. Verifica con:
  ```bash
  node -v
  npm -v
  ```
- **MongoDB 7.0** instalado en `C:\Program Files\MongoDB\Server\7.0\bin`.
- Las dependencias del proyecto ya instaladas (`node_modules`).
- **VS Code** (opcional, para la terminal integrada).

---

## Levantar con la terminal de VS Code (recomendado)

Puedes gestionar los tres procesos (MongoDB, backend y frontend) en **una sola
ventana** de VS Code usando sus terminales integradas. Cada servicio va en su
propia terminal para poder ver sus logs por separado y detenerlos
individualmente con `Ctrl + C`.

### Paso A — Abrir la carpeta del proyecto

1. Abre VS Code.
2. `Archivo > Abrir carpeta...` y selecciona `C:\Users\diana\hotel-booking-mvp`.
   También puedes arrastrar la carpeta a la ventana de VS Code.

### Paso B — Crear las 3 terminales

1. Abre la terminal integrada con el atajo **`` Ctrl + ` ``** (o menú
   `Terminal > Nueva terminal`).
2. Crea la segunda terminal con el botón **"+ / dividir terminal"** (ícono de
   división en la esquina superior derecha del panel de terminal) o con el
   atajo **`Ctrl + Shift + 5`**.
3. Hazlo una vez más para tener **tres terminales** en total. Renómbralas (clic
   derecho sobre cada una > "Cambiar nombre": `MongoDB`, `Backend`,
   `Frontend`) para no confundirte.

### Paso C — Levantar cada servicio

En la terminal **MongoDB**:
```bash
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

En la terminal **Backend** (la primera vez, además del seed):
```bash
cd C:\Users\diana\hotel-booking-mvp\server
npm run seed
npm run dev
```

En la terminal **Frontend**:
```bash
cd C:\Users\diana\hotel-booking-mvp\client
npm run dev
```

### Paso D — Abrir la aplicación

Pulsa **`Ctrl + clic`** sobre `http://localhost:5173/` en la terminal del
Frontend (o ábrela manualmente en el navegador).

- Huésped: http://localhost:5173
- Admin: http://localhost:5173/admin/login
  - Email: `admin@hotel.local` — Contraseña: `admin12345`

### Paso E — Detener todo

Haz clic en cada terminal y pulsa `Ctrl + C` (o pulsa la papelera del panel de
terminal para matar el proceso).

> Truco: VS Code recordará las terminales y su carpeta de trabajo al reabrir el
> proyecto, pero los procesos se detienen al cerrar la ventana. La próxima vez
> solo repites los pasos B y C.

---

## Levantar con terminales de Windows (método clásico)

Si prefieres no usar VS Code, abre tantas ventanas de PowerShell como quieras y
ejecuta en cada una los pasos siguientes.

---

## 1. Levantar MongoDB

MongoDB **no** se inicia solo; hay que arrancar el servicio cada vez.

1. Abre una terminal de PowerShell.
2. Ejecuta:
   ```bash
   & "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
   ```
   La carpeta `C:\data\db` ya existe. Deja **esta terminal abierta**; es donde
   MongoDB escribe sus logs.

3. Verifica que quedó escuchando en el puerto 27017 abriendo **otra terminal**
   y ejecutando:
   ```bash
   netstat -an | findstr 27017
   ```
   Debes ver una línea con `LISTENING`.

> Si algún día pones en marcha MongoDB como Servicio de Windows, este paso
> se sustituye por iniciar el servicio.

---

## 2. Preparar el backend

1. Abre una terminal nueva y entra a la carpeta del servidor:
   ```bash
   cd C:\Users\diana\hotel-booking-mvp\server
   ```

2. (Solo la primera vez) El archivo `.env` ya existe. Si no existiera, se crea
   así:
   ```bash
   copy .env.example .env
   ```
   Valores por defecto: `PORT=5000`, `MONGO_URI=mongodb://127.0.0.1:27017/hotel_booking_db`.
   Cambia `JWT_SECRET` a un valor largo y aleatorio si quieres.

3. Sembrar la base de datos (crea el admin y 4 habitaciones de ejemplo). Es
   **idempotente**: si ya existe algo, no lo duplica.
   ```bash
   npm run seed
   ```
   Deberías ver:
   ```
   [SEED] Administrador creado: admin@hotel.local / admin12345
   [SEED] Listo.
   ```
   (La primera vez del proyecto, la parte del admin aparece como "creado"; en
   ejecuciones posteriores dirá "ya existe, se omite".)

4. Arrancar el servidor de la API:
   ```bash
   npm run dev
   ```
   Debe mostrar: `[API] Servidor de reservas del hotel en http://localhost:5000`.

5. Deja **esta terminal abierta** con el backend corriendo.

---

## 3. Levantar el frontend

1. Abre una terminal nueva y entra a la carpeta del cliente:
   ```bash
   cd C:\Users\diana\hotel-booking-mvp\client
   ```

2. Arranca el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   Debe mostrar: `Local: http://localhost:5173/`

3. Deja **esta terminal abierta** con el frontend corriendo.

---

## 4. Usar la aplicación

Con las tres terminales abiertas (MongoDB, backend, frontend):

- **Página principal (huésped)**: abre http://localhost:5173
- **Panel de administración**: abre http://localhost:5173/admin/login

### Credenciales de administrador

| Campo       | Valor              |
| ----------- | ------------------ |
| Email       | `admin@hotel.local` |
| Contraseña  | `admin12345`       |

El panel permite crear habitaciones, editar la tarifa por noche y activar o
desactivar su disponibilidad, gestionar las reservas realizadas y sincronizar el
calendario de cada habitación (pestañas **Habitaciones** y **Reservas**).

### 4.1 Configurar los datos del alojamiento

La portada pública (teléfono, WhatsApp, correo, redes sociales, dirección y
mapa) se lee desde un único archivo de configuración:

```
client/src/services/site.js
```

Ajusta estos valores antes de publicar:

| Campo            | Qué es                                                        |
| ---------------- | ------------------------------------------------------------- |
| `name`           | Nombre del alojamiento                                        |
| `tagline`        | Frase de bienvenida de la portada                             |
| `phone` / `phoneHref` | Teléfono visible y enlace `tel:`                          |
| `whatsappNumber` | WhatsApp con código de país, sin `+` ni espacios (ej. `34600000000`) |
| `whatsappMessage`| Saludo inicial del botón flotante de WhatsApp                 |
| `email` / `emailHref` | Correo de reservas                                        |
| `address`        | Dirección: con ella se generan el mapa y el botón "Abrir en Google Maps" |
| `instagram` / `facebook` | Perfiles de redes sociales                           |

> Las fotos de la portada y de la galería son marcadores de `picsum.photos`
> (solo se ven con internet). Para usar tus propias fotos, sustituye las URLs
> en `client/src/styles.css` (sección `.landing-hero`) y en
> `client/src/components/Gallery.jsx`.

---

## 5. Detener todo

Cierra las terminales con `Ctrl + C` en cada una:

1. Frontend (terminal 3)
2. Backend (terminal 2)
3. MongoDB (terminal 1)

---

## 6. Solución de problemas

| Problema | Causa probable | Solución |
| -------- | -------------- | -------- |
| `[DB] MongoDB connected` nunca aparece | MongoDB no está corriendo | Repite el paso 1 y deja esa terminal abierta |
| "Correo o contraseña incorrectos" al hacer login | La BD no tiene el admin | Ejecuta `npm run seed` en `server/` |
| `npm run seed` dice "Missing script" | package.json sin el script `seed` | Debe decir `"seed": "node seed.js"` en `scripts` |
| El puerto 5000 o 5173 está ocupado | Otra app usa el puerto | Cierra la otra app o cambia `PORT` en el `.env` |
| Las imágenes (portada, galería o habitaciones) no cargan | `picsum.photos` sin conexión | Es normal sin internet; el resto de la app funciona |
| El botón de WhatsApp o el mapa no muestran tus datos | Datos de ejemplo en `site.js` | Edita `client/src/services/site.js` con teléfono, dirección y redes reales |

---

## Resumen rápido (atasco de memoria)

Levanta el proyecto en VS Code (ver sección "Levantar con la terminal de VS
Code" para crear las 3 terminales) o con 3 terminales separadas de Windows:

```bash
# Terminal 1 — MongoDB
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"

# Terminal 2 — Backend (+ seed solo la primera vez)
cd C:\Users\diana\hotel-booking-mvp\server
npm run seed
npm run dev

# Terminal 3 — Frontend
cd C:\Users\diana\hotel-booking-mvp\client
npm run dev
```

Luego abre **http://localhost:5173**. Admin en **http://localhost:5173/admin/login**
(`admin@hotel.local` / `admin12345`).