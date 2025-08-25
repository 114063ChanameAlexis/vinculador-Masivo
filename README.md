# **mi-vinculador-web**

**Vinculador de productos entre plataformas de e-commerce**  
Aplicación web que permite conectar, comparar y emparejar productos de distintas plataformas como **Tiendanube**, **Shopify**, **WooCommerce**, **VTEX**, **Mercadolibre**, **Prestashop**.

Desarrollada con **Next.js**, **TypeScript** y **Material UI**, ofrece una experiencia moderna, clara y funcional para tareas de integración de productos.

---

## 🚀 Tecnologías utilizadas

- **Next.js** – Framework de React con soporte para SSR/SSG
- **TypeScript** – Tipado estático para mayor robustez
- **React** – Librería para construir interfaces de usuario
- **Material UI (MUI)** – Componentes visuales preconstruidos
- **Material React Table** – Tablas dinámicas y personalizables
- **PapaParse** – Importación y exportación de datos CSV
- **FileSaver** – Descarga de archivos desde el navegador

---

## 🔁 ¿Cómo funciona la app?

La aplicación ofrece tres flujos de trabajo distintos, según el canal de e-commerce seleccionado:

### 1. 🔌 Flujo de Vinculación y Publicaciones (Shopify, Tiendanube)

- El usuario selecciona el canal (Shopify o Tiendanube)
- Se ingresan credenciales como tokens o URL de la tienda
- El sistema valida el acceso y redirige a `/publicaciones`
- Se obtienen todos los productos de la cuenta
- Se listan productos y variantes con títulos y SKUs

👉 Ideal para gestionar y visualizar el inventario completo

---

### 2. 🔍 Flujo de Consulta por ID (WooCommerce, MercadoLibre, VTEX, PrestaShop)

- El usuario selecciona uno de estos canales
- Se validan las credenciales
- El sistema redirige a `/consultas`
- El usuario carga un archivo CSV con una columna `id` (ID de producto)
- El sistema consulta cada ID en la API del canal y muestra los resultados

👉 Ideal para verificar publicaciones específicas

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

## 🛠 Recomendaciones y mejoras futuras

- 🔄 Obtener automáticamente todas las publicaciones desde MercadoLibre (sin archivo CSV)
- 📂 Permitir al usuario elegir entre carga por archivo o consulta automática
- 🔗 Integrar soporte de vinculación real vía API de **Grow2on**
- 🔔 Reemplazar `alert(...)` por un sistema de notificaciones modernas (ej. `notistack`)
- ✅ Usar librerías como **React Hook Form** o **Zod** para validación de formularios

---

### 🔧 Vinculación directa con backend real

A futuro se planea agregar una opción de vinculación real mediante el backend de Grow2on. Esto permitirá vincular publicaciones directamente con la siguiente API:

https://backend.grow2on.com/relations/product/createRelation?serviceId=<ID>
