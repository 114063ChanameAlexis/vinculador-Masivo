export interface Publicacion {
    id: string;
    title: string;
    sku?: string; // <-- SKU a nivel producto, si NO tiene variantes
    variants?: {
        id: string;
        sku: string;
    }[]; // <-- solo si existen variantes reales
}