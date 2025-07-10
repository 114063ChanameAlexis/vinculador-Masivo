export interface TiendanubeProducto {
    id: number;
    name: {
        es: string;
        [key: string]: string;
    };
    sku?: string; // <- SKU a nivel de producto (opcional)
    variants?: {
        id: string;
        sku: string;
    }[];
}