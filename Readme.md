# Product Requirements Document (PRD)
## Sistema de Gestión y Venta de Libros en Línea

---

## 1. Información General

**Versión del Documento:** 1.0  
**Fecha:** 06 de Febrero, 2026  
**Producto:** Sistema de Gestión y Venta de Libros en Línea  
**Propósito:** Definir los requerimientos funcionales y no funcionales para el desarrollo de una plataforma integral de venta y gestión de libros con tiendas físicas y virtuales.

---

## 2. Objetivos del Producto

- Proporcionar una plataforma completa para la compra y reserva de libros en línea
- Gestionar eficientemente el inventario de libros en múltiples ubicaciones
- Ofrecer una experiencia de usuario personalizada con recomendaciones y sistema de noticias
- Integrar canales de venta físicos y digitales
- Facilitar la administración centralizada del catálogo de libros

---

## 3. Roles de Usuario

### 3.1 Root
- Usuario administrador principal creado por defecto en el sistema
- Acceso total a funcionalidades administrativas
- No participa en transacciones comerciales

### 3.2 Administrador
- Usuario con permisos para gestión de inventario y catálogo
- Creado por usuario Root
- No participa en transacciones comerciales

### 3.3 Cliente
- Usuario registrado con capacidad de compra y reserva
- Acceso a funcionalidades de personalización y seguimiento
- Gestión de perfil y preferencias

### 3.4 Visitante
- Usuario no registrado con acceso limitado
- Capacidad de búsqueda sin transacciones

---

## 4. Requerimientos Funcionales

### 4.1 Módulo de Administración de Libros

#### RF-001: Ingresar Nuevo Libro
**Descripción:** El sistema debe permitir agregar un nuevo libro al catálogo.  
**Criterios de Aceptación:**
- El sistema debe validar que todos los campos obligatorios estén completos antes de guardar
- Los campos obligatorios son: título, autor, año de publicación, género, número de páginas, editorial, ISSN, idioma, fecha de publicación, estado (nuevo/usado), precio
- El sistema debe mostrar mensaje de confirmación al guardar exitosamente
- El libro agregado debe aparecer automáticamente en el submódulo de noticias
- Tiempo de respuesta: < 3 segundos

**Medición:** Número de libros agregados exitosamente vs. intentos fallidos por validación

#### RF-002: Agregar Ejemplar al Inventario
**Descripción:** El sistema debe permitir incrementar la cantidad de ejemplares disponibles de un libro existente.  
**Criterios de Aceptación:**
- El sistema debe asociar el ejemplar a un libro existente
- El sistema debe actualizar el contador de inventario en tiempo real
- El ejemplar debe asignarse a una ubicación física (tienda) específica
- Tiempo de respuesta: < 2 segundos

**Medición:** Exactitud del contador de inventario (100% precisión)

#### RF-003: Eliminar Ejemplar del Inventario
**Descripción:** El sistema debe permitir reducir la cantidad de ejemplares disponibles.  
**Criterios de Aceptación:**
- El sistema debe validar que existan ejemplares disponibles antes de eliminar
- El sistema debe impedir la eliminación si existen reservas activas del ejemplar
- El sistema debe registrar un log de la eliminación (auditoría)
- Tiempo de respuesta: < 2 segundos

**Medición:** Integridad de datos de inventario (0 inconsistencias)

#### RF-004: Editar Libro del Sistema
**Descripción:** El sistema debe permitir modificar la información de un libro existente.  
**Criterios de Aceptación:**
- El sistema debe validar los campos obligatorios al actualizar
- El sistema debe mantener un historial de cambios (auditoría)
- Los cambios deben reflejarse en todas las vistas del sistema
- Tiempo de respuesta: < 3 segundos

**Medición:** Número de ediciones exitosas vs. fallidas

#### RF-005: Eliminar Libro del Sistema
**Descripción:** El sistema debe permitir eliminar un libro del catálogo activo.  
**Criterios de Aceptación:**
- El sistema debe impedir la eliminación si existen ejemplares en inventario
- El sistema debe impedir la eliminación si existen reservas o compras activas
- El sistema debe solicitar confirmación antes de eliminar
- El sistema debe mantener registro de libros eliminados

**Medición:** 100% de validaciones exitosas antes de eliminación

#### RF-006: Categoría Histórico Agotado
**Descripción:** El sistema debe mover automáticamente los libros sin inventario a una categoría especial.  
**Criterios de Aceptación:**
- El sistema debe verificar el inventario cada vez que se venda o elimine un ejemplar
- Los libros con 0 ejemplares deben moverse automáticamente a "Histórico Agotado"
- Los libros en "Histórico Agotado" deben permanecer visibles pero no comprables
- Si se agrega inventario, el libro debe salir automáticamente de esta categoría

**Medición:** 100% de libros sin inventario en categoría correcta

#### RF-007: Publicación Automática en Noticias
**Descripción:** El sistema debe publicar automáticamente cada libro nuevo en el módulo de noticias.  
**Criterios de Aceptación:**
- La publicación debe ocurrir inmediatamente después de guardar el libro
- La noticia debe incluir: imagen, título, autor, precio, estado (nuevo/usado)
- Las noticias deben ordenarse por fecha de publicación (más recientes primero)

**Medición:** 100% de libros nuevos publicados automáticamente

---

### 4.2 Módulo de Compra y Reserva de Libros

#### RF-008: Realizar Búsqueda de Libros
**Descripción:** El sistema debe permitir buscar libros por múltiples criterios.  
**Criterios de Aceptación:**
- El sistema debe soportar búsqueda por: título, autor, año de publicación, género, número de páginas, editorial, ISSN, idioma, fecha de publicación, estado, precio
- El sistema debe permitir búsqueda por texto libre (busca en múltiples campos)
- Los resultados deben mostrarse en < 2 segundos
- El sistema debe mostrar disponibilidad de inventario en los resultados

**Medición:** Tiempo de respuesta promedio < 2 segundos, Precisión de resultados > 95%

#### RF-009: Reservar Libro
**Descripción:** El sistema debe permitir reservar libros disponibles con restricciones específicas.  
**Criterios de Aceptación:**
- El sistema debe validar que el cliente no tenga más de 5 libros diferentes reservados
- El sistema debe validar que no se reserven más de 3 ejemplares del mismo libro
- La reserva debe durar exactamente 24 horas desde su creación
- El sistema debe liberar automáticamente las reservas vencidas
- El sistema debe actualizar el inventario disponible al reservar

**Medición:** 
- 100% de reservas respetan límites establecidos
- 100% de reservas se liberan automáticamente a las 24 horas
- Tiempo de procesamiento < 2 segundos

#### RF-010: Comprar Libros
**Descripción:** El sistema debe permitir la compra de uno o múltiples libros.  
**Criterios de Aceptación:**
- El sistema debe validar disponibilidad de inventario antes de procesar
- El sistema debe integrar con el módulo de gestión financiera
- El sistema debe generar un número de orden único
- El sistema debe enviar confirmación por correo electrónico
- El sistema debe actualizar el inventario inmediatamente

**Medición:** 
- Tasa de éxito de transacciones > 99%
- Tiempo de procesamiento < 5 segundos

#### RF-011: Carrito de Compras
**Descripción:** El sistema debe proporcionar un carrito de compras persistente.  
**Criterios de Aceptación:**
- El carrito debe mantener los items mientras la sesión esté activa
- El sistema debe mostrar el total actualizado en tiempo real
- El sistema debe validar disponibilidad antes del checkout
- El carrito debe integrarse con el módulo de gestión financiera

**Medición:** Tasa de abandono de carrito, Tiempo de carga < 1 segundo

#### RF-012: Cancelar Compra
**Descripción:** El sistema debe permitir cancelar una compra antes del envío.  
**Criterios de Aceptación:**
- Solo se pueden cancelar compras en estado "EN PREPARACIÓN"
- El sistema debe reintegrar el inventario automáticamente
- El sistema debe procesar el reembolso a través del módulo financiero
- El sistema debe enviar confirmación de cancelación por correo

**Medición:** 100% de cancelaciones exitosas antes del envío

#### RF-013: Cancelar Reserva
**Descripción:** El sistema debe permitir cancelar una reserva activa.  
**Criterios de Aceptación:**
- El cliente debe poder cancelar su propia reserva en cualquier momento
- El sistema debe liberar el inventario inmediatamente
- El sistema debe actualizar el contador de reservas del cliente

**Medición:** Tiempo de liberación de inventario < 1 segundo

#### RF-014: Histórico de Compras
**Descripción:** El sistema debe mantener un registro completo de todas las transacciones del cliente.  
**Criterios de Aceptación:**
- El histórico debe mostrar: fecha, número de orden, items, total, estado
- El sistema debe permitir filtrar por: fecha, estado (completada/cancelada)
- El histórico debe ser accesible indefinidamente
- Tiempo de carga < 3 segundos

**Medición:** 100% de transacciones registradas, Disponibilidad 99.9%

#### RF-015: Proceso de Devolución
**Descripción:** El sistema debe gestionar devoluciones con causas específicas.  
**Criterios de Aceptación:**
- Solo se permiten devoluciones dentro de 8 días después de la entrega
- El sistema debe validar la fecha de entrega antes de permitir devolución
- Causas válidas: producto en mal estado, no llenó expectativas, retraso en entrega
- El sistema debe proporcionar un campo de texto para ampliar el motivo (opcional)
- El sistema debe generar un código QR único enviado al correo del cliente
- El código QR debe ser válido por 15 días

**Medición:** 
- 100% de devoluciones fuera de plazo rechazadas
- 100% de códigos QR generados y enviados correctamente

#### RF-016: Seguimiento de Envío
**Descripción:** El sistema debe permitir rastrear el estado de los pedidos.  
**Criterios de Aceptación:**
- Estados posibles: EN PREPARACIÓN, ENVIADO, ENTREGADO
- El cliente debe poder consultar el estado en tiempo real
- El sistema debe actualizar automáticamente el estado cuando cambie
- El sistema debe enviar notificaciones por correo en cada cambio de estado

**Medición:** 100% de pedidos con estado actualizado en tiempo real

#### RF-017: Opción de Recogida en Tienda
**Descripción:** El sistema debe permitir seleccionar recogida en tienda física para clientes en Colombia.  
**Criterios de Aceptación:**
- El sistema debe validar que la dirección del cliente esté en Colombia
- El sistema debe mostrar solo esta opción a clientes colombianos
- El cliente debe poder seleccionar la tienda de preferencia
- El sistema debe validar disponibilidad del producto en la tienda seleccionada

**Medición:** 100% de validaciones de ubicación exitosas

#### RF-018: Cálculo de Tienda Más Cercana
**Descripción:** El sistema debe calcular automáticamente la tienda más cercana cuando el producto no esté disponible.  
**Criterios de Aceptación:**
- El sistema debe verificar inventario en la tienda seleccionada
- Si no hay disponibilidad, debe calcular la tienda más cercana con inventario
- El sistema debe mostrar: distancia, tiempo estimado, disponibilidad
- El cliente debe poder elegir entre esperar envío o recoger en otra tienda

**Medición:** Precisión de cálculo de distancia > 98%

#### RF-019: Mapa de Tiendas Físicas
**Descripción:** El sistema debe mostrar la ubicación de tiendas físicas en un mapa para clientes en Pereira.  
**Criterios de Aceptación:**
- El sistema debe integrar Google Maps API
- El mapa debe mostrar todas las tiendas en Pereira
- Cada marcador debe incluir: nombre, dirección, horario, teléfono
- El mapa debe permitir navegación y zoom
- Tiempo de carga del mapa < 3 segundos

**Medición:** Disponibilidad del servicio > 99%, Tiempo de carga < 3 segundos

---

### 4.3 Módulo de Usuarios

#### RF-020: Registro de Cliente
**Descripción:** El sistema debe permitir el registro de nuevos clientes.  
**Criterios de Aceptación:**
- Campos obligatorios: DNI, nombres, apellidos, fecha de nacimiento, lugar de nacimiento, dirección de envío, género, correo electrónico, temas de preferencia, usuario, contraseña
- El sistema debe validar formato de correo electrónico
- El sistema debe validar unicidad de DNI y usuario
- El sistema debe validar fortaleza de contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
- El sistema debe enviar correo de confirmación

**Medición:** Tasa de registros exitosos vs. fallidos, Tiempo de procesamiento < 3 segundos

#### RF-021: Editar Perfil de Usuario
**Descripción:** El sistema debe permitir a los clientes actualizar su información.  
**Criterios de Aceptación:**
- El cliente debe poder editar todos los campos excepto DNI
- El sistema debe validar los campos modificados
- El sistema debe solicitar contraseña actual para cambios sensibles
- Los cambios deben guardarse inmediatamente

**Medición:** 100% de ediciones validadas correctamente

#### RF-022: Suscripción a Noticias
**Descripción:** El sistema debe permitir a los clientes suscribirse al sistema de noticias.  
**Criterios de Aceptación:**
- El cliente debe poder activar/desactivar la suscripción desde su perfil
- Los clientes suscritos deben recibir notificaciones de nuevos libros por correo
- El sistema debe respetar la preferencia del cliente (no enviar si no está suscrito)
- Frecuencia de envío: semanal (resumen de novedades)

**Medición:** Tasa de entrega de correos > 98%

#### RF-023: Selección de Preferencias Literarias
**Descripción:** El sistema debe permitir guardar preferencias de temas y autores.  
**Criterios de Aceptación:**
- El cliente debe poder seleccionar múltiples temas de preferencia
- El cliente debe poder seleccionar múltiples autores favoritos
- Las preferencias deben usarse para el módulo de recomendación
- El cliente debe poder modificar sus preferencias en cualquier momento

**Medición:** 100% de preferencias guardadas correctamente

#### RF-024: Felicitación de Cumpleaños
**Descripción:** El sistema debe enviar automáticamente una tarjeta y bono de descuento en el cumpleaños del cliente.  
**Criterios de Aceptación:**
- El sistema debe ejecutar un proceso diario que identifique cumpleaños
- El sistema debe enviar tarjeta de felicitación personalizada por correo
- El sistema debe generar un código de descuento único válido por 24 horas
- El descuento debe ser aplicable a cualquier compra ese día
- El correo debe enviarse a las 00:00 horas del día del cumpleaños

**Medición:** 100% de cumpleaños detectados y correos enviados

#### RF-025: Creación de Usuario Root
**Descripción:** El sistema debe crear automáticamente un usuario Root al inicializar.  
**Criterios de Aceptación:**
- El usuario Root debe crearse en la primera instalación del sistema
- Las credenciales iniciales deben ser configurables
- Solo puede existir un usuario Root en el sistema

**Medición:** 1 único usuario Root en el sistema

#### RF-026: Gestión de Administradores por Root
**Descripción:** El usuario Root debe poder crear y gestionar usuarios administradores.  
**Criterios de Aceptación:**
- Solo el usuario Root puede crear administradores
- El Root debe proporcionar: ID único y contraseña temporal
- El administrador debe completar su registro en el primer inicio de sesión
- El Root debe poder desactivar/activar administradores

**Medición:** 100% de administradores creados por Root

#### RF-027: Edición de Contraseña Root
**Descripción:** El usuario Root debe poder cambiar su propia contraseña.  
**Criterios de Aceptación:**
- El sistema debe solicitar la contraseña actual
- La nueva contraseña debe cumplir requisitos de seguridad
- El cambio debe registrarse en el log de auditoría

**Medición:** 100% de cambios auditados

#### RF-028: Restricción de Compra Root/Administrador
**Descripción:** Los usuarios Root y Administrador no deben poder realizar compras ni reservas.  
**Criterios de Aceptación:**
- El sistema debe ocultar las opciones de compra/reserva para estos roles
- El sistema debe bloquear cualquier intento de acceso directo a estas funciones
- Mensaje de error claro si se intenta acceder

**Medición:** 0 transacciones realizadas por Root/Administrador

#### RF-029: Registro Completo de Administrador
**Descripción:** El administrador debe completar su perfil en el primer inicio de sesión.  
**Criterios de Aceptación:**
- Campos obligatorios: DNI, nombres, apellidos, fecha de nacimiento, lugar de nacimiento, dirección, género, correo electrónico (sin temas de preferencia)
- El sistema debe forzar el completado antes de permitir acceso al sistema
- El administrador debe cambiar su contraseña temporal

**Medición:** 100% de administradores con perfiles completos

#### RF-030: Búsqueda para Visitantes
**Descripción:** Los visitantes deben poder buscar libros sin registrarse.  
**Criterios de Aceptación:**
- El visitante tiene acceso a la funcionalidad de búsqueda completa
- Los resultados deben mostrar disponibilidad pero no permitir compra/reserva
- El sistema debe mostrar llamado a acción para registrarse

**Medición:** Tasa de conversión de visitantes a clientes

---

### 4.4 Módulo de Noticias

#### RF-031: Suscripción a Noticias (Cliente)
**Descripción:** Los clientes deben poder gestionar su suscripción al sistema de noticias.  
**Criterios de Aceptación:**
- El cliente debe tener un switch on/off en su perfil
- El cambio debe aplicarse inmediatamente
- El sistema debe respetar la preferencia para envíos futuros

**Medición:** 100% de preferencias respetadas

#### RF-032: Catálogo de Nuevos Libros
**Descripción:** El sistema debe mostrar un catálogo dedicado a libros nuevos.  
**Criterios de Aceptación:**
- Solo deben aparecer libros con estado "nuevo"
- Los libros deben ordenarse por fecha de ingreso (más recientes primero)
- El catálogo debe actualizarse automáticamente al agregar libros
- Debe incluir imagen, título, autor, precio, disponibilidad

**Medición:** 100% de libros nuevos incluidos, Actualización en tiempo real

#### RF-033: Catálogo de Libros Usados
**Descripción:** El sistema debe mostrar un catálogo dedicado a libros usados.  
**Criterios de Aceptación:**
- Solo deben aparecer libros con estado "usado"
- Los libros deben ordenarse por fecha de ingreso (más recientes primero)
- El catálogo debe actualizarse automáticamente
- Debe incluir imagen, título, autor, precio, disponibilidad, condición

**Medición:** 100% de libros usados incluidos, Actualización en tiempo real

---

### 4.5 Módulo de Mensajería

#### RF-034: Chat con Administradores
**Descripción:** El sistema debe proporcionar mensajería instantánea entre clientes y administradores.  
**Criterios de Aceptación:**
- El cliente debe poder iniciar una conversación desde cualquier página
- El administrador debe recibir notificación de nuevos mensajes
- Los mensajes deben entregarse en tiempo real (< 2 segundos)
- El historial de conversaciones debe mantenerse por 90 días
- El sistema debe soportar mensajes de texto e imágenes

**Medición:** Tiempo de entrega de mensajes < 2 segundos, Disponibilidad > 99%

---

### 4.6 Módulo de Búsqueda

#### RF-035: Búsqueda Multicriteria
**Descripción:** El sistema debe permitir búsqueda avanzada por múltiples campos.  
**Criterios de Aceptación:**
- Criterios soportados: título, autor, año de publicación, género, número de páginas, editorial, ISSN, idioma, fecha de publicación, estado, precio
- El sistema debe permitir combinación de múltiples criterios (filtros)
- El sistema debe soportar rangos para campos numéricos (año, páginas, precio)
- Los resultados deben incluir información de disponibilidad
- Tiempo de respuesta < 2 segundos independientemente de la cantidad de filtros

**Medición:** Precisión de búsqueda > 95%, Tiempo de respuesta < 2 segundos

---

### 4.7 Módulo de Gestión Financiera

#### RF-036: Agregar Tarjeta de Pago
**Descripción:** El sistema debe permitir guardar información de tarjetas de crédito/débito.  
**Criterios de Aceptación:**
- El cliente puede agregar múltiples tarjetas
- Información requerida: número, nombre del titular, fecha de vencimiento, CVV
- El sistema debe validar el formato del número de tarjeta
- Los datos sensibles deben encriptarse inmediatamente
- El CVV no debe almacenarse (solo validar durante la transacción)
- El sistema debe mostrar solo los últimos 4 dígitos de la tarjeta

**Medición:** 100% de datos encriptados, 0 almacenamiento de CVV

#### RF-037: Editar Información de Tarjeta
**Descripción:** El sistema debe permitir actualizar datos de tarjetas guardadas.  
**Criterios de Aceptación:**
- El cliente puede actualizar: fecha de vencimiento, nombre del titular
- El número de tarjeta no debe ser editable (requiere agregar nueva tarjeta)
- El sistema debe solicitar contraseña para confirmar cambios

**Medición:** 100% de ediciones validadas con contraseña

#### RF-038: Eliminar Tarjeta
**Descripción:** El sistema debe permitir eliminar tarjetas guardadas.  
**Criterios de Aceptación:**
- El cliente debe confirmar la eliminación
- El sistema debe validar que no haya transacciones pendientes con esa tarjeta
- La eliminación debe ser permanente e irreversible

**Medición:** 100% de tarjetas con transacciones pendientes bloqueadas para eliminación

#### RF-039: Visualización de Saldo
**Descripción:** El sistema debe mostrar el saldo disponible del cliente.  
**Criterios de Aceptación:**
- El saldo debe actualizarse en tiempo real después de cada transacción
- El sistema debe mostrar: saldo actual, historial de movimientos
- Los movimientos deben incluir: fecha, concepto, monto, saldo resultante
- El cliente debe poder exportar el historial (PDF, CSV)

**Medición:** 100% de transacciones reflejadas en tiempo real, Precisión contable 100%

---

### 4.8 Módulo de Recomendación

#### RF-040: Bot de Recomendaciones
**Descripción:** El sistema debe implementar un asistente virtual que recomiende libros personalizados.  
**Criterios de Aceptación:**
- El bot debe analizar: preferencias del cliente, historial de compras, libros populares
- Las recomendaciones deben basarse en algoritmo de similitud
- El bot debe presentar mínimo 3 y máximo 10 recomendaciones
- Cada recomendación debe incluir: título, autor, razón de la recomendación
- El bot debe estar disponible solo para usuarios registrados
- El bot debe aprender de las interacciones (feedback positivo/negativo)

**Medición:** Tasa de clics en recomendaciones > 15%, Precisión de recomendaciones > 60%

---

### 4.9 Módulo de Realidad Aumentada

#### RF-041: Visualización AR de Libros
**Descripción:** El sistema debe permitir visualizar libros en realidad aumentada.  
**Criterios de Aceptación:**
- El cliente debe poder activar la vista AR desde la página del libro
- El sistema debe renderizar un modelo 3D del libro
- El modelo debe ser interactivo (rotar, acercar, alejar)
- La funcionalidad debe ser compatible con dispositivos móviles (iOS/Android)
- El sistema debe proporcionar instrucciones de uso

**Medición:** Tasa de uso de AR > 5%, Compatibilidad con dispositivos > 90%

#### RF-042: Visualización AR de Tiendas
**Descripción:** El sistema debe permitir visualizar tiendas físicas en realidad aumentada.  
**Criterios de Aceptación:**
- El cliente debe poder activar vista AR desde el mapa de tiendas
- El sistema debe mostrar la fachada y ubicación de la tienda
- La vista debe integrarse con la cámara del dispositivo
- Funcionalidad disponible para clientes en Pereira

**Medición:** Tasa de uso de AR para tiendas > 3%

---

### 4.10 Módulo de Integración con Google Maps

#### RF-043: Integración de Google Maps
**Descripción:** El sistema debe consumir la API de Google Maps para desarrolladores.  
**Criterios de Aceptación:**
- El sistema debe usar la versión gratuita de Google Maps API
- La integración debe mostrar: mapa interactivo, marcadores, rutas
- El sistema debe calcular distancias entre ubicaciones
- El sistema debe respetar los límites de uso gratuito de la API
- Tiempo de carga del mapa < 3 segundos

**Medición:** Disponibilidad del servicio > 99%, Cumplimiento de límites de API 100%

---

## 5. Requerimientos No Funcionales

### 5.1 Rendimiento

#### RNF-001: Tiempo de Respuesta del Sistema
**Descripción:** El sistema debe responder a las interacciones del usuario en tiempos óptimos.  
**Criterios de Aceptación:**
- Carga de páginas: < 3 segundos
- Transacciones: < 5 segundos
- Búsquedas: < 2 segundos
- Actualizaciones de interfaz: < 1 segundo
- Bajo condiciones de carga normal (hasta 1000 usuarios simultáneos)

**Medición:** Percentil 95 de tiempos de respuesta debe cumplir los límites establecidos

#### RNF-002: Capacidad de Procesamiento
**Descripción:** El sistema debe soportar múltiples usuarios concurrentes.  
**Criterios de Aceptación:**
- Mínimo 1000 usuarios simultáneos sin degradación de rendimiento
- Procesamiento de hasta 100 transacciones por minuto
- Escalabilidad horizontal para incrementar capacidad

**Medición:** Pruebas de carga exitosas con 1000+ usuarios

#### RNF-003: Disponibilidad
**Descripción:** El sistema debe estar disponible la mayor parte del tiempo.  
**Criterios de Aceptación:**
- Disponibilidad: 99.5% mensual (aproximadamente 3.6 horas de downtime permitido al mes)
- Mantenimientos programados: en horarios de baja demanda
- Tiempo de recuperación ante fallas: < 4 horas

**Medición:** Uptime mensual medido > 99.5%

---

### 5.2 Seguridad

#### RNF-004: Encriptación de Contraseñas
**Descripción:** El sistema debe implementar un esquema seguro de encriptación para contraseñas.  
**Criterios de Aceptación:**
- Uso de algoritmo bcrypt o Argon2 para hash de contraseñas
- Salt único por cada contraseña
- Factor de trabajo mínimo: 12 para bcrypt
- Las contraseñas nunca deben almacenarse en texto plano
- Las contraseñas no deben aparecer en logs

**Medición:** Auditoría de seguridad confirma cumplimiento 100%

#### RNF-005: Encriptación de Datos Sensibles
**Descripción:** El sistema debe proteger información financiera y personal.  
**Criterios de Aceptación:**
- Datos de tarjetas encriptados con AES-256
- Transmisión mediante HTTPS/TLS 1.3
- Cumplimiento con estándar PCI-DSS para datos de pago
- Datos personales encriptados en reposo

**Medición:** Certificación PCI-DSS obtenida, Auditoría de penetración sin vulnerabilidades críticas

#### RNF-006: Autenticación y Autorización
**Descripción:** El sistema debe implementar control de acceso robusto.  
**Criterios de Aceptación:**
- Autenticación basada en tokens (JWT) con expiración
- Validación de permisos por rol en cada operación
- Sesiones con timeout de inactividad (30 minutos)
- Bloqueo de cuenta después de 5 intentos fallidos
- Verificación de dos factores opcional para clientes

**Medición:** 0 accesos no autorizados en auditorías

#### RNF-007: Protección contra Ataques
**Descripción:** El sistema debe estar protegido contra vulnerabilidades comunes.  
**Criterios de Aceptación:**
- Protección contra: SQL Injection, XSS, CSRF, DDoS
- Validación de entrada en todos los campos
- Sanitización de salida de datos
- Rate limiting en APIs (100 requests/minuto por IP)
- WAF (Web Application Firewall) configurado

**Medición:** Pruebas de penetración sin vulnerabilidades de severidad alta o crítica

#### RNF-008: Auditoría y Logs
**Descripción:** El sistema debe mantener registros de actividades críticas.  
**Criterios de Aceptación:**
- Log de: autenticaciones, transacciones, cambios de datos sensibles
- Logs inmutables y centralizados
- Retención de logs: mínimo 1 año
- Protección de logs contra modificación
- Capacidad de rastrear acciones por usuario

**Medición:** 100% de operaciones críticas registradas

---

### 5.3 Usabilidad

#### RNF-009: Diseño Responsive
**Descripción:** El sistema debe adaptarse a diferentes dispositivos y tamaños de pantalla.  
**Criterios de Aceptación:**
- Soporte para: desktop (1920x1080), tablets (768x1024), móviles (375x667)
- Interfaz adaptable sin pérdida de funcionalidad
- Touch-friendly en dispositivos móviles
- Pruebas en navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versiones)

**Medición:** 100% de páginas funcionales en todos los dispositivos objetivo

#### RNF-010: Accesibilidad
**Descripción:** El sistema debe ser accesible para usuarios con discapacidades.  
**Criterios de Aceptación:**
- Cumplimiento con WCAG 2.1 nivel AA
- Navegación por teclado completa
- Textos alternativos en imágenes
- Contraste de colores adecuado (ratio mínimo 4.5:1)
- Compatibilidad con lectores de pantalla

**Medición:** Auditoría de accesibilidad con puntuación > 90/100

#### RNF-011: Internacionalización
**Descripción:** El sistema debe soportar múltiples idiomas y formatos regionales.  
**Criterios de Aceptación:**
- Idiomas soportados: Español (Colombia)
- Formato de fechas: DD/MM/YYYY
- Formato de moneda: COP (Peso colombiano)
- Preparado para agregar idiomas adicionales sin cambios en código

**Medición:** 100% de textos externalizados en archivos de idioma

---

### 5.4 Mantenibilidad

#### RNF-012: Código Mantenible
**Descripción:** El código debe seguir estándares de calidad para facilitar mantenimiento.  
**Criterios de Aceptación:**
- Documentación de código (comentarios en funciones complejas)
- Convenciones de nomenclatura consistentes
- Complejidad ciclomática < 10 por función
- Cobertura de pruebas unitarias > 80%
- Arquitectura modular con separación de responsabilidades

**Medición:** Análisis estático de código sin deuda técnica crítica

#### RNF-013: Versionamiento
**Descripción:** El sistema debe usar control de versiones.  
**Criterios de Aceptación:**
- Uso de Git como sistema de control de versiones
- Estrategia de branching definida (ej. GitFlow)
- Commits descriptivos y atómicos
- Tags para releases de producción

**Medición:** 100% del código en repositorio versionado

---

### 5.5 Escalabilidad

#### RNF-014: Arquitectura Escalable
**Descripción:** El sistema debe poder crecer sin rediseño completo.  
**Criterios de Aceptación:**
- Arquitectura de microservicios o modular
- Base de datos con capacidad de particionamiento
- Stateless application servers (para escalado horizontal)
- Caching implementado (Redis/Memcached) para datos frecuentes
- CDN para contenido estático

**Medición:** Capacidad de incrementar usuarios 10x mediante escalado horizontal

---

### 5.6 Compatibilidad

#### RNF-015: Compatibilidad de Navegadores
**Descripción:** El sistema debe funcionar en navegadores modernos.  
**Criterios de Aceptación:**
- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)
- Degradación elegante en navegadores no soportados

**Medición:** 100% de funcionalidades operativas en navegadores objetivo

#### RNF-016: Compatibilidad Móvil
**Descripción:** El sistema debe funcionar en dispositivos móviles.  
**Criterios de Aceptación:**
- iOS 14+
- Android 10+
- Progressive Web App (PWA) opcional
- Funcionalidad AR compatible con ARCore (Android) y ARKit (iOS)

**Medición:** Tasa de error en móviles < 1%

---

### 5.7 Recuperación ante Desastres

#### RNF-017: Respaldo de Datos
**Descripción:** El sistema debe mantener copias de seguridad de la información.  
**Criterios de Aceptación:**
- Backups automáticos diarios de base de datos
- Backups completos semanales
- Almacenamiento en ubicación geográfica diferente
- Retención de backups: 30 días
- Pruebas de restauración mensuales

**Medición:** 100% de backups exitosos, RTO < 4 horas, RPO < 24 horas

#### RNF-018: Plan de Continuidad
**Descripción:** El sistema debe tener un plan para recuperarse de fallas mayores.  
**Criterios de Aceptación:**
- Documentación de procedimientos de recuperación
- Ambiente de failover configurado
- Equipo designado para gestión de incidentes
- Procedimientos probados anualmente

**Medición:** Simulacros de recuperación exitosos anualmente

---

### 5.8 Cumplimiento Legal

#### RNF-019: Protección de Datos Personales
**Descripción:** El sistema debe cumplir con regulaciones de privacidad.  
**Criterios de Aceptación:**
- Cumplimiento con Ley 1581 de 2012 (Colombia - Habeas Data)
- Política de privacidad visible y aceptada por usuarios
- Derecho de acceso, rectificación y supresión de datos
- Consentimiento explícito para uso de datos
- Notificación de brechas de seguridad en < 72 horas

**Medición:** Auditoría legal confirma cumplimiento 100%

#### RNF-020: Términos y Condiciones
**Descripción:** El sistema debe tener términos de uso claros.  
**Criterios de Aceptación:**
- Términos y condiciones legalmente vinculantes
- Aceptación obligatoria antes de registro
- Actualizaciones notificadas a usuarios
- Definición clara de responsabilidades

**Medición:** 100% de usuarios registrados con aceptación documentada

---

### 5.9 Monitoreo y Observabilidad

#### RNF-021: Monitoreo de Sistema
**Descripción:** El sistema debe tener capacidades de monitoreo en tiempo real.  
**Criterios de Aceptación:**
- Métricas monitoreadas: CPU, memoria, disco, red
- Monitoreo de disponibilidad de servicios
- Alertas automáticas para umbrales críticos
- Dashboard centralizado de métricas
- Retención de métricas: 90 días

**Medición:** Tiempo de detección de incidentes < 5 minutos

#### RNF-022: Monitoreo de Negocio
**Descripción:** El sistema debe rastrear métricas de negocio importantes.  
**Criterios de Aceptación:**
- KPIs monitoreados: ventas diarias, tasa de conversión, abandono de carrito
- Reportes automáticos diarios/semanales/mensuales
- Visualización de tendencias
- Exportación de datos para análisis

**Medición:** 100% de transacciones registradas en analytics

---

### 5.10 Integración

#### RNF-023: APIs Documentadas
**Descripción:** El sistema debe exponer APIs bien documentadas para integraciones.  
**Criterios de Aceptación:**
- Documentación OpenAPI/Swagger
- Ejemplos de uso para cada endpoint
- Versionamiento de API (v1, v2, etc.)
- Rate limiting documentado
- Ambiente de sandbox para pruebas

**Medición:** 100% de endpoints documentados

---

## 6. Restricciones Técnicas

### 6.1 Tecnologías Recomendadas
- **Frontend:** React, Vue.js o Angular para interfaz responsive
- **Backend:** Node.js, Python (Django/Flask) o Java (Spring Boot)
- **Base de datos:** PostgreSQL o MySQL para datos relacionales
- **Caché:** Redis para sesiones y datos frecuentes
- **Mensajería:** WebSockets para chat en tiempo real
- **AR:** AR.js, A-Frame o Three.js para realidad aumentada web
- **Mapas:** Google Maps JavaScript API
- **Pagos:** Integración con pasarela de pagos certificada PCI-DSS

### 6.2 Limitaciones
- Google Maps API: Uso dentro de límites gratuitos o presupuesto asignado
- Realidad Aumentada: Limitada a navegadores/dispositivos compatibles
- Procesamiento de pagos: Depende de disponibilidad de proveedor tercero

---

## 7. Criterios de Éxito

### 7.1 Métricas de Producto
- **Adopción:** 1000 usuarios registrados en los primeros 3 meses
- **Conversión:** Tasa de conversión visitante → cliente > 5%
- **Retención:** 60% de clientes realizan compra recurrente en 6 meses
- **Satisfacción:** NPS (Net Promoter Score) > 50

### 7.2 Métricas Técnicas
- **Disponibilidad:** > 99.5% mensual
- **Rendimiento:** Percentil 95 de tiempo de carga < 3 segundos
- **Seguridad:** 0 vulnerabilidades críticas en producción
- **Calidad:** < 5 bugs críticos por release

---

## 8. Supuestos y Dependencias

### 8.1 Supuestos
- Los usuarios tienen acceso a dispositivos con navegadores modernos
- Los clientes en Colombia tienen acceso a internet estable
- Las tiendas físicas tienen capacidad para gestionar recogidas en tienda
- Existe un equipo de soporte para atender chat en horario laboral

### 8.2 Dependencias
- Disponibilidad de Google Maps API
- Servicio de correo electrónico (SMTP) confiable
- Pasarela de pagos operativa
- Compatibilidad de navegadores con WebAR

---

## 9. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Costos de Google Maps exceden presupuesto | Media | Alto | Implementar caching agresivo, optimizar llamadas |
| Compatibilidad AR limitada | Alta | Medio | Ofrecer vista 2D alternativa, documentar requisitos |
| Problemas de escalabilidad | Media | Alto | Arquitectura escalable desde inicio, pruebas de carga |
| Brechas de seguridad | Baja | Crítico | Auditorías regulares, cumplimiento PCI-DSS |
| Complejidad del bot de recomendaciones | Media | Medio | Implementación por fases, empezar con reglas simples |

---

## 10. Fases de Implementación (Sugeridas)

### Fase 1 - MVP (3-4 meses)
- Módulo de usuarios (registro, login, perfiles)
- Módulo de administración de libros (CRUD básico)
- Módulo de búsqueda
- Catálogo de libros
- Carrito de compras básico
- Gestión financiera (agregar tarjeta, compra simple)

### Fase 2 - Expansión (2-3 meses)
- Módulo de reservas
- Seguimiento de envíos
- Histórico de compras
- Devoluciones
- Módulo de noticias
- Sistema de cumpleaños

### Fase 3 - Integración (2-3 meses)
- Recogida en tienda
- Google Maps
- Cálculo de tienda más cercana
- Chat con administradores
- Bot de recomendaciones (versión básica)

### Fase 4 - Innovación (2-3 meses)
- Realidad Aumentada
- Mejora del bot de recomendaciones (ML)
- Optimizaciones de rendimiento
- Características avanzadas

---

## 11. Glosario

| Término | Definición |
|---------|------------|
| **DNI** | Documento Nacional de Identidad |
| **ISSN** | International Standard Serial Number (identificador de publicaciones) |
| **Root** | Usuario con máximos privilegios administrativos en el sistema |
| **Ejemplar** | Unidad física individual de un libro |
| **AR** | Realidad Aumentada (Augmented Reality) |
| **PCI-DSS** | Payment Card Industry Data Security Standard |
| **JWT** | JSON Web Token (mecanismo de autenticación) |
| **WCAG** | Web Content Accessibility Guidelines |
| **RTO** | Recovery Time Objective (tiempo objetivo de recuperación) |
| **RPO** | Recovery Point Objective (punto objetivo de recuperación) |
| **NPS** | Net Promoter Score (métrica de satisfacción) |

---

## 12. Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | | | |
| Arquitecto de Software | | | |
| Líder de Desarrollo | | | |
| Líder de QA | | | |
| Stakeholder de Negocio | | | |

---

**Fin del Documento**
