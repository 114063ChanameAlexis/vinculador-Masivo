import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { WooCommerceCredenciales } from '../../types/Credenciales';
import { basicAuthHeader, USER_AGENT } from '../utils/http';

interface WooCommerceProducto {
    id: number;
    name: string;
    sku?: string;
    variations?: number[];
}

interface WooVariant {
    id: number;
    sku?: string;
}

export class WooCommerceStrategy implements CanalStrategy {
    async obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]> {
        const { consumerKey, consumerSecret, storeUrl } = data as unknown as WooCommerceCredenciales;

        if (!consumerKey || !consumerSecret || !storeUrl) {
            throw new Error('Faltan datos: consumerKey, consumerSecret o storeUrl');
        }

        const headers = {
            Authorization: basicAuthHeader(consumerKey, consumerSecret),
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        };

        const perPage = 100; // máximo permitido por WooCommerce
        let page = 1;
        let totalPages = 1;
        const todosLosProductos: WooCommerceProducto[] = [];

        do {
            const url = `${storeUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`;
            const res = await fetch(url, { headers });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error desde WooCommerce: ${res.status} - ${errorText}`);
            }

            const productos: WooCommerceProducto[] = await res.json();
            todosLosProductos.push(...productos);

            // WooCommerce indica el total de páginas en este header
            totalPages = Number(res.headers.get('X-WP-TotalPages')) || 1;
            page++;
        } while (page <= totalPages);

        const publicaciones: Publicacion[] = [];

        for (const p of todosLosProductos) {
            if (Array.isArray(p.variations) && p.variations.length > 0) {
                // Producto variable: el SKU real vive en cada variación, no en el producto padre
                const variantRes = await fetch(
                    `${storeUrl}/wp-json/wc/v3/products/${p.id}/variations?per_page=100&page=1`,
                    { headers }
                );

                let variants: { id: string; sku: string }[] = [];
                if (variantRes.ok) {
                    const variantData: WooVariant[] = await variantRes.json();
                    variants = variantData.map((v) => ({
                        id: v.id.toString(),
                        sku: v.sku ?? '',
                    }));
                }

                publicaciones.push({
                    id: p.id.toString(),
                    title: p.name || 'Sin título',
                    variants: variants.length > 0 ? variants : undefined,
                    sku: variants.length > 0 ? undefined : p.sku || '',
                });
            } else {
                publicaciones.push({
                    id: p.id.toString(),
                    title: p.name || 'Sin título',
                    sku: p.sku || '',
                });
            }
        }

        return publicaciones;
    }
}
