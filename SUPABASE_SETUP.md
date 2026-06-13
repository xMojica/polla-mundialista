# Supabase para la polla

## 1. Crear el proyecto

1. Entra a `https://supabase.com`
2. Crea una cuenta
3. Crea un proyecto nuevo
4. Copia estos datos:
   - `Project URL`
   - `anon public key`

## 2. Configurar la app

1. Duplica `.env.example` como `.env`
2. Llena:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
VITE_SUPABASE_POOL_ID=053020
VITE_ADMIN_ACCESS_CODE=tu-codigo-admin-local
```

3. Reinicia `npm run dev`

## 3. Crear la tabla

1. Abre el `SQL Editor` de Supabase
2. Ejecuta el contenido de [supabase-schema.sql](./supabase-schema.sql)

Nota:

- Si copiaste la URL desde el endpoint REST, por ejemplo `https://tu-proyecto.supabase.co/rest/v1/`, la app ahora la normaliza sola.
- El `POOL_ID` puede ser un texto simple como `053020`.

Si ya habias creado `pool_state` con `id uuid`, ejecuta esto antes:

```sql
drop table if exists public.pool_state;
```

Luego vuelve a ejecutar [supabase-schema.sql](./supabase-schema.sql).

## 4. Como administrar resultados

Tienes dos caminos:

1. Editar desde la app entrando con `VITE_ADMIN_ACCESS_CODE`
2. Editar el `payload` manualmente desde la tabla `pool_state` en Supabase

## 5. Importante sobre seguridad

La version actual usa una sola fila JSON para toda la polla. Eso es rapido para arrancar, pero tiene esta limitacion:

- Si permites escritura publica en Supabase, cualquier cliente tecnico podria modificar participantes o resultados.
- Si bloqueas escritura publica, solo tu podras editar desde Supabase o desde una capa backend protegida.

## 6. Recomendacion para seguridad real

Si quieres roles reales de `admin` y `usuario`, el siguiente paso recomendado es:

1. Separar `matches`, `participants` y `predictions` en tablas distintas
2. Usar `Supabase Auth`
3. Aplicar `RLS` para que:
   - `anon/authenticated` puedan leer
   - solo `admin` pueda actualizar `matches.actual_score`
   - solo usuarios autorizados puedan insertar participantes o predicciones

Si quieres, te puedo hacer esa segunda version con modelo relacional y roles reales.
