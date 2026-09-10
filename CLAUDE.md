# CLAUDE.md — mi-vinculador-web

Contexto y reglas específicas de este repo. Ver `README.md` para la descripción funcional completa.

## Arquitectura

- **Patrón Strategy + Factory** para canales de e-commerce: cada canal implementa `CanalStrategy.obtenerPublicaciones()` (`lib/estrategias/*Strategy.ts`), y `lib/estrategias/CanalFactory.ts` centraliza la creación (`getStrategy(canal)`). Agregar un canal nuevo = nueva strategy + un `case` en el factory, sin tocar el resto.
- **Proxy vía API routes de Next**: cada canal tiene su `pages/api/<canal>.ts` que reenvía credenciales al backend externo (evita CORS y mantiene tokens fuera del cliente). Mismo patrón para `pages/api/grow2on/productos.ts`.
- **Persistencia entre pantallas**: `sessionStorage` (`canal`, `formData`) — no hay backend propio de sesión.
- **Matching**: `components/CSVComparador.tsx` es lógica **compartida** por todos los canales que van al flujo de Publicaciones. No es específico de ningún canal.

## Reglas aprendidas (no repetir el error)

1. **No tocar `CSVComparador.tsx` (la lógica de matching) sin preguntar antes.** El usuario lo pidió explícitamente más de una vez. Es código compartido entre todos los canales — un cambio ahí impacta a todos.
2. **El fondo del `body` es una imagen** (`styles/globals.css`, `public/login-grow2on.svg` — textura magenta/naranja, antes era un `linear-gradient` plano). Botones MUI con `variant="outlined"` son casi invisibles ahí (borde/texto celeste por defecto sobre un fondo tan cargado). Usar siempre `variant="contained"` con color sólido (`#5d0cff` es el púrpura "de la casa", usado en botones primarios) fuera de una card blanca. `outlined` solo está bien dentro de una `Box` con `backgroundColor: '#fff'`.
3. **`xlsx` se instala desde el CDN de SheetJS, no desde npm.** La versión publicada en el registro npm (`0.18.5`) tiene una vulnerabilidad `high` sin parche ahí (SheetJS dejó de publicar fixes en npm).
   ```bash
   npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
   ```
4. **Formato del `id` que espera `CSVComparador` (columna del CSV subido, no el campo `id` de salida):** hace `match.id.slice(2).toUpperCase()` para obtener `productId`. Cualquier CSV que se arme para alimentar este flujo (ver `grow2on-productos.tsx`) debe:
   - Anteponer 2 caracteres de relleno al GUID real (se descartan con el `.slice(2)`).
   - Sacar los guiones del GUID antes de anteponer el relleno, para que quede en el mismo formato (32 hex, sin guiones, mayúsculas) que el campo `id` de la relación (`crypto.randomUUID().replace(/-/g, '')`).
   - **Sin confirmar todavía**: si el backend real de Grow2on (`createRelation`) acepta este `productId` así, o espera otro formato. No asumir sin probar contra el endpoint real.
5. **Mercado Libre — `search_type=scan` no soporta múltiples valores de `status` en la misma query** (se queda con el primero e ignora el resto). Para traer `active` + `paused` hay que hacer 2 scans separados y concatenar (`MercadoLibreStrategy.ts`).
6. **Mercado Libre — el SKU de variantes no siempre viene completo en el bulk** (`/items?ids=...`). Hay un fallback a `/items/{id}/variations/{variationId}` por variante cuando `SELLER_SKU` no está en los `attributes` del bulk. Mismo patrón en `api/mercadolibre.ts` (consulta puntual) y `MercadoLibreStrategy.ts` (listado masivo) — mantenerlos consistentes si se toca uno.
7. **Prioridad de SKU inconsistente a propósito, no es un bug:** `api/mercadolibre.ts` prioriza `seller_custom_field` sobre el atributo `SELLER_SKU`; `MercadoLibreStrategy.ts` usa solo `SELLER_SKU`. Así se dejó a pedido explícito del usuario — no unificar sin preguntar.

## Verificación

No hay tests automatizados. Después de cualquier cambio, correr:
```bash
npx tsc --noEmit
```
Para cambios visuales/UI, no hay forma de correr el dev server en este entorno — decirlo explícitamente en vez de asumir que "se ve bien".
