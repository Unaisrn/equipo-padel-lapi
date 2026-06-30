# Backups de la base de datos

## Backup automático semanal (GitHub Actions)

Cada **domingo a las 04:00 UTC** se ejecuta automáticamente el workflow
`.github/workflows/backup.yml`, que hace un `pg_dump` completo de la base de datos y
lo sube como **artifact del run** con retención de **90 días**.

### Cómo descargar un backup

1. Ve a tu repo en GitHub → pestaña **Actions**
2. En el menú de la izquierda selecciona **"Weekly database backup"**
3. Haz clic en el run que quieras (el más reciente o uno concreto por fecha)
4. En la sección **Artifacts** al final de la página, descarga el archivo
   `backup-andalucistas-YYYY-MM-DD.sql`

### Lanzar el backup manualmente

En la misma pantalla del workflow hay un botón **"Run workflow"** (rama `master`).
Úsalo para probar que funciona o para generar un backup fuera del calendario semanal
(p. ej. antes de una migración importante).

### Si el backup falla

GitHub te avisará por email si el job falla. El job está configurado para fallar de
forma visible (no en silencio) si `pg_dump` devuelve un error.

---

## Frecuencia recomendada (manual)

El backup automático cubre la rutina semanal. Lanza uno **manual adicional** antes de
cualquier cambio de esquema (migraciones) para tener un punto de restauración exacto.

---

## Opción 1 – Dashboard de Supabase (más sencillo)

1. Entra en [supabase.com](https://supabase.com) → tu proyecto → **Database** (menú izquierdo)
2. Sección **Backups**
3. En el plan gratuito solo hay backups automáticos en planes Pro+. En Free tier, usa **"Database dump"** si está disponible, o la opción 2.

---

## Opción 2 – pg_dump con Supabase CLI (recomendado)

Requiere tener instalado [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# 1. Obtén la cadena de conexión desde:
#    Supabase Dashboard → Settings → Database → Connection string (URI)
#    Ejemplo: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# 2. Exporta la base de datos completa
pg_dump "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f "backup-$(date +%Y-%m-%d).sql"
```

El archivo resultante (`backup-2025-01-15.sql`, por ejemplo) es un script SQL que recrea todas las tablas y datos.

---

## Opción 3 – Exportar tabla a tabla desde el dashboard

Para backups puntuales de tablas concretas:

1. Supabase Dashboard → **Table Editor** → selecciona la tabla
2. Icono de descarga → **Export as CSV**

Útil para salvar datos de `players`, `player_fees` o `team_transactions` rápidamente sin herramientas externas.

---

## Restaurar un backup

```bash
psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  -f backup-2025-01-15.sql
```

> **Ojo**: la restauración sobreescribe los datos existentes. Úsala solo en caso de emergencia o en un proyecto de staging.
