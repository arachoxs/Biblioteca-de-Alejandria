# PRD - Sistema de Gestión y Compra de Libros en Línea

---

## Requerimientos No Funcionales

- **RNF-01**: El sistema debe ser responsive y accesible desde navegadores web y dispositivos móviles.
- **RNF-02**: Las contraseñas de los usuarios deben almacenarse utilizando funciones de hash seguras con sal (por ejemplo, bcrypt o Argon2), y toda la comunicación debe realizarse mediante protocolos seguros (TLS).
- **RNF-03**: El sistema debe gestionar automáticamente la liberación de reservas después de 24 horas.
- **RNF-04**: El sistema debe enviar correos electrónicos automáticos para notificaciones, tarjetas de cumpleaños, códigos QR y bonos, respetando las preferencias del usuario.
- **RNF-05**: El sistema debe cumplir con la normativa de protección de datos personales vigente en Colombia.
- **RNF-06**: El sistema debe garantizar disponibilidad, integridad y respaldo periódico de la información.

---

## Requerimientos Funcionales

---

## Módulo de Administración de Libros

### Gestión de Libros

- **RF-AL-01**: Ingresar un nuevo libro al sistema con los campos obligatorios: título, autor(es), año de publicación, género, número de páginas, editorial, ISBN, idioma, fecha de publicación, estado (nuevo/usado) y precio.
- **RF-AL-02**: Asignar un código único a cada ejemplar inventariado, permitiendo múltiples copias del mismo libro.
- **RF-AL-03**: Editar la información de libros existentes en el sistema (se propaga hacia sus copias).
- **RF-AL-04**: Eliminar ejemplares individuales del inventario.
- **RF-AL-05**: Eliminar libros completos del sistema según las políticas de retención definidas.
- **RF-AL-06**: Administrar existencias y cantidades disponibles de cada libro por tienda física.
- **RF-AL-07**: Clasificar automáticamente los libros sin existencias en la categoría de "histórico agotado".
- **RF-AL-08**: Publicar automáticamente los libros agregados al inventario en el submódulo de noticias (vitrina digital).
- **RF-AL-09**: Restringir el acceso al módulo de administración de libros exclusivamente a usuarios con rol administrador.

---

## Módulo de Compra y Reserva de Libros

### Reserva de Libros

- **RF-CR-01**: Permitir a usuarios registrados reservar libros por un período máximo de 24 horas.
- **RF-CR-02**: Limitar las reservas activas a un máximo de 5 libros diferentes por usuario.
- **RF-CR-03**: Limitar la reserva de un mismo libro a un máximo de 3 copias por usuario.
- **RF-CR-04**: Liberar automáticamente las reservas que no hayan sido confirmadas después de 24 horas.
- **RF-CR-05**: Permitir a los usuarios cancelar reservas en cualquier momento.

### Compra de Libros

- **RF-CR-06**: Proporcionar un carrito de compras integrado con el módulo de gestión financiera.
- **RF-CR-07**: Permitir a usuarios registrados realizar compras mediante tarjeta de crédito/débito o saldo interno.
- **RF-CR-07.1**: Permitir a los usuarios dividir el valor a pagar entre las tarjetas 
guardadas.
- **RF-CR-08**: Permitir la cancelación de compras según las políticas comerciales definidas.
- **RF-CR-09**: Registrar y mostrar el historial de compras y cancelaciones del usuario.

### Devoluciones

- **RF-CR-10**: Permitir devoluciones bajo las causales de producto en mal estado, no cumplir expectativas o retraso en la entrega.
- **RF-CR-11**: Proporcionar un campo de texto para especificar el motivo de la devolución.
- **RF-CR-12**: Limitar las devoluciones a un máximo de 8 días después de recibido el producto.
- **RF-CR-13**: Generar y enviar un código QR al correo del cliente para iniciar el proceso de devolución.

### Envío y Entrega

- **RF-CR-14**: Solicitar la dirección de envío al confirmar la compra.
- **RF-CR-15**: Administrar y mostrar el estado del envío: "En preparación", "Enviado" y "Entregado".
- **RF-CR-16**: Permitir a clientes en Colombia la opción de recoger compras en tienda física.
- **RF-CR-17**: Calcular y sugerir la tienda más cercana cuando un libro no esté disponible en la tienda seleccionada.
- **RF-CR-18**: Mostrar en un mapa la localización de tiendas físicas para clientes en la ciudad de Pereira.

---

## Módulo de Usuarios

### Usuario Root

- **RF-US-01**: Crear un usuario root durante el despliegue inicial del sistema.
- **RF-US-02**: Permitir al usuario root crear usuarios administradores.
- **RF-US-03**: Permitir al usuario root modificar su contraseña.
- **RF-US-04**: Restringir al usuario root la capacidad de comprar o reservar libros.

### Usuario Administrador

- **RF-US-05**: Permitir a los administradores completar su registro con datos personales y credenciales.
- **RF-US-06**: Conceder acceso al módulo de administración de libros.
- **RF-US-07**: Restringir a los administradores la capacidad de comprar o reservar libros.

### Usuario Cliente

- **RF-US-08**: Registrar clientes con datos personales, credenciales y preferencias literarias.
- **RF-US-09**: Permitir a los clientes editar su información de perfil.
- **RF-US-10**: Permitir a los clientes suscribirse al sistema de noticias mediante la selección de gustos literarios.
- **RF-US-11**: Permitir a los clientes seleccionar libros de preferencia por tema o autor.
- **RF-US-12**: Proporcionar a cada cliente un módulo de gestión financiera personal.
- **RF-US-13**: Enviar automáticamente una tarjeta de cumpleaños y un bono de descuento válido por un día en la fecha de cumpleaños del cliente.

### Usuario Visitante

- **RF-US-14**: Permitir a usuarios visitantes realizar búsquedas en el catálogo de libros.

---

## Módulo de Noticias

- **RF-NO-01**: Permitir a los usuarios registrados suscribirse al sistema de noticias mediante la selección de gustos literarios (temas y/o autores).
- **RF-NO-02**: Enviar notificaciones automáticas a los usuarios suscritos cuando se agreguen nuevos libros o se reponga stock que coincida con sus gustos seleccionados.
- **RF-NO-03**: Las notificaciones podrán enviarse por correo electrónico.
- **RF-NO-04**: El submódulo de noticias funcionará como una vitrina digital, mostrando públicamente los nuevos libros agregados al inventario.
- **RF-NO-05**: La publicación en la vitrina digital será automática al agregar libros al inventario.
- **RF-NO-06**: Los usuarios podrán modificar o cancelar su suscripción al sistema de noticias en cualquier momento.

---

## Módulo de Búsqueda

- **RF-BU-01**: Permitir búsquedas de libros por título, autor, año de publicación, género, número de páginas, editorial, ISBN, idioma, fecha de publicación, estado y precio.

---

## Módulo de Gestión Financiera

- **RF-GF-01**: Permitir a los usuarios registrar tarjetas de crédito y débito mediante pasarela de pago.
- **RF-GF-02**: Permitir editar información de tarjetas registradas.
- **RF-GF-03**: Permitir eliminar tarjetas del sistema.
- **RF-GF-04**: Mantener y mostrar el saldo disponible del usuario.

---

## Módulo de Mensajería

- **RF-ME-01**: Permitir comunicación entre clientes y administradores mediante un sistema tipo foro privado, visible únicamente para el cliente y los administradores.

---

## Módulo de Recomendación

- **RF-RE-01**: Implementar un asistente que recomiende libros basándose en el historial de compras y búsquedas del usuario.
- **RF-RE-02**: Consumir servicios de mapas para mostrar tiendas físicas en Pereira, siempre que el servicio sea gratuito.
- **RF-RE-03**: Implementar un módulo opcional de realidad aumentada para visualizar libros o tiendas.

---

## Inventario de Tiendas Físicas

- **RF-IT-01**: Mantener inventario independiente para cada tienda física.
- **RF-IT-02**: Sincronizar el inventario entre tiendas y el sistema central al procesar ventas o recogidas en tienda.
- **RF-IT-03**: Permite agregar tiendas dentro del sistema con los siguiente parametros:
- **RF-IT-04**: Permite la edicion y eliminacion de las tiendas existentes.


# Preguntas de Validación de Requisitos (No Técnicas)

## Sobre el Alcance General del Sistema

1. ¿Cuál es el objetivo principal del sistema: vender libros, gestionar inventario, o ambos con la misma prioridad?
2. ¿Qué funcionalidades considera indispensables para una primera versión del sistema?
3. ¿Existen funcionalidades que podrían postergarse para una segunda etapa sin afectar el valor del sistema?
4. ¿El sistema está pensado solo para una librería específica o para escalar a múltiples sucursales en el futuro?
5. ¿Quiénes serán los principales usuarios del sistema en el día a día?

---

## Sobre Libros e Inventario

6. ¿Desea diferenciar claramente entre libros nuevos y usados para los clientes?
7. ¿Qué debe ocurrir cuando un libro se queda sin stock: ocultarse, mostrarse como agotado o mantenerse visible?
9. ¿Es importante conservar el historial de libros que ya no se venden?
10. ¿Qué tan crítico es conocer en qué tienda física se encuentra cada ejemplar?
-. Eliminar libros completos del sistema según las políticas de retención definidas , cuales son las restricciones definidas.

---

## Sobre Reservas y Compras

12. ¿Qué espera que suceda si un cliente no confirma una compra tras hacer una reserva?
13. ¿Desea que los clientes puedan cancelar compras en cualquier momento o solo antes de cierto punto?
15. ¿Qué experiencia espera que tenga el cliente al comprar varios libros a la vez?

---

## Sobre Devoluciones

16. ¿Qué nivel de flexibilidad desea ofrecer a los clientes en el proceso de devoluciones?
17. ¿Las devoluciones deben generar siempre un reembolso o en algunos casos un cambio?
18. ¿Quién debería asumir los costos asociados a una devolución?
19. ¿Es necesario que el cliente explique siempre el motivo de la devolución?
20. ¿Desea llevar estadísticas o reportes sobre devoluciones?
- Como funciona el qr de devoluciones?

---

## Sobre Usuarios y Roles

22. ¿Los administradores deben tener cuentas completamente separadas de las de clientes? si
23. ¿Es importante poder identificar qué administrador realizó una acción específica?
24. ¿Desea que los clientes puedan eliminar su cuenta cuando lo deseen?
25. ¿Qué información personal considera indispensable solicitar al usuario?

---

## Sobre Noticias y Notificaciones

27. ¿Los clientes deben recibir notificaciones solo de libros que coincidan con sus gustos? si y solo si se suscriben


---

## Sobre Mensajería y Atención al Cliente

31. ¿Qué tipo de comunicación espera entre clientes y administradores?
32. ¿Es importante que varios administradores puedan responder a un mismo mensaje?
33. ¿Desea que las conversaciones queden registradas para futuras consultas?
34. ¿Qué tan rápida espera que sea la respuesta a un mensaje de un cliente?
35. ¿Este módulo reemplaza otros canales de atención o los complementa?

---

## Sobre Tiendas Físicas

36. ¿Las tiendas físicas tienen autonomía o dependen totalmente del sistema central?
37. ¿Qué sucede si un libro está disponible en otra tienda distinta a la elegida por el cliente?
38. ¿Desea incentivar la recogida en tienda frente al envío a domicilio?
39. ¿Qué información de las tiendas físicas debe ser visible para los clientes?
40. ¿Es importante mostrar la cercanía de una tienda al cliente?
- Que ocurre si se elimina una tienda y tiene libros en stock , se envian los libros a el inventario general?

---

## Sobre Expectativas del Proyecto

41. ¿Cómo sabremos que el sistema fue exitoso una vez esté en funcionamiento?
42. ¿Qué problema actual espera solucionar con este sistema?
43. ¿Qué es lo que más le preocupa de la implementación del proyecto?
44. ¿Qué experiencia ideal le gustaría que tenga un cliente al usar el sistema?
45. ¿Hay alguna restricción de tiempo o alcance que debamos tener presente desde el inicio?
