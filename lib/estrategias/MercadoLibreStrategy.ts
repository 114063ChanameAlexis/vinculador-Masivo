import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { MercadoLibreProducto } from '../../types/MercadoLibreProducto';

export class MercadoLibreStrategy implements CanalStrategy {
    async obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]> {
        const access_token = data.token as string;
        const seller_id = data.user_id as string;

        if (!access_token || !seller_id) {
            throw new Error('Faltan datos: access_token o seller_id');
        }

        const limit = 100;  // El límite de productos por página
        let offset = 0;
        const allResults: MercadoLibreProducto[] = [];
        let hasMore = true;

        // Función para obtener publicaciones filtradas por estado
        const obtenerPorEstado = async (estado: string) => {
            while (hasMore) {
                const url = `https://api.mercadolibre.com/users/${seller_id}/items/search?status=${estado}&offset=${offset}&limit=${limit}`;

                const res = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': `Bearer ${access_token}`,
                        'User-Agent': 'Integrador Wualá (info@wuala.net)',
                    }
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Error desde MercadoLibre: ${res.status} - ${errorText}`);
                }

                const response: { results: MercadoLibreProducto[], paging: { total: number } } = await res.json();
                const results = response.results || [];
                const total = response.paging.total;

                allResults.push(...results);
                console.log(`📦 Página ${Math.floor(offset / limit) + 1} (${estado}): ${results.length} items`);

                // Verifica si hay más productos para obtener
                hasMore = offset + limit < total;
                offset += limit;
            }
        }

        // Primero obtenemos las publicaciones activas
        await obtenerPorEstado('active');

        // Después obtenemos las publicaciones pausadas
        await obtenerPorEstado('paused');

        console.log(`✅ Paginación completa. Total productos: ${allResults.length}`);

        // Adaptar la respuesta al formato esperado
        return allResults.map((p) => ({
            id: p.id.toString(),
            title: "No tiene resultados"
        }));
    }
}
