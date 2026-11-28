# Validaciones

Las reglas de negocio viven en `backend/services/`. El frontend repite las más comunes para avisar antes de enviar, pero la API es la que decide. Cuando una regla falla, la API responde `400` (o `409` si es un duplicado) con `{ status, message }`, y el mensaje está pensado para mostrarse tal cual.

## Consultas (`contact-messages`)

| Campo | Regla |
| --- | --- |
| `name` | Obligatorio, hasta 150 caracteres. |
| `email` | Obligatorio, formato de email, hasta 150 caracteres. Se guarda en minúsculas. |
| `phone` | Opcional. Solo números, espacios, `+`, `-` y paréntesis, entre 6 y 30 caracteres. |
| `subject` | Opcional, hasta 200 caracteres. Por defecto `Consulta general`. |
| `message` | Obligatorio, entre 10 y 2000 caracteres. |
| `status` | `pendiente`, `leido` o `respondido`. |
| `internalNote` | Opcional, hasta 2000 caracteres. Vacío o `null` la borra. |
| `archived` | `true` o `false`. Guarda la fecha en `archivedAt`. |

## Respuestas rápidas (`quick-replies`)

| Campo | Regla |
| --- | --- |
| `title` | Obligatorio, hasta 60 caracteres. |
| `text` | Obligatorio, hasta 1000 caracteres. `{nombre}` se reemplaza en el panel por el nombre del cliente. |
| Cantidad | Hasta 30. |

## Productos

| Campo | Regla |
| --- | --- |
| `name`, `price`, `categoryId` | Obligatorios al crear. La categoría tiene que existir. |
| `price`, `discountPrice` | Números mayores o iguales a 0. |
| `badgeType` | `ninguno`, `descuento`, `nuevo`, `mas_vendido`, `recomendado_chef` o `ultimas_unidades`. |
| `discountPrice` con `descuento` | Obligatorio y menor que `price`. En el panel, el campo solo aparece cuando el destacado es "Descuento". |
| `badgeExpiresAt` | Opcional. Pasada esa fecha el destacado deja de mostrarse y el precio vuelve al normal. |
| `tags` | Lista sin repetidos de `sin_tacc`, `vegetariano`, `vegano`, `sin_lactosa`, `picante`, `frutos_secos`, `con_alcohol`, `para_compartir`. |
| `images` | Lista de URLs; el orden de la lista es el orden en que se muestran. |

La búsqueda (`GET /api/products?search=`) toma el texto literal: `%` y `_` no funcionan como comodines.

## Categorías

`name` es obligatorio (se recortan los espacios) y único. No se puede borrar una categoría que tiene productos.

## Usuarios del panel

| Campo | Regla |
| --- | --- |
| `firstName`, `lastName`, `email`, `password` | Obligatorios al crear. |
| `email` | Formato válido y único. |
| `username` | Opcional, único, de 3 a 30 caracteres: minúsculas, números, punto o guion bajo. |
| `password` | Mínimo 6 caracteres, también al recuperarla. |
| `role` | `dueno`, `encargado` o `atencion`. Ver [roles.md](roles.md). |

El registro público (`POST /api/auth/registration`) solo funciona mientras no exista ningún administrador.

## Límites de pedidos

| Ruta | Límite por IP |
| --- | --- |
| `POST /api/auth/login`, `/registration`, `/recover-password`, `/reset-password` | 10 cada 15 minutos (contados juntos). |
| `POST /api/contact-messages` | 5 cada 10 minutos. |

El contador vive en la memoria del proceso: se reinicia al reiniciar el servidor y no se comparte entre varias instancias. Si la API corre detrás de un proxy, poner `TRUST_PROXY=true` para que se use la IP real del cliente.
