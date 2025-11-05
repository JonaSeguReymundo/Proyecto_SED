# API de Reservas de Autos

## Autenticación
- **POST /auth/register** → Crear usuario
- **POST /auth/login** → Iniciar sesión
- **GET /profile** → Ver perfil (token)

## Autos
- **GET /cars** → Listar autos (todos)
- **POST /cars** → Crear uno o varios autos *(admin/superadmin)*
- **PUT /cars/:id** → Actualizar auto *(creador/superadmin)*
- **DELETE /cars/:id** → Eliminar auto *(creador/superadmin)*

## Reservas
- **POST /bookings** → Crear una o varias reservas
- **GET /bookings** → Ver mis reservas
- **GET /bookings/all** → Ver todas *(admin/superadmin)*
- **PUT /bookings/:id** → Modificar fechas *(dueño/admin/superadmin)*
- **DELETE /bookings/:id** → Cancelar reserva *(dueño/admin/superadmin)*

## Auditoría
- **GET /logs** → Ver historial de acciones *(admin/superadmin)*
