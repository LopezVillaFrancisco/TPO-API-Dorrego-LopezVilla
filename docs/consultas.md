# Consultas de clientes

Cómo viaja una consulta desde el menú hasta que el comercio la responde.

## Recorrido

1. El cliente toca **Consultar** (el botón flotante en el celular o "Consultar por este plato" en la computadora).
2. Completa nombre, email, teléfono (opcional) y mensaje. Si está viendo un plato, el asunto se arma solo: `Consulta sobre: <plato>`. Sin plato, el asunto es `Consulta general`.
3. Nombre, email y teléfono quedan guardados en ese dispositivo (`localStorage`, clave `contact-data`) para la próxima consulta.
4. Si el comercio cargó un link de WhatsApp en sus datos, el formulario ofrece también escribir directo por WhatsApp con el plato ya mencionado.
5. La consulta llega a **Panel → Mensajes** como `pendiente`. El menú lateral y el título de la pestaña (`(2) Panel · …`) muestran cuántas hay sin leer; el panel vuelve a consultar cada 60 segundos mientras la pestaña está visible y al volver a ella, así que no hace falta recargar.
6. La pantalla **Hoy** del panel lista las consultas sin responder (pendientes y leídas) junto con el resto de lo que requiere acción.

## Estados

| Estado | Cuándo se asigna |
| --- | --- |
| `pendiente` | Al crearse. |
| `leido` | Automáticamente cuando alguien del equipo la abre en el panel, o a mano. |
| `respondido` | Automáticamente al tocar "Enviar por WhatsApp" o "Enviar por mail" en el panel, o a mano. |

Al pasar a `respondido` se guardan `repliedAt` (fecha) y `repliedBy` (nombre del administrador que la marcó). Si después vuelve a `pendiente` o `leido`, esos dos campos se limpian.

## Responder

El detalle de la consulta trae el texto `Hola <nombre>, ` listo y los botones de **respuestas rápidas**: textos guardados por el equipo (tabla `quick_replies`) que se insertan donde está el cursor. En el texto, `{nombre}` se reemplaza por el nombre del cliente. Se crean y editan desde el mismo detalle, en "Editar respuestas rápidas".

## Archivar y buscar

**Archivar** saca la consulta de la bandeja sin borrarla: deja de contar como pendiente y pasa a la vista **Archivadas**, desde donde puede volver a la bandeja. Eliminar sí la borra para siempre.

El buscador filtra por nombre, email, asunto o texto del mensaje, dentro de la vista que esté abierta.

## Nota interna

Cada consulta tiene además una **nota interna** (`internalNote`, hasta 2000 caracteres) que solo ve el equipo, por ejemplo "reservó para el sábado a las 21".

## API

`POST /api/contact-messages` (pública)

```json
{ "name": "Ana", "email": "ana@mail.com", "phone": "11 5555-0001", "subject": "Consulta sobre: Margherita", "message": "¿Es apta para celíacos?" }
```

- `subject` es opcional; si falta se guarda `Consulta general`.
- `website` es un campo trampa: el formulario lo deja oculto y vacío. Si llega completo, la API responde `201` pero no guarda nada.
- Límite: 5 consultas cada 10 minutos por IP. Al pasarlo responde `429` con el header `Retry-After`.

`GET /api/contact-messages` (con token) acepta `status`, `search` y `archived=true` (sin ese parámetro lista solo la bandeja).

`GET /api/contact-messages/summary` (con token) devuelve `{ pending, unanswered }` sin contar las archivadas.

`PATCH /api/contact-messages/:id` (con token) acepta `status`, `internalNote` y `archived` (`true`/`false`), solos o combinados:

```json
{ "status": "respondido", "internalNote": "Le pasé la carta sin TACC" }
```

Respuestas rápidas: `GET`, `POST /api/quick-replies` y `PATCH`, `DELETE /api/quick-replies/:id`, todas con token. Cada una tiene `title` (hasta 60 caracteres) y `text` (hasta 1000), con un máximo de 30.

Las reglas de cada campo están en [validaciones.md](validaciones.md).
