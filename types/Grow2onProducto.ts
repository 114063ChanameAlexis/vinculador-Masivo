export interface Grow2onProducto {
    productId: string;
    fatherProductId: string;
    companyId: string;
    articleId: string;
    name: string;
    sku: string;
    categories: string;
    brand: string;
    shortDescription: string;
    vatRate: string;
    isActive: number;
    serviceInfo: {
        offer: number | null;
        price: number;
        stock: number;
        netPrice: number;
        updatedAt: string | null;
    };
}
