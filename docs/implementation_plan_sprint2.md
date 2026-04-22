# Plan de iteraciones — Módulo catálogo + inventario

## Contexto

Proyecto Next.js + Supabase. Patrón establecido:
- `lib/types/<entidad>.ts` → tipos derivados de `Database` (patrón `author.ts`/`category.ts`)
- `models/` → acceso puro a BD, sin lógica de negocio
- `services/` → lógica de negocio + validaciones, consume models
- `app/` → Server Actions + frontend RSC

---

## Decisiones arquitectónicas

### Tipos: un archivo por entidad, derivados de `Database`

Cada entidad tiene su propio archivo en `lib/types/`. Los tipos de fila (`Row`) y enums se derivan directamente de `Database["public"]["Tables"]` y `Database["public"]["Enums"]` respectivamente. **No** se redeclaran enums como `enum` TS salvo que se necesiten como valores en runtime.

### `auth.ts` no se refactoriza

`Genero`/`Rol` no son filas de `public.Tables` — son contratos de UI/Auth. La inconsistencia real está en `audit.ts` (`AuditoriaRow` hardcodeada), pero tiene baja prioridad y está fuera de scope.

### `histórico` = side-effect interno

`#188` (model) y `#189` (service) se implementan, pero el service es una utilidad interna — sin Server Actions propios. Lo llama `service libros+copias` (#175) al mutar disponibilidad.

### `precio` en bigint

Sin confirmar si son centavos. Confirmar semántica antes de implementar la capa de presentación.

---

## Grafo de dependencias

```
dirección✅  autor✅  categoria✅
     │                    │
  tienda(#171)      modelo_ra(#190)
     │                    │
     └──────┬─────────────┘
            │
         libro(#170)
FK: id_autor✅ id_categoria✅ id_modeloRA nullable
            │
   ┌───────┼────────┐
   │        │        │
copia(#176) noticia(#183) historico(#188)
   │        (id_libro    (side-effect
   │         nullable)    interno)
```

---

## ✅ Iteración 0 — Tipos por entidad (COMPLETADA)

Estandarización total de tipos en `lib/types/`. Todos los archivos siguen el patrón de `author.ts` (Row de Database, Payloads manuales, y tipos de respuesta explícitos).

| Archivo | Exports principales |
|---------|-------------------|
| [modelo_ra.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/modelo_ra.ts) | `ModeloRARow`, `InsertModeloRAPayload`, `ModeloRAListResponse`, `ModeloRAActionResponse` |
| [libro.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/libro.ts) | `LibroRow`, `CondicionLibro`, `InsertLibroPayload`, `LibrosListResponse`, `LibroActionResponse` |
| [copia.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/copia.ts) | `CopiaRow`, `EstadoCopia`, `InsertCopiaPayload`, `CopiasListResponse`, `CopiaActionResponse` |
| [historico.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/historico.ts) | `HistoricoRow`, `EstadoHistorico`, `InsertHistoricoPayload`, `HistoricoListResponse`, `HistoricoActionResponse` |
| [noticia.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/noticia.ts) | `NoticiaRow`, `InsertNoticiaPayload`, `NoticiasListResponse`, `NoticiaActionResponse` |
| [tienda.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/tienda.ts) | `TiendaRow`, `TiendaHorario`, `InsertTiendaPayload`, `TiendasListResponse`, `TiendaActionResponse` |
| [category.ts](file:///c:/Users/Juan/Documents/dev/Biblioteca-de-Alejandria/biblioteca-alejandria/lib/types/category.ts) | (Actualizado) `CategoryListResponse`, `CategoryActionResponse` |

---

## Iteración 1 — Modelos base sin dependencias pendientes

> Paralelas. Desbloquean todo lo demás.

| # | Issue | Tabla | Notas |
|---|-------|-------|-------|
| #190 | models `modelo_ra` | `modelo_ra` | `dimensiones: Json`, `texturas: Json`. Soft delete. CRUD básico. Patrón = `authorModel` |
| #171 | models `tienda` | `tienda` | FK → `dirección`✅. Usa `TiendaHorario` para tipar el campo `horario: Json`. Soft delete. |

---

## Iteración 2 — Primera capa desbloqueada

> #170 espera a #190. #191 y #177 pueden ir en paralelo con #170.

| # | Issue | Depende de | Notas |
|---|-------|-----------|-------|
| #170 | models `libro` | #190 | `id_modeloRA` nullable → libro puede existir sin AR. `estado` = `CondicionLibro`. Helper unicidad ISBN (patrón `checkAuthorExists`). |
| #191 | services `modelo_ra` | #190 | CRUD + validaciones. Patrón = `categoryService.ts` |
| #177 | services `tienda` | #171 | CRUD + validaciones de negocio. |

---

## Iteración 3 — Modelos dependientes de libro

> Paralelas entre sí. Todas esperan #170.

| # | Issue | Depende de | Notas |
|---|-------|-----------|-------|
| #176 | models `copia` | #170, #171 | `estado` = `EstadoCopia`. Soft delete. Helper conteo copias por libro (como `getAuthorBookCount`). |
| #183 | models `noticia` | #170 | `id_libro` nullable. `deleted_at` = `string | null` en tipos generados (consistente). |
| #188 | models `histórico` | #170 | Solo INSERT + SELECT. **Sin soft delete** (tabla de log). `estado` = `EstadoHistorico`. |

---

## Iteración 4 — Services

| # | Issue | Depende de | Notas |
|---|-------|-----------|-------|
| #189 | service `histórico` | #188 | **Utilidad interna.** Sin Server Actions. Exporta `logEstadoLibro(id_libro, estado)`. Consumer: #175. |
| #175 | service `libros + copias` | #170, #176, #189 | Service más crítico. (1) CRUD libro, (2) gestión copias por tienda. Llama `historicoService` al mutar disponibilidad. Validar unicidad ISBN. |
| #192 | services `noticia` | #183 | CRUD + toggle `es_visible`. Patrón = `categoryService.ts` |
| #181 | frontend gestionar tiendas | #177 | Services tienda listos desde iter 2. Panel admin. |

---

## Iteración 5 — Services de alto nivel + frontends de gestión

> Consumen services del catálogo completo.

| # | Issue | Depende de | Notas |
|---|-------|-----------|-------|
| #187 | service búsqueda catálogo + filtros | #175 | Filtros: título, autor, categoría, precio, `CondicionLibro`. Server-side. `ILIKE` + escapado. |
| #185 | services `homepage` | #175, #192 | Libros destacados + últimas noticias visibles. Datos para SSR. |
| #180 | frontend gestionar info bibliográfica | #175, #191 | Panel admin: CRUD libro + asignación modelo RA. |
| #182 | gestionar inventario | #175, #176 | Panel admin: copias por tienda, alta/baja/cambio estado. |
| #172 | vista inventario | #175, #176 | Vista de inventario (lectura). Puede ser pública o de cliente. |

---

## Iteración 6 — Frontends públicos

> Última capa. Consume todo lo anterior.

| # | Issue | Depende de | Notas |
|---|-------|-----------|-------|
| #186 | frontend búsqueda de catálogo | #187 | UI pública. RSC con `searchParams`. |
| #184 | frontend `homepage` | #185 | Landing page. Consume services homepage (SSR). |

---

## Resumen visual

```
Iter 0✅: [tipos: modelo_ra / libro / copia / historico / noticia / tienda]
              │
Iter 1:  [#190 modelo_ra model]  [#171 tienda model]
              │                        │
Iter 2:  [#170 libro model]  [#191 modelo_ra svc]  [#177 tienda svc]
              │
Iter 3:  [#176 copia model]  [#183 noticia model]  [#188 historico model]
              │
Iter 4:  [#189 historico svc*]  [#175 libros+copias svc]  [#192 noticia svc]  [#181 front tiendas]
              │
Iter 5:  [#187 búsqueda svc]  [#185 homepage svc]  [#180 front biblio]  [#182 inventario]  [#172 vista inv.]
              │
Iter 6:  [#186 front búsqueda]  [#184 front homepage]

* #189 = utilidad interna, no service público
```
