# PRD - Sistema de Gestión y Compra de Libros en Línea

## Requerimientos No Funcionales

- **RNF-01**: El sistema debe ser responsive y accesible desde navegadores web y dispositivos móviles.
- **RNF-02**: Las contraseñas de usuario deben almacenarse mediante un sistema seguro de encriptación.
- **RNF-03**: El sistema debe gestionar automáticamente la liberación de reservas después de 24 horas.
- **RNF-04**: El sistema debe enviar correos electrónicos automáticos (tarjetas de cumpleaños, códigos QR, bonos).

## Requerimientos Funcionales

### Módulo de Administración de Libros

#### Gestión de Libros
- **RF-AL-01**: Ingresar un nuevo libro al sistema con los campos obligatorios: título, autor, año de publicación, género, número de páginas, editorial, ISSN, idioma, fecha de publicación, estado (nuevo/usado), y precio.
- **RF-AL-02**: Asignar un código único a cada ejemplar inventariado, permitiendo múltiples copias del mismo libro.
- **RF-AL-03**: Editar la información de libros existentes en el sistema.
- **RF-AL-04**: Eliminar ejemplares individuales del inventario.
- **RF-AL-05**: Eliminar libros completos del sistema.
- **RF-AL-06**: Administrar existencias y cantidades disponibles de cada libro.
- **RF-AL-07**: Clasificar automáticamente los libros sin existencias en una categoría de "histórico agotado".
- **RF-AL-08**: Publicar automáticamente en el submódulo de noticias cada libro agregado al sistema (nuevo o usado).

#### Control de Acceso
- **RF-AL-09**: Restringir el acceso al módulo de administración de libros exclusivamente a usuarios con rol administrador.

---

### Módulo de Compra y Reserva de Libros

#### Reserva de Libros
- **RF-CR-01**: Permitir a usuarios registrados reservar libros con una duración máxima de 24 horas.
- **RF-CR-02**: Limitar las reservas activas a máximo 5 libros diferentes por usuario.
- **RF-CR-03**: Limitar la reserva del mismo ejemplar a máximo 3 copias por usuario.
- **RF-CR-04**: Liberar automáticamente las reservas después de 24 horas sin confirmar compra.
- **RF-CR-05**: Permitir a usuarios registrados cancelar reservas en cualquier momento.

#### Compra de Libros
- **RF-CR-06**: Proporcionar funcionalidad de carrito de compras integrado con el módulo de gestión financiera.
- **RF-CR-07**: Permitir a usuarios registrados realizar compras de libros mediante tarjeta de crédito/débito o saldo.
- **RF-CR-08**: Permitir a usuarios registrados cancelar compras en cualquier momento.
- **RF-CR-09**: Registrar y mostrar el histórico de compras realizadas y canceladas.

#### Devoluciones
- **RF-CR-10**: Permitir devoluciones de productos bajo las causales: producto en mal estado, no cumplió expectativas, o retraso en la entrega.
- **RF-CR-11**: Proporcionar un campo de texto ampliado para especificar el motivo de la devolución.
- **RF-CR-12**: Limitar las devoluciones a máximo 8 días después de recibido el producto.
- **RF-CR-13**: Generar y enviar un código QR (u otro código) al correo del cliente para iniciar el proceso de devolución.

#### Envío y Entrega
- **RF-CR-14**: Solicitar dirección de envío al cliente al confirmar la compra.
- **RF-CR-15**: Administrar y mostrar el estado del envío: "En preparación", "Enviado" y "Entregado".
- **RF-CR-16**: Permitir a clientes dentro de Colombia la opción de recoger compras en tienda física.
- **RF-CR-17**: Calcular y sugerir la tienda más cercana cuando el producto no esté disponible en la tienda seleccionada.
- **RF-CR-18**: Mostrar mediante un mapa la localización de tiendas físicas para clientes que compren en la ciudad de Pereira.

---

### Módulo de Usuarios

#### Usuario Root
- **RF-US-01**: Crear automáticamente un usuario root por defecto con ID y contraseña.
- **RF-US-02**: Permitir al usuario root crear usuarios administradores.
- **RF-US-03**: Permitir al usuario root editar su propia contraseña.
- **RF-US-04**: Restringir al usuario root la capacidad de comprar o reservar libros.

#### Usuario Administrador
- **RF-US-05**: Permitir a usuarios administradores completar su registro con: DNI, nombres, apellidos, fecha de nacimiento, lugar de nacimiento, dirección de correspondencia, género, correo electrónico, usuario y contraseña.
- **RF-US-06**: Conceder acceso al módulo de administración de libros a usuarios administradores.
- **RF-US-07**: Restringir a usuarios administradores la capacidad de comprar o reservar libros.

#### Usuario Cliente
- **RF-US-08**: Registrar clientes con los campos: DNI, nombres, apellidos, fecha de nacimiento, lugar de nacimiento, dirección de correspondencia, género, correo electrónico, temas literarios de preferencia, usuario y contraseña.
- **RF-US-09**: Permitir a clientes editar su información de perfil.
- **RF-US-10**: Permitir a clientes suscribirse al sistema de noticias.
- **RF-US-11**: Permitir a clientes seleccionar libros de preferencia por tema o autor.
- **RF-US-12**: Proporcionar a cada cliente acceso a un módulo de gestión financiera personal.
- **RF-US-13**: Generar y enviar automáticamente por correo una tarjeta de felicitación y un bono de descuento (válido por 1 día) en la fecha de cumpleaños del cliente.

#### Usuario Visitante
- **RF-US-14**: Permitir a usuarios visitantes (no registrados) realizar búsquedas de libros en el catálogo.

---

### Módulo de Noticias

- **RF-NO-01**: Permitir a usuarios registrados suscribirse al sistema de noticias.
- **RF-NO-02**: Mostrar catálogo de nuevos libros añadidos al sistema.
- **RF-NO-03**: Mostrar catálogo de libros usados añadidos al sistema.

---

### Módulo de Búsqueda

- **RF-BU-01**: Permitir búsquedas de libros por cualquier criterio: título, autor, año de publicación, género, número de páginas, editorial, ISSN, idioma, fecha de publicación, estado (nuevo/usado) y precio.

---

### Módulo de Gestión Financiera

- **RF-GF-01**: Permitir a usuarios agregar información de tarjetas de crédito y débito.
- **RF-GF-02**: Permitir a usuarios editar información de tarjetas registradas.
- **RF-GF-03**: Permitir a usuarios eliminar tarjetas del sistema.
- **RF-GF-04**: Mantener y mostrar el saldo disponible del usuario, actualizado según las compras realizadas.

---

### Módulo de Mensajería

- **RF-ME-01**: Proporcionar comunicación instantánea entre usuarios registrados y administradores.

---

### Módulo de Recomendación

- **RF-RE-01**: Implementar un bot/asistente que recomiende libros basándose en el historial de compras y búsquedas del usuario.
- **RF-RE-02**: Consumir servicios de Google Maps para mostrar tiendas físicas en Pereira (si es gratuito).
- **RF-RE-03**: Implementar un módulo con realidad aumentada para visualizar libros o tiendas.

---

### Inventario de Tiendas Físicas

- **RF-IT-01**: Mantener inventario independiente por cada tienda física.
- **RF-IT-02**: Sincronizar inventario entre tiendas y sistema central al procesar recogidas en tienda.

---

## Preguntas para Entrevista con Stakeholder

### Ambigüedades encontradas en el enunciado original:
- No queda claro si "eliminar un ejemplar" significa eliminar una copia específica o disminuir la cantidad
- La especificación del mapa de tiendas menciona "opcionalmente los clientes que hagan compras en esta ciudad" pero no es clara si aplica solo para recoger en tienda o para todas las compras en Pereira

### Módulo de Administración de Libros
1. ¿Cuál es la diferencia funcional entre "eliminar un ejemplar" y "eliminar un libro"? ¿El primero solo reduce cantidad mientras el segundo elimina completamente del sistema?
2. ¿Qué sucede si un administrador intenta eliminar un libro que tiene ejemplares reservados o en tránsito de entrega?
3. ¿Los libros en "histórico agotado" deben seguir siendo visibles para búsquedas o solo para reportes administrativos?

### Módulo de Compra y Reserva
4. ¿Las reservas consumen inventario real o solo "bloquean" temporalmente el ejemplar? ¿Qué pasa si se agotan las existencias mientras hay reservas activas?
5. Al cancelar una compra después de haber sido enviada, ¿el producto debe regresar al inventario de la tienda de origen o de la sede principal?

### Módulo de Usuarios
6. ¿El bono de descuento generado en cumpleaños es de un porcentaje fijo o variable? ¿Aplica para cualquier compra o tiene restricciones?
7. ¿Los administradores pueden ver información financiera (tarjetas, saldo) de los clientes para soporte o resolución de problemas?

### Módulo de Gestión Financiera
8. ¿El "saldo" mencionado funciona como un monedero electrónico recargable o solo refleja el saldo después de compras con tarjeta?
9. ¿Se permite pago mixto (parte con saldo, parte con tarjeta) en una misma compra?

### Aspectos Técnicos y Generales
10. ¿Qué nivel de detalle se espera en el módulo de realidad aumentada? ¿Visualización 3D del libro, vista previa de páginas, o ubicación virtual de tiendas?
11. Para el código QR de devoluciones, ¿debe integrarse con algún sistema específico en tienda física o es solo para validación en el sistema web?