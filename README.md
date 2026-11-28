# Menú digital

Plataforma web para que un comercio gastronómico publique su carta y reciba consultas de sus clientes. El cliente recorre los platos deslizando, como en un feed de videos. El comercio administra productos, categorías, mensajes y sus datos desde un panel.

- `backend/`: API REST en Node.js con Express, Sequelize y PostgreSQL.
- `frontend/`: aplicación en React con Vite y Tailwind CSS.

## Requisitos

- Node.js 20 o superior
- Una base de datos PostgreSQL. Usamos Supabase.

## Cómo levantarlo

### Backend

```bash
cd backend
npm install
```

Copiar `.env.example` a `.env` y completar los datos de la base y un `JWT_SECRET` propio. Después:

```bash
npm run dev
```

La API queda en `http://localhost:4000/api`. Al arrancar se conecta a la base y crea las tablas que falten.

### Frontend

```bash
cd frontend
npm install
```

Copiar `.env.example` a `.env`. Si el backend corre en otro puerto o dominio, cambiar `VITE_API_URL`. Después:

```bash
npm run dev
```

La aplicación queda en `http://localhost:5173`. Para generar la versión de producción: `npm run build`.

### Los dos juntos

Con las dependencias instaladas en las dos carpetas, desde `frontend` se pueden levantar el backend y el frontend con un solo comando:

```bash
npm run dev:todo
```

Los mensajes de cada uno aparecen en la misma terminal con las etiquetas `back` y `front`. Con Ctrl+C se cierran los dos.

### Primer uso

1. Entrar a `http://localhost:5173/registro` y crear el primer administrador. El registro solo está abierto mientras no exista ningún administrador; después se cierra y los demás usuarios se agregan desde el panel, en Equipo.
2. Ingresar con el email o el usuario y la contraseña.
3. Cargar categorías y productos desde el panel (`/admin`), o usar los datos de ejemplo.

## Datos de ejemplo

`backend/datos-ejemplo.sql` carga los datos del comercio, 6 categorías, 19 productos con fotos, 2 mensajes y 3 respuestas rápidas. Incluye un descuento vigente, uno vencido y un producto agotado. Cada producto tiene una descripción completa (ingredientes, preparación y porción) y sus etiquetas para el cliente, como Sin TACC, Vegetariano o Picante.

Se corre en el editor SQL de la base (en Supabase, SQL Editor), después de haber levantado el backend una vez para que existan las tablas y la columna `tags`. Se puede correr más de una vez sin duplicar datos; cada vez vuelve a poner las descripciones y etiquetas de ejemplo en esos 19 productos.

## Variables de entorno

Los valores de ejemplo están en el `.env.example` de cada carpeta.

| Variable | Proyecto | Para qué |
| --- | --- | --- |
| `PORT` | backend | Puerto de la API. |
| `NODE_ENV` | backend | `development` o `production`. En desarrollo, la recuperación de contraseña devuelve el token en la respuesta porque no se envían mails. |
| `CORS_ORIGIN` | backend | URL del frontend que puede llamar a la API. Por defecto `http://localhost:5173`; obligatoria en producción. |
| `JWT_SECRET` | backend | Clave para firmar los tokens de sesión. Obligatoria en producción: sin ella el servidor no arranca. |
| `TRUST_PROXY` | backend | `true` si la API corre detrás de un proxy, para que el límite de pedidos use la IP real del cliente. |
| `JWT_EXPIRES_IN` | backend | Duración de la sesión, por ejemplo `24h`. |
| `RESET_TOKEN_EXPIRES_MINUTES` | backend | Minutos de validez del link para recuperar la contraseña. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | backend | Conexión a PostgreSQL. En Supabase usar los datos del *Session pooler* (Connect → Session pooler), porque la conexión directa solo funciona con IPv6. |
| `DB_DIALECT` | backend | `postgres`. |
| `DB_SSL` | backend | `true` para Supabase. |
| `VITE_API_URL` | frontend | URL base de la API, terminada en `/api`. |
| `VITE_AUTH_COVER_URL` | frontend | Foto que se muestra en las pantallas de ingreso y registro. |

## Estructura

```
backend/
  app.js          arranque del servidor, middlewares y conexión a la base
  config.js       lectura de las variables de entorno
  routes/         URLs de la API y qué controller atiende cada una
  controllers/    leen el request y arman la respuesta
  services/       reglas de negocio y validaciones
  models/         tablas y relaciones (Sequelize)
  auth/           middleware que valida el token
  middlewares/    límite de pedidos por IP
  utils/          errores HTTP y wrapper de los controllers
  databases/      conexión a PostgreSQL

frontend/src/
  api/            cliente HTTP y una función por endpoint
  components/     piezas reutilizables (modal, formularios, chips)
  components/feed/  el menú deslizable: gestos, slides, header y paneles
  context/        sesión del usuario
  hooks/          lógica reutilizable (tamaño de pantalla, teclas, demoras)
  pages/          pantallas públicas, de ingreso y del panel
  utils/          formato de precios y armado de URLs de fotos
  config.js       valores configurables leídos de las variables de entorno
  index.css       colores, tipografías y estilos base
```

Todas las respuestas de la API tienen la forma `{ status, data, message }`. Las rutas protegidas esperan el token en el header `x-access-token`.

## Endpoints

| Método | Ruta | Token |
| --- | --- | --- |
| GET | `/api/auth/registration` (indica si el registro está abierto) | No |
| POST | `/api/auth/registration` (solo si no hay administradores) | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | No |
| POST | `/api/auth/recover-password` | No |
| POST | `/api/auth/reset-password` | No |
| GET, PATCH | `/api/auth/profile` | Sí |
| GET | `/api/products` (filtros `search` y `category_id`) | No |
| GET | `/api/products/:id` | No |
| POST | `/api/products` | Sí |
| PATCH, DELETE | `/api/products/:id` | Sí |
| GET | `/api/categories` | No |
| POST | `/api/categories` | Sí |
| PATCH, DELETE | `/api/categories/:id` | Sí |
| GET | `/api/business-info` | No |
| PATCH | `/api/business-info` | Sí |
| POST | `/api/contact-messages` | No |
| GET | `/api/contact-messages` | Sí |
| GET | `/api/contact-messages/summary` (pendientes y sin responder) | Sí |
| PATCH, DELETE | `/api/contact-messages/:id` (PATCH acepta `status`, `internalNote` y `archived`) | Sí |
| GET, POST | `/api/quick-replies` (respuestas rápidas) | Sí |
| PATCH, DELETE | `/api/quick-replies/:id` | Sí |
| GET, POST | `/api/admin-users` (usuarios del panel) | Sí |
| PATCH, DELETE | `/api/admin-users/:id` (no permite eliminarse a uno mismo) | Sí |

## Documentación

- [docs/consultas.md](docs/consultas.md): recorrido de una consulta, estados y respuesta.
- [docs/validaciones.md](docs/validaciones.md): reglas de cada campo y límites de pedidos.

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| `/` | Menú para clientes |
| `/login`, `/registro` | Ingreso y registro del administrador |
| `/recuperar`, `/reset` | Recuperación de contraseña |
| `/admin/hoy` | Lo que requiere acción: consultas sin responder, agotados, destacados por vencer y productos incompletos |
| `/admin/productos` | Productos |
| `/admin/categorias` | Categorías |
| `/admin/mensajes` | Consultas recibidas |
| `/admin/comercio` | Datos del comercio |
| `/admin/equipo` | Usuarios que pueden ingresar al panel |
| `/admin/perfil` | Perfil del administrador |
