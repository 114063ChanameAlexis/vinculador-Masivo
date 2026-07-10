import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { ShopifyCredenciales } from '../../types/Credenciales';

interface ShopifyVariante {
    id: number;
    sku: string;
    title: string;        // <- "Default Title" si el producto NO tiene variantes reales
    option1: string | null;
}

interface ShopifyProducto {
    id: number;
    title: string;
    variants: ShopifyVariante[];
}

export class ShopifyStrategy implements CanalStrategy {
    async obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]> {
        const { apiKey: access_token, shopUrl } = data as unknown as ShopifyCredenciales; // <- "apiKey" se usa como token
        const shop_domain = `${shopUrl}.myshopify.com`; // <- dominio completo de Shopify

        if (!access_token || !shop_domain) {
            throw new Error('Faltan datos: apiKey o shopUrl');
        }

        let url: string | null = `https://${shop_domain}/admin/api/2025-04/products.json?status=active&limit=250`;
        const todosLosProductos: ShopifyProducto[] = [];

        while (url) {
            const res: Response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': access_token,
                }
            });

            if (!res.ok) {
                const errorText: string = await res.text();
                throw new Error(`Error desde Shopify: ${res.status} - ${errorText}`);
            }

            const json: { products: ShopifyProducto[] } = await res.json();
            todosLosProductos.push(...json.products);

            const linkHeader: string | null = res.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                url = match ? match[1] : null;
            } else {
                url = null;
            }
        }

        return todosLosProductos.map((p) => {
            const variantes = Array.isArray(p.variants) ? p.variants : [];

            // Shopify SIEMPRE crea al menos 1 variante. La variante "por defecto"
            // de un producto simple se llama "Default Title" (option1 === "Default Title").
            // Si la única variante NO es esa, el producto tiene variantes reales.
            const tieneVariantesReales =
                variantes.length > 1 ||
                (variantes.length === 1 &&
                    variantes[0].option1 !== 'Default Title' &&
                    variantes[0].title !== 'Default Title');

            if (tieneVariantesReales) {
                return {
                    id: p.id.toString(),
                    title: p.title || 'Sin título',
                    variants: variantes.map((v) => ({
                        id: v.id.toString(),
                        sku: v.sku || '',
                    })),
                };
            } else {
                const variant = variantes[0];
                return {
                    id: p.id.toString(),
                    title: p.title || 'Sin título',
                    sku: variant?.sku || '',
                };
            }
        });
    }
}