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

- **RF-AL-01**: Ingresar un nuevo libro al sistema con los campos obligatorios: título, autor(es), año de publicación, género(categoría), número de páginas, editorial, ISBN, idioma, fecha de publicación, estado (nuevo/usado) y precio. *un libro solo tiene un genero o son varios?* Módulo categorías
- **RF-AL-02**: Asignar un código único a cada ejemplar inventariado, permitiendo múltiples copias del mismo libro.
- **RF-AL-03**: Editar la información de libros existentes en el sistema (se propaga hacia sus copias).
- **RF-AL-04**: Eliminar ejemplares individuales del inventario.
- **RF-AL-05**: Administrar existencias y cantidades disponibles de cada libro por tienda física.
- **RF-AL-06**: Clasificar automáticamente los libros sin existencias en la categoría de "histórico agotado". *como deberia funcionar el historico agregado* 
- **RF-AL-07**: Publicar automáticamente los libros agregados al inventario en el submódulo de noticias (vitrina digital). **Si se hace cambio en el inventario el libro deberia subir en la vitrina?*
- **RF-AL-08**: Restringir el acceso al módulo de administración de libros exclusivamente a usuarios con rol administrador. 

### Gestión de Categorías
- **RF-AL-09**: Agregar nueva categoría
- **RF-AL-09**: Editar categoría
- **RF-AL-10**: Eliminar categoría
- **RF-AL-11**: Asignar categoría a libro
- **RF-AL-12**: Mostrar lista de categorías

### Gestión de Autores
- **RF-AL-09**: Agregar nuevo autor
- **RF-AL-09**: Editar autor
- **RF-AL-10**: Eliminar autor (Con cambio de estado a desconocido en todos los libros si el autor tenía libros asociados)
- **RF-AL-11**: Mostrar lista de autores.

---

## Módulo de Compra y Reserva de Libros

### Reserva de Libros

- **RF-CR-01**: Permitir a usuarios registrados reservar libros por un período máximo de 24 horas. 
- **RF-CR-02**: Limitar las reservas activas a un máximo de 5 libros diferentes por usuario.
- **RF-CR-03**: Limitar la reserva de un mismo libro a un máximo de 3 copias por usuario.
- **RF-CR-04**: Liberar automáticamente las reservas que no hayan sido confirmadas después de 24 horas.
- **RF-CR-05**: Permitir a los usuarios cancelar reservas en cualquier momento. *como funcionan las cancelaciones?* Se puede cancelar una reserva.

### Compra de Libros

- **RF-CR-06**: Proporcionar un carrito de compras integrado con el módulo de gestión financiera. 
- **RF-CR-07**: Permitir a usuarios registrados realizar compras mediante tarjeta de crédito/débito o saldo interno. *Facturación?*
- **RF-CR-08**: Permitir a los usuarios dividir el valor a pagar entre las tarjetas guardadas.
- **RF-CR-09**: Permitir la cancelación de compras según las políticas comerciales definidas. *como funcionan las cancelaciones?* las compras solo se pueden cancelar antes de pagar.
- **RF-CR-10**: Registrar y mostrar el historial de compras y cancelaciones del usuario.

### Devoluciones

- **RF-CR-11**: Permitir devoluciones bajo las causales de producto en mal estado, no cumplir expectativas o retraso en la entrega. *Cuáles son los parámetros de una devolución*
- **RF-CR-12**: Proporcionar un campo de texto para especificar el motivo de la devolución. 
- **RF-CR-13**: Limitar las devoluciones a un máximo de 8 días después de recibido el producto.
- **RF-CR-14**: Generar y enviar un código QR al correo del cliente para iniciar el proceso de devolución. *como funciona el QR* URL para acceder al estado que maneja el tercero.

### Envío y Entrega

- **RF-CR-15**: Usar la dirección de envío que el usuario tiene guardada, solo se puede tener una dirección.
- **RF-CR-16**: Administrar y mostrar el estado del envío: "En preparación", "Enviado" y "Entregado". *como cambian los estados de envio?* 
- **RF-CR-17**: Permitir a clientes en Colombia la opción de recoger compras en tienda física. *solo se permite si la direccion del cliente es en colombia?*  si
- **RF-CR-18**: Calcular y sugerir la tienda más cercana cuando un libro no esté disponible en la tienda seleccionada. 
- **RF-CR-19**: Mostrar en un mapa la localización de tiendas físicas para clientes en la ciudad de Pereira. *se muestran todas o en un radio de cercania? solo funciona en la ciudad de pereira o es un mapa segun la ciudad en la que este?* Se muestran todas las tiendas pero si se selecciono una tienda para recogida se muestra solo la seleccionada.
- **RF-CR-20**: Calcular tiempo estimado para entrega de paquete. *¿Cómo se calculan los tiempos de envío?*
- **RF-CR-21**: Cálcular tiempo estimado para recogida en tienda.
- **RF-CR-22**: Cálcular tiempo estimado para envío de una tienda a otra.

---

## Módulo de Usuarios

### Usuario Root

- **RF-US-01**: Crear un usuario root durante el despliegue inicial del sistema.
- **RF-US-02**: Permitir al usuario root crear usuarios administradores. *con que informacion inicial se crean los administradores* Correo, usuario, contraseña temporal. 
- **RF-US-03**: Permitir al usuario root eliminar usuarios administradores.
- **RF-US-04**: Permitir al usuario root modificar su contraseña. 
- **RF-US-05**: Restringir al usuario root la capacidad de comprar o reservar libros.

### Usuario Administrador

- **RF-US-06**: Permitir a los administradores completar su registro con datos personales y credenciales, con los datos: DNI, nombres, apellidos, fecha de nacimiento, lugar de nacimiento, dirección de correspondencia(envío), género, correo electrónico. *el registro de sus datos personales deben ser obligatorios?* sí, al primer inicio de sesión deben ser solicitados.
- **RF-US-07**: Conceder acceso al módulo de administración de libros. *se debe guardar trasabilidad de cambios hechos por administradores para auditoria?* Sí, debe haber un historial completo con los cambios hechos por administradores, como agregar nuevos libros, categorías, modificar inventario, etc.
- **RF-US-08**: Restringir a los administradores la capacidad de comprar o reservar libros. 

### Usuario Cliente

- **RF-US-09**: Registrar clientes con datos personales: DNI, nombres, apellidos, fecha de nacimiento, lugar
de nacimiento, dirección de correspondencia(envío), género, correo electrónico, credenciales: usuario y contraseña y preferencias literarias: *como se clasifican las preferencias literarias: Por tema(categoría) o autor*. 
- **RF-US-10**: Permitir a los clientes editar su información de perfil. *se puede editar toda la información, excepto el correo y el DNI*
- **RF-US-11**: Permitir a los clientes suscribirse al sistema de noticias mediante la selección de gustos literarios. *Se envía notificación al correo cuando se publica un nuevo libro en la categoría/autor de interés.*
- **RF-US-12**: Permitir a los clientes seleccionar libros de preferencia por tema o autor. *se puede editar en cualquier momento?*
- **RF-US-13**: Proporcionar a cada cliente un módulo de gestión financiera personal. 
- **RF-US-14**: Enviar automáticamente una tarjeta de cumpleaños y un bono de descuento válido por un día en la fecha de cumpleaños del cliente.

### Usuario Visitante

- **RF-US-14**: Permitir a usuarios visitantes realizar búsquedas en el catálogo de libros.

---

## Módulo de Noticias

- **RF-NO-01**: Permitir a los usuarios registrados suscribirse al sistema de noticias mediante la selección de gustos literarios (temas y/o autores).
- **RF-NO-02**: Enviar notificaciones automáticas a los usuarios suscritos cuando se agreguen nuevos libros o se reponga stock que coincida con sus gustos seleccionados.
- **RF-NO-03**: Las notificaciones podrán enviarse por correo electrónico.
- **RF-NO-04**: El submódulo de noticias funcionará como una vitrina digital, mostrando públicamente los nuevos libros agregados al inventario. Se actualiza cuando se agrega un nuevo libro.
- **RF-NO-05**: La publicación en la vitrina digital será automática al agregar libros al inventario.
- **RF-NO-06**: Los usuarios podrán modificar sus preferencias en cualquier momento. Un usuario sin preferencias no recibirá notificaciones de noticias. 

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

- **RF-RE-01**: Implementar un asistente que recomiende libros basándose en el historial de compras y búsquedas del usuario. El entrenamiento de este se basa en las compras, reservas y búsquedas del usuario. El asistente debe usar lenguaje natural.
- **RF-RE-02**: Consumir servicios de mapas para mostrar tiendas físicas en Pereira, siempre que el servicio sea gratuito.
- **RF-RE-03**: Implementar un módulo de realidad aumentada para visualizar libros o tiendas. Modelo 3d del libro, hojeable para ver la sinopsis.

---

## Inventario de Tiendas Físicas

- **RF-IT-01**: Mantener inventario independiente para cada tienda física.
- **RF-IT-02**: Sincronizar el inventario entre tiendas y el sistema central al procesar ventas o recogidas en tienda.
- **RF-IT-03**: Permite agregar tiendas dentro del sistema con los siguiente parametros: ID, nombre, dirección, horario, stock
- **RF-IT-04**: Permite la edicion y eliminacion de las tiendas existentes. Los libros que habían quedan en el inventario global (sin ID de tienda).


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