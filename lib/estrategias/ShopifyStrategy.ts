import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { ShopifyCredenciales } from '../../types/Credenciales';

interface ShopifyProducto {
    id: number;
    title: string;
    variants: {
        id: number;
        sku: string;
    }[];
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
            if (Array.isArray(p.variants) && p.variants.length > 1) {
                return {
                    id: p.id.toString(),
                    title: p.title || 'Sin título',
                    variants: p.variants.map((v) => ({
                        id: v.id.toString(),
                        sku: v.sku || '',
                    })),
                };
            } else {
                const variant = p.variants?.[0];
                return {
                    id: p.id.toString(),
                    title: p.title || 'Sin título',
                    sku: variant?.sku || '',
                };
            }
        });
    }
}