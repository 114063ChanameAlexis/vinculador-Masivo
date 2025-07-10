import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { TiendanubeProducto } from '../../types/TiendanubeProducto';

export class TiendanubeStrategy implements CanalStrategy {
    async obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]> {
        const access_token = data.access_token as string;
        const tienda_id = data.tienda_id as string;

        if (!access_token || !tienda_id) {
            throw new Error('Faltan datos: access_token o tienda_id');
        }

        const perPage = 200;
        let page = 1;
        let hasMore = true;
        const todosLosProductos: TiendanubeProducto[] = [];

        while (hasMore) {
            const url = `https://api.tiendanube.com/v1/${tienda_id}/products?per_page=${perPage}&page=${page}`;

            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authentication': `bearer ${access_token}`,
                    'User-Agent': 'Integrador Wualá (info@wuala.net)'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error desde Tiendanube: ${res.status} - ${errorText}`);
            }

            const productos: TiendanubeProducto[] = await res.json();
            todosLosProductos.push(...productos);

            hasMore = productos.length === perPage;
            page++;
        }

        return todosLosProductos.map((p) => {
            if (Array.isArray(p.variants) && p.variants.length > 0) {
                return {
                    id: p.id.toString(),
                    title: p.name?.es || 'Sin título',
                    variants: p.variants.map((v) => ({
                        id: v.id.toString(),
                        sku: v.sku || '',
                    })),
                };
            } else {
                return {
                    id: p.id.toString(),
                    title: p.name?.es || 'Sin título',
                    sku: p.sku || '',
                };
            }
        });
    }
}