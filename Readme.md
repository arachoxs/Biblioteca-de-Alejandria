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

### Módulo de Administración de Libros

#### Gestión de Libros
- **RF-AL-01**: Registrar información bibliográfica: título, año de publicación, número de páginas, editorial, ISBN, idioma, fecha de publicación, estado (nuevo/usado) y precio.
- **RF-AL-02**: Vincular un autor registrado a un libro.
- **RF-AL-03**: Asignar una o más categorías (géneros) a un libro.
- **RF-AL-04**: Definir el estado físico del libro (Nuevo/Usado).
- **RF-AL-05**: Modificar los datos bibliográficos de un libro (los cambios se reflejan en todos sus ejemplares).
- **RF-AL-06**: Restringir la gestión del catálogo exclusivamente a usuarios con rol Administrador.
- **RF-AL-07**: Publicar automáticamente los nuevos libros agregados a la base de datos en el submódulo de noticias (vitrina digital).


#### Gestión de Categorías
- **RF-AL-08**: Registrar nuevas categorías de libros con nombre y descripción.
- **RF-AL-09**: Editar nombre y metadatos de categorías existentes.
- **RF-AL-10**: Eliminar categorías (solo si no tienen libros asociados o reasignando los existentes).
- **RF-AL-11**: Listar categorías disponibles con filtros de búsqueda.

#### Gestión de Autores
- **RF-AL-12**: Registrar autores con nombre y nacionalidad.
- **RF-AL-13**: Editar información de autores existentes.
- **RF-AL-14**: Eliminar autor del sistema.
- **RF-AL-15**: Reasignar automáticamente el campo autor a "Autor Desconocido" en los libros vinculados a un autor eliminado.
- **RF-AL-16**: Visualizar el listado completo de autores y los libros vinculados a cada uno.
---

### Módulo de Gestión de Inventario
- **RF-IN-01**: Registrar el ingreso de ejemplares al "Inventario General" (Bodega Central) sin asignación inmediata a una tienda física.
- **RF-IN-02**: Generar y asignar un código único (SKU/Barcode) a cada ejemplar físico ingresado al sistema.
- **RF-IN-03**: Realizar la asignación de ejemplares desde el Inventario General hacia una tienda física específica, descontando del global y sumando al local.
- **RF-IN-04**: Registrar el ingreso directo de ejemplares a una tienda física específica (saltando la bodega central si es necesario).
- **RF-IN-05**: Calcular el stock global del libro sumando las existencias en Inventario General y todas las tiendas físicas registradas.
- **RF-IN-06**: Gestionar el traslado de ejemplares entre tiendas físicas, actualizando el inventario de origen y destino de forma simultánea.
- **RF-IN-07**: Realizar ajustes manuales de stock (por pérdida, daño o error) en cualquier ubicación (Bodega o Tiendas) con su debida justificación.
- **RF-IN-08**: Cambiar automáticamente el estado del libro a "Histórico Agotado" únicamente cuando el stock global (Bodega + Tiendas) llegue a cero.
- **RF-IN-09**: Registrar en un histórico la fecha exacta del agotamiento, manteniendo esta etiqueta de trazabilidad visible en el reporte administrativo incluso después de reponer el stock.
- **RF-IN-10**: Dar de baja ejemplares individuales del sistema de forma definitiva.
- **RF-IN-11**: Listar ejemplares con sus respectivos datos por tienda específica o inventario global.
---

### Módulo de Compra y Reserva de Libros

#### Reserva de Libros
- **RF-CR-01**: Permitir a usuarios registrados realizar reservas de libros por un plazo máximo de 24 horas.
- **RF-CR-02**: Validar que un usuario no exceda el límite de 5 libros diferentes en reservas activas.
- **RF-CR-03**: Validar que un usuario no exceda el límite de 3 copias de un mismo título por reserva.
- **RF-CR-04**: Ejecutar un proceso automático de liberación de stock para reservas no confirmadas tras cumplirse las 24 horas.
- **RF-CR-05**: Permitir al usuario cancelar manualmente sus reservas activas para liberar el stock de forma inmediata.

#### Proceso de Compra y Pago
- **RF-CR-06**: Gestionar un carrito de compras que agrupe libros y ejemplares seleccionados antes del pago.
- **RF-CR-07**: Procesar pagos mediante saldo de tarjetas de crédito/débito.
- **RF-CR-08**: Permitir el pago dividido utilizando múltiples tarjetas registradas por el usuario.
- **RF-CR-09**: Permitir la anulación (cancelación) de una orden de compra únicamente si el pago no ha sido procesado.
- **RF-AL-10**: Registrar y mostrar al usuario el historial detallado de compras realizadas y órdenes anuladas.

#### Gestión de Devoluciones (Integración con Terceros)
- **RF-CR-11**: Habilitar el formulario de solicitud de devolución bajo las causales: mal estado, no cumple expectativas o retraso.
- **RF-CR-12**: Obligar al ingreso de un motivo de devolución mediante un campo de texto detallado.
- **RF-CR-13**: Validar que la solicitud de devolución se realice dentro del límite de 8 días naturales tras la recepción.
- **RF-CR-14**: Generar y enviar al correo del cliente un código QR que contenga la URL de gestión del proveedor logístico tercero.

#### Envío y Logística
- **RF-CR-15**: Vincular la orden de compra a la dirección única de envío registrada en el perfil del usuario.
- **RF-CR-16**: Sincronizar y mostrar el estado del envío ("En preparación", "Enviado", "Entregado") basado en la información del proveedor logístico.
- **RF-CR-17**: Habilitar la opción de "Recogida en tienda" exclusivamente para usuarios cuya dirección registrada sea en Colombia.
- **RF-CR-18**: Calcular automáticamente la distancia entre la ubicación del cliente y las sedes físicas para identificar la más cercana.
- **RF-CR-19**: Validar la existencia de stock del producto seleccionado en las sedes físicas antes de emitir una sugerencia.
- **RF-CR-20**: Sugerir automáticamente al usuario la tienda más cercana que cuente con stock disponible para recogida inmediata.
- **RF-CR-21**: Ofrecer la opción de enviar el libro a la tienda más cercana al cliente en caso de que no haya stock disponible en dicha sede, pero sí en otra sucursal.
- **RF-CR-22**: Visualizar en el mapa exclusivamente la ubicación de la tienda seleccionada una vez el usuario confirme la "Recogida en tienda".apa exclusivamente la ubicación de la tienda seleccionada una vez el usuario confirme la "Recogida en tienda".

#### Cálculos de Tiempo
- **RF-CR-23**: Calcular el tiempo estimado de entrega a domicilio basado en la ubicación del cliente y el proveedor logístico.
- **RF-CR-24**: Calcular el tiempo estimado para la disponibilidad de recogida en tienda (stock local).
- **RF-CR-25**: Calcular el tiempo estimado de traslado cuando el libro deba ser enviado desde una tienda distinta a la seleccionada por el usuario (traslado interno).

---

### Módulo de Usuarios

#### Gestión de Usuario Root (SuperAdmin)
- **RF-US-01**: Crear una cuenta de usuario Root única durante el despliegue inicial (Seed) del sistema.
- **RF-US-02**: Registrar usuarios con rol Administrador asignando credenciales temporales (usuario, correo y contraseña).
- **RF-US-03**: Inhabilitar o eliminar cuentas de usuarios Administradores.
- **RF-US-04**: Gestionar el cambio de contraseña del usuario Root.
- **RF-US-05**: Restringir el acceso a funciones de compra o reserva.


#### Gestión de Usuario Administrador
- **RF-US-06**: Solicitar obligatoriamente el registro de datos personales (DNI, Nombres, Apellidos, Fecha/Lugar de nacimiento, Dirección y Género) al primer inicio de sesión del Administrador.
- **RF-US-07**: Solicitar un cambio de contraseña desde el primer inicio de sesión del administrador.
- **RF-US-08**: Registrar de forma automática un historial de auditoría (logs) de todas las acciones realizadas por Administradores (altas, bajas y modificaciones en libros, stock o categorías).
- **RF-US-09**: Permitir acceso completo al modulo de administracion del libros.
- **RF-US-10**: Restringir a los administradores la capacidad de comprar o reservar libros. 

#### Usuario Cliente
- **RF-US-11**: Registrar nuevos clientes capturando datos personales: DNI, nombres, apellidos, fecha de nacimiento, lugar
de nacimiento, dirección de correspondencia(envío), género, correo electrónico, credenciales: usuario y contraseña y preferencias literarias iniciales.
- **RF-US-12**: Permitir al cliente editar su información de perfil, bloqueando la modificación de los campos DNI y Correo Electrónico.
- **RF-US-13**: Permitir al cliente gestionar sus preferencias literarias (Autores y Categorías de interés) en cualquier momento desde su perfil.
- **RF-US-14**: Proporcionar al cliente un panel de gestión financiera para visualizar saldo interno y métodos de pago guardados.

#### Marketing y Automatizaciones
- **RF-US-15**: Ofrecer al cliente la opción de suscribirse de manera voluntaria al sistema de noticias y novedades.
- **RF-US-16**: Enviar notificaciones automáticas al correo del cliente únicamente si la suscripción está activa y el nuevo libro coincide con sus preferencias de autor o categoría.
- **RF-US-17**: Detectar la fecha de cumpleaños del cliente para enviar de forma automática una tarjeta de felicitación digital al correo.
- **RF-US-18**: Generar y enviar un bono de descuento único vinculado al cumpleaños del cliente, con una validez estricta de 24 horas y unicamente la primera compra del dia.


#### Usuario Visitante

- **RF-US-19**: Permitir a usuarios no autenticados (visitantes) realizar búsquedas y consultas en el catálogo de libros y categorías.
---

### Módulo de Noticias

#### Sistema de Notificaciones Personalizadas
- **RF-NO-01**: Validar la suscripción activa y las preferencias literarias del usuario antes de generar cualquier comunicación.
- **RF-NO-02**: Detectar automáticamente la incorporación de nuevos títulos al catálogo que coincidan con los autores o categorías de interés del usuario.
- **RF-NO-04**: Gestionar el envío de alertas informativas exclusivamente a través de correo electrónico para los eventos detectados de interés.
- **RF-NO-05**: Suspender el envío de notificaciones de forma inmediata si el usuario elimina sus preferencias.

#### Vitrina Digital (Pública)
- **RF-NO-06**: Desplegar una sección pública de "Novedades" que funcione como vitrina digital para todos los usuarios (visitantes y registrados).
- **RF-NO-07**: Publicar automáticamente en la vitrina digital todo libro cuyo registro en el sistema tenga una antigüedad menor o igual a 10 días calendario.
- **RF-NO-08**: Listar en la vitrina digital la información básica del libro: portada, título, autor, género y precio.
- **RF-NO-09**: Retirar automáticamente de la vitrina digital cualquier libro cuyo stock global llegue a cero, independientemente de su fecha de registro.
- **RF-NO-10**: Ejecutar un proceso de depuración diario para retirar de la vitrina los libros que superen los 10 días desde su fecha de registro inicial.
---

### Módulo de Búsqueda
- **RF-BU-01**: Permitir búsquedas de libros por título, autor, año de publicación, género, número de páginas, editorial, ISBN, idioma, fecha de publicación, estado y precio.
---

### Módulo de Gestión Financiera
- **RF-GF-01**: Permitir a los usuarios registrar tarjetas de crédito y débito.
- **RF-GF-02**: Validar información de una tarjeta antes de registrarla.
- **RF-GF-03**: Permitir eliminar tarjetas registradas en su cuenta.
- **RF-GF-04**: Permitir a los usuarios agregar saldo a las tarjetas registradas.
---

### Módulo de Mensajería
- **RF-ME-01**: Permitir al cliente iniciar hilos de conversación privados dirigidos al equipo de administración.
- **RF-ME-02**: Permitir a los usuarios administradores visualizar y responder a los hilos de conversación iniciados por los clientes.
- **RF-ME-03**: Restringir el acceso a cada hilo de conversación exclusivamente al cliente autor y a los usuarios con rol Administrador.
- **RF-ME-04**: Proporcionar una bandeja de entrada centralizada para los administradores.
- **RF-ME-05**: Permitir al administrador marcar una conversación como "Finalizada" o "Resuelta" para archivar el hilo.
---

### Módulo de Recomendación
- **RF-RE-01**: Recopilar y procesar el historial de compras, reservas y términos de búsqueda de cada usuario para alimentar el modelo de recomendaciones.
- **RF-RE-02**: Generar sugerencias personalizadas de libros basadas en las categorías y autores con mayor interacción en el historial del usuario.
- **RF-RE-03**: Implementar una interfaz de chat basada en lenguaje natural que permita al usuario solicitar recomendaciones mediante texto.
- **RF-RE-04**: Integrar servicios de mapas gratuitos (OpenStreetMap o similar) para visualizar la ubicación de las tiendas físicas en la ciudad de Pereira.
---

### Módulo de Realidad Aumentada (no definitivo)
- **RF-RA-01**: Generar automáticamente archivos de modelos 3D en formato estándar (.glb / .usdz) utilizando las imágenes de portada, lomo y contraportada del libro.
- **RF-RA-02**: Escalar automáticamente el prisma 3D basándose en las dimensiones físicas (alto, ancho, profundidad) registradas en la ficha técnica del libro.
- **RF-RA-03**: Proporcionar un visor 3D interactivo en la web para que el usuario pueda rotar y previsualizar el libro en 360 grados.
- **RF-RA-04**: Ejecutar la proyección de Realidad Aumentada en el entorno físico del usuario utilizando Scene Viewer (Android) o Quick Look (iOS). 
- **RF-RA-05**: Visualizar un modelo 3D simplificado de la fachada de la tienda física seleccionada sobre el mapa para facilitar su reconocimiento visual.
---

### Módulo de Gestión de Tiendas Físicas
- **RF-IT-01**: Registrar nuevas tiendas físicas en el sistema definiendo: ID único, nombre comercial, dirección exacta y horarios de atención.
- **RF-IT-02**: Editar la información de contacto, nombre o ubicación de las tiendas existentes.
- **RF-IT-03**: Inhabilitar o eliminar una tienda física del sistema.
- **RF-IT-04**: Reasignar automáticamente el inventario de una tienda eliminada hacia el "Inventario Global" o una "Bodega Central" para mantener la trazabilidad de los ejemplares.

# Entrevista

Un libro tiene varias categorías. En el módulo de administrador debe haber una opción para gestionar categorías. Cuando agrego un libro lo enlazo a mínimo una categoría.
Cuando un usuario se registra le piden unos datos obligatorios y otros opcionales para completar el perfil, uno de estos opcionales son las categorías a las que el usuario se quiere suscribir.
el asistente no debe ser un menú, debe ser implementado con un modelo de lenguaje natural, basado en las búsquedas e intereses del usuario.
Los nuevos libros agregados deben aparecer en la "sección de noticias", es decir, en la pantalla principal.
Para entrenar el modelo se usan las búsquedas, compras y reservas.
La sección de noticias y la vitrina digital son "lo mismo".
Cuando se acaban los ejemplares de un libro se agrega automáticamente a "histórico agotado". Se debe mantener la etiqueta histórico agotado con la fecha en la que estuvo agotado, incluso después de agregar nuevos ejemplares.
Se puede cancelar una reserva, solo se peude cancelar una compra antes de pagar.
Devoluciones las hace un tercero. Se tienen en cuenta los tres criterios de devolución: producto en mal estado, insatisfacción, tiempo de entrega. Se pierde el derecho a devolución pasados 8 días.
Para las devoluciones se debe saber cuándo fue entregado el producto.
La devolución debe tener un código legible tecnológicamente como un QR, no algo que se tenga que aprender el usuario.
Se usa una sola dirección por perfil.
Debe haber un módulo para crear tiendas. En Pereira puedo ver las tiendas de Pereira.
Los administradores se crean con nombre y correo, le llega al correo la invitación con una contraseña temporal, que lo obliga a cambiarla apenas ingrese.
Es obligatorio completar el perfil.
Debe haber trazabilidad de los cambios hechos por administradores en el sistema.
La información que no se puede editar para un usuario es el correo y el DNI, el resto sí.
Se puede editar preferencias directamente desde el perfil.
Si se elimina una tienda el stock se devuelve al stock general que "no se sabe dónde está".