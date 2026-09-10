# **mi-vinculador-web**

**Vinculador de productos entre plataformas de e-commerce**  
Aplicación web que permite conectar, comparar y emparejar productos de distintas plataformas como **Tiendanube**, **Shopify**, **WooCommerce**, **VTEX**, **Mercadolibre**, **Prestashop**, y cruzarlos contra el catálogo propio de **Grow2on**.

Desarrollada con **Next.js**, **TypeScript** y **Material UI**, ofrece una experiencia moderna, clara y funcional para tareas de integración de productos.

---

## 🚀 Tecnologías utilizadas

- **Next.js** – Framework de React con soporte para SSR/SSG
- **TypeScript** – Tipado estático para mayor robustez
- **React** – Librería para construir interfaces de usuario
- **Material UI (MUI)** – Componentes visuales preconstruidos
- **Material React Table** – Tablas dinámicas y personalizables
- **PapaParse** – Importación y exportación de datos CSV
- **SheetJS (`xlsx`)** – Lectura de archivos Excel (instalada desde el CDN de SheetJS, no desde npm — ver sección de Seguridad)
- **FileSaver** – Descarga de archivos desde el navegador

---

## 🔁 ¿Cómo funciona la app?

La aplicación ofrece tres flujos de trabajo distintos:

### 1. 🔌 Flujo de Vinculación y Publicaciones (Shopify, Tiendanube, WooCommerce, Mercado Libre)

- El usuario selecciona el canal
- Se ingresan credenciales (tokens, URL de la tienda, etc.)
- El sistema valida el acceso y redirige a `/publicaciones`
- Se obtienen **todos** los productos de la cuenta (paginado interno por canal)
- Se listan productos y variantes con títulos y SKUs
- Mercado Libre trae solo publicaciones `active`/`paused` (scan + `scroll_id`, sin el tope de 1000 resultados del search normal)
- El usuario sube un CSV del ERP y `CSVComparador` cruza por SKU, generando **Coincidencias** y **Errores**, con export a CSV

👉 Ideal para gestionar y visualizar el inventario completo

---

### 2. 🔍 Flujo de Consulta por ID (VTEX, PrestaShop)

- El usuario selecciona uno de estos canales
- Se validan las credenciales
- El sistema redirige a `/consultas`
- El usuario carga un archivo CSV con una columna `id` (ID de producto)
- El sistema consulta cada ID en la API del canal y muestra los resultados

👉 Ideal para verificar publicaciones específicas

---

### 3. 📦 Catálogo Grow2on (`/grow2on-productos`)

- Pantalla independiente, accesible desde un botón en la home
- El usuario carga manualmente un **Token** y el **Service ID** (a futuro vendrán de otro endpoint/login)
- Trae el catálogo completo de `backend.grow2on.com/products/list` (paginado internamente)
- Permite subir un **CSV o XLSX** y elegir qué columna es el SKU, para filtrar el catálogo contra ese listado
- Botón **"Exportar CSV para vincular"**: genera un CSV en el formato exacto que espera `CSVComparador` (columnas `sku`, `id`, `articleId`), listo para subir en el flujo 1 y cruzar

👉 Ideal para armar el CSV del ERP a partir del propio catálogo de Grow2on, en vez de exportarlo a mano

---

## 🧠 Análisis técnico

### 📐 Uso del patrón Strategy + Factory

Se implementa el patrón de diseño **Strategy** para abstraer la lógica de obtención de productos según el canal de e-commerce seleccionado. Cada canal (Shopify, Tiendanube, MercadoLibre, etc.) tiene su propia estrategia que implementa una interfaz común, permitiendo que el código principal no dependa de implementaciones específicas.

Además, se aplica el patrón **Factory** para centralizar la creación de las estrategias. A través de una función `getStrategy(canal)`, se devuelve dinámicamente la estrategia correspondiente según el canal elegido por el usuario. Esto permite:

- Agregar nuevos canales fácilmente, sin modificar el flujo principal
- Reducir el acoplamiento y mejorar la extensibilidad del sistema
- Mantener un código limpio y abierto a futuras integraciones

Esta combinación de patrones mejora la escalabilidad y modularidad de la aplicación.


---

### 🗂️ Separación por responsabilidad

El código está organizado en carpetas según su función (componentes, servicios, estrategias, API, etc.), lo cual:

- Mejora la mantenibilidad
- Facilita la escalabilidad

---

### ✅ Buenas prácticas implementadas

- Validación dinámica de formularios según el canal
- Componentes reutilizables y modulares
- Persistencia temporal mediante `sessionStorage`
- Rutas API organizadas bajo la estructura de Next.js
- Tipado completo con TypeScript

---

## ✅ Hecho (ya no son "futuras")

- ✅ Obtener automáticamente todas las publicaciones desde MercadoLibre (`MercadoLibreStrategy.ts`, scan + bulk + filtro por status)
- ✅ Catálogo propio de Grow2on con filtro por CSV/XLSX y export listo para vincular (`/grow2on-productos`)
- ✅ Soporte de XLSX además de CSV en la carga de archivos

## 🛠 Recomendaciones y mejoras futuras

- 🔗 Integrar la llamada real a `createRelation` (hoy el flujo termina en exportar el CSV, no llama al endpoint)
- 🔐 Reemplazar el token manual de `/grow2on-productos` por el que traiga el endpoint de auth real
- 🔔 Reemplazar `alert(...)` por un sistema de notificaciones modernas (ej. `notistack`)
- ✅ Usar librerías como **React Hook Form** o **Zod** para validación de formularios
- ⚠️ Confirmar contra el backend real si `createRelation` espera el `productId` con o sin guiones y en qué longitud — ver nota en `grow2on-productos.tsx`

---

### 🔧 Vinculación directa con backend real

El export de `/grow2on-productos` ya arma un CSV compatible con `CSVComparador`, pero la llamada real a la API de Grow2on todavía no está integrada:

https://backend.grow2on.com/relations/product/createRelation?serviceId=<ID>

---

## 🔒 Seguridad

- **`xlsx`**: instalar siempre desde el CDN de SheetJS, no desde npm — la versión publicada en el registro de npm (`0.18.5`) tiene una vulnerabilidad **high** conocida (prototype pollution / ReDoS) sin parche en npm.
  ```bash
  npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
  ```
