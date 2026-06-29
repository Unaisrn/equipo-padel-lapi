# Especificación técnica – App Gestión Equipo de Pádel (Liga LAPI)

## 1. Contexto y objetivo

App personal (un único usuario: el gestor/tesorero del equipo) para gestionar un equipo
de pádel amateur inscrito en la Liga LAPI. Sustituye hojas de cálculo / WhatsApp para
controlar jugadores, pagos, retiradas y estadísticas del equipo.

**Usuarios:** 1 (el propio gestor). No hay roles, no hay multi-tenant, no hay RLS complejo.
Auth simple solo para proteger el acceso (un único usuario autenticado).

**Fuera de alcance en v1:** integración con datos oficiales de la Liga LAPI (calendario,
resultados, clasificación). LAPI no tiene API pública — sus datos viven en la web y en la
app "Padel and Padel". Se documenta como v2 (ver sección 7), probablemente vía scraping,
sujeto a revisar términos de uso antes de automatizar.

**Fuera de alcance en v1:** cobro online. Los pagos se cobran en mano/Bizum fuera de la
app; la app solo registra el estado (pagado/pendiente) y mueve la caja del equipo.

## 2. Stack técnico

- **Frontend/Backend:** Next.js (App Router), igual que proyectos previos del usuario
- **Base de datos / Auth:** Supabase (Postgres)
- **Despliegue:** Vercel
- **Sin Stripe, sin Resend** en v1 (no hay cobros online ni notificaciones por email
  todavía; valorar Resend en v2 si se quiere avisar a jugadores de cuotas pendientes)

## 3. Modelo de datos

### `players` (jugadores)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| full_name | text | |
| phone | text | nullable |
| email | text | nullable |
| position | enum: `drive` / `reves` / `ambos` | nullable |
| level | text | nivel/categoría informal, libre |
| status | enum: `activo` / `baja` | default `activo` |
| joined_at | date | fecha de alta en el equipo |
| notes | text | nullable |
| created_at | timestamptz | |

### `player_fees` (cuotas asignadas a cada jugador)
Representa "lo que cada jugador debe pagar" (inscripción, cuota mensual, etc.) y su estado.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK → players | |
| concept | text | ej. "Inscripción liga 2026", "Cuota marzo" |
| amount | numeric | importe esperado |
| status | enum: `pendiente` / `pagado` | |
| paid_at | date | nullable, se rellena al marcar pagado |
| payment_method | enum: `efectivo` / `bizum` / `transferencia` / `otro` | nullable |
| due_date | date | nullable, fecha límite opcional |
| created_at | timestamptz | |

> Al marcar una `player_fee` como `pagado`, se crea automáticamente un movimiento de
> tipo `ingreso` en `team_transactions` (ver siguiente tabla), para que la caja del
> equipo se mantenga consistente sin doble entrada manual.

### `team_transactions` (caja del equipo)
Ingresos y gastos generales, no atados necesariamente a un jugador concreto.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| type | enum: `ingreso` / `gasto` | |
| concept | text | ej. "Pago cuota Juan", "Alquiler pista jornada 3", "Bote de bolas" |
| amount | numeric | siempre positivo; el signo lo da `type` |
| date | date | |
| related_player_id | uuid FK → players | nullable, solo si aplica |
| related_fee_id | uuid FK → player_fees | nullable, para trazabilidad si viene de una cuota |
| created_at | timestamptz | |

La vista de "Caja" muestra: saldo actual = Σingresos − Σgastos, y listado cronológico.

### `withdrawals` (retiradas / bajas)
Cubre dos casos: baja de un jugador del equipo, o baja puntual de un partido.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK → players | |
| scope | enum: `equipo` / `partido` | |
| match_id | uuid FK → matches | nullable, solo si scope = `partido` |
| reason | text | nullable |
| date | date | |
| created_at | timestamptz | |

> Si `scope = equipo`, al guardar se actualiza `players.status = 'baja'` automáticamente.

### `matches` (partidos / jornadas — registro manual en v1)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| date | date | |
| opponent | text | nombre del equipo rival |
| location | text | sede/club, nullable |
| home_away | enum: `local` / `visitante` | |
| result_summary | text | ej. "2-1" (partidos ganados del enfrentamiento) | 
| status | enum: `programado` / `jugado` / `aplazado` | default `programado` |
| notes | text | nullable |
| created_at | timestamptz | |

### `match_sets` (estadísticas por pareja dentro de un partido)
Cada enfrentamiento LAPI son 3 partidos (parejas 1, 2, 3). Esta tabla permite estadísticas
por jugador/pareja.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| match_id | uuid FK → matches | |
| pair_number | int | 1, 2 o 3 |
| player_ids | uuid[] | los 2 jugadores de la pareja (array o tabla puente, a decidir en implementación) |
| sets_won | int | |
| sets_lost | int | |
| won | boolean | si la pareja ganó su partido |

> Las estadísticas agregadas por jugador (partidos jugados, % victorias, con quién más
> ha jugado, etc.) se calculan a partir de `match_sets`, no se guardan como tabla aparte.

## 4. Pantallas / funcionalidades v1

1. **Login** simple (Supabase Auth, un único usuario, email+password)
2. **Dashboard**: saldo de caja actual, próximos partidos, cuotas pendientes destacadas
3. **Jugadores**: listado + alta/edición/baja, ficha individual con histórico de pagos y stats
4. **Cuotas (player_fees)**: crear cuota (individual o "para todo el equipo" en lote),
   marcar pagado/pendiente, filtrar por estado
5. **Caja del equipo**: listado de movimientos, alta manual de gasto/ingreso suelto,
   saldo total
6. **Retiradas**: registrar baja de equipo o de partido concreto, listado histórico
7. **Partidos**: alta de partido (rival, fecha, sede), registrar resultado y parejas tras
   jugarse, listado de calendario
8. **Estadísticas**: ranking de jugadores por partidos jugados / % victorias, ranking de
   parejas más usadas y su rendimiento

## 5. Decisiones de diseño relevantes

- Sin RLS multi-tenant: un único usuario autenticado, políticas RLS simples tipo
  "solo el usuario autenticado puede leer/escribir" (o incluso deshabilitado si se
  prefiere simplicidad máxima, ya que no hay datos de terceros expuestos).
- La relación cuota→caja (`player_fees` → `team_transactions`) debe hacerse con un
  trigger de Postgres o lógica de servidor, no solo en el cliente, para que sea
  consistente sin importar desde dónde se marque el pago.
- `match_sets.player_ids` como array de uuids es suficiente para v1 (no se prevé
  necesitar JOINs complejos todavía); si en el futuro se necesita filtrar "partidos de
  un jugador" con frecuencia, migrar a tabla puente `match_set_players`.

## 6. Fuera de alcance v1 (explícito)

- Integración con LAPI (calendario/resultados/clasificación oficiales)
- Cobro online (Stripe)
- Notificaciones automáticas (email/WhatsApp) de cuotas pendientes
- Multi-usuario / roles / invitaciones

## 7. v2 — Integración LAPI (a futuro, no implementar ahora)

- LAPI no expone API pública; los datos están en su web y en la app "Padel and Padel"
- Aproximación probable: scraping de la web pública de la liga (calendario, resultados,
  clasificación del grupo del equipo), revisando antes términos de uso del sitio
- Alternativa más robusta si cambia el HTML con frecuencia: introducción manual asistida
  (el usuario pega la URL de su grupo y se hace scraping puntual al cargar, no un cron
  permanente) para minimizar mantenimiento
- Esta sección es solo para tenerlo documentado; no generar código de scraping todavía
