# Roles del panel

Cada usuario del panel tiene **un rol**. Los roles son escalonados: cada uno puede lo mismo que el siguiente y algo más. El Dueño elige y cambia el rol de cada persona desde **Panel → Equipo**.

| Rol | Para quién | Qué puede hacer |
| --- | --- | --- |
| **Dueño** (`dueno`) | Quien maneja el comercio | Todo: equipo (altas, bajas, roles), datos del comercio, carta y mensajes. |
| **Encargado** (`encargado`) | Quien maneja la operación diaria | Carta completa (productos, precios, promos, categorías), mensajes completos y respuestas rápidas. Ve el equipo y los datos del comercio sin editarlos. |
| **Atención** (`atencion`) | Mozo, cajero, quien contesta consultas | Responde mensajes (estado, notas, archivo; no elimina), usa las respuestas rápidas y marca platos agotados o disponibles. |

## Permisos por sección

| Sección | Dueño | Encargado | Atención |
| --- | --- | --- | --- |
| Hoy | Todo | Todo | Consultas y platos agotados |
| Productos | Editar | Editar | Solo disponible / agotado |
| Categorías | Editar | Editar | No la ve |
| Mensajes | Todo | Todo | Todo menos eliminar |
| Respuestas rápidas | Crear y editar | Crear y editar | Usar |
| Comercio | Editar | Ver | No la ve |
| Equipo | Editar y asignar roles | Ver | No la ve |
| Mi perfil | Sí | Sí | Sí |

Los permisos los aplica la API (`backend/auth/permissions.js`): el panel oculta lo que el rol no puede hacer, pero aunque alguien arme el pedido a mano, la API responde `403`. El rol se lee de la base en cada pedido, así que un cambio de rol o una baja tienen efecto en el momento, sin esperar a que venza la sesión.

## Reglas

- El primer usuario registrado es **Dueño**.
- Siempre queda al menos un Dueño: no se puede eliminar ni cambiar de rol al último.
- Nadie puede cambiar su propio rol; se lo tiene que cambiar otro Dueño.
- Un usuario nuevo creado desde Equipo arranca como **Atención** salvo que se elija otro rol.
- Desde **Mi perfil** cada uno edita sus datos, pero no su rol.

## Bases que ya tenían usuarios

Al arrancar, el backend agrega la columna `role` a `admin_users` si falta. Todos los usuarios existentes quedan como **Encargado** y el más antiguo pasa a **Dueño**. Después el Dueño ajusta los roles desde Equipo.

## API

`POST /api/admin-users` y `PATCH /api/admin-users/:id` aceptan `role` (`dueno`, `encargado` o `atencion`). Solo un Dueño puede usarlos. `GET /api/auth/profile` devuelve el `role` del usuario que inició sesión.
