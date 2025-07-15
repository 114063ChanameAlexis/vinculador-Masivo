export interface ShopifyProducto {
    id: number;
    title: string;
    variants: {
        id: number;
        sku: string;
    }[];
}
