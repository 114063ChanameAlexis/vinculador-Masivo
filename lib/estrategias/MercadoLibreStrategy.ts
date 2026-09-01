import { CanalStrategy } from './CanalStrategy';
import { Publicacion } from '../../types/Publicacion';
import { MercadoLibreCredenciales } from '../../types/Credenciales';
import { USER_AGENT } from '../utils/http';

const BASE_URL = 'https://api.mercadolibre.com';
const BULK_SIZE = 20; // máximo permitido por /items?ids=
const VARIANT_BATCH_SIZE = 15;
const VARIANT_BATCH_DELAY_MS = 200;
const ESTADOS_INCLUIDOS = ['active', 'paused'];

type MLAttribute = { id: string; value_name?: string };
type MLVariation = { id: number | string; attributes?: MLAttribute[] };
type MLItem = {
    id: string;
    title: string;
    attributes?: MLAttribute[];
    variations?: MLVariation[];
};
type MLBulkResult = { code: number; body: MLItem };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSkuFromAttributes = (attrs?: MLAttribute[]): string =>
    attrs?.find((a) => a.id === 'SELLER_SKU')?.value_name?.trim() || '';

export class MercadoLibreStrategy implements CanalStrategy {
    async obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]> {
        const { token, userId } = data as unknown as MercadoLibreCredenciales & { userId?: string };

        if (!token || !userId) {
            throw new Error('Faltan datos: token o userId');
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
        };

        const ids = await this.obtenerTodosLosIds(userId, headers);
        const items = await this.obtenerItemsEnBulk(ids, headers);

        return this.resolverPublicaciones(items, headers);
    }

    private async obtenerTodosLosIds(
        userId: string,
        headers: Record<string, string>
    ): Promise<string[]> {
        const ids: string[] = [];

        // ML no soporta múltiples valores de "status" en una misma query
        // (se queda con el primero e ignora el resto), así que hay que
        // escanear por separado para cada estado que queremos incluir.
        for (const status of ESTADOS_INCLUIDOS) {
            ids.push(...(await this.escanearPorEstado(userId, status, headers)));
        }

        return ids;
    }

    private async escanearPorEstado(
        userId: string,
        status: string,
        headers: Record<string, string>
    ): Promise<string[]> {
        const ids: string[] = [];
        let scrollId: string | undefined;

        do {
            const url = new URL(`${BASE_URL}/users/${userId}/items/search`);
            url.searchParams.set('search_type', 'scan');
            url.searchParams.set('status', status);
            if (scrollId) url.searchParams.set('scroll_id', scrollId);

            const res = await fetch(url, { headers });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error desde Mercado Libre (scan/${status}): ${res.status} - ${errorText}`);
            }

            const body = await res.json();
            const results: string[] = body.results || [];
            scrollId = body.scroll_id;

            if (!results.length) break;
            ids.push(...results);
        } while (scrollId);

        return ids;
    }

    private async obtenerItemsEnBulk(
        ids: string[],
        headers: Record<string, string>
    ): Promise<MLItem[]> {
        const items: MLItem[] = [];

        for (let i = 0; i < ids.length; i += BULK_SIZE) {
            const batch = ids.slice(i, i + BULK_SIZE);
            const url = `${BASE_URL}/items?ids=${batch.join(',')}`;
            const res = await fetch(url, { headers });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error desde Mercado Libre (bulk): ${res.status} - ${errorText}`);
            }

            const results: MLBulkResult[] = await res.json();
            for (const r of results) {
                if (r.code === 200) items.push(r.body);
            }
        }

        return items;
    }

    private async resolverPublicaciones(
        items: MLItem[],
        headers: Record<string, string>
    ): Promise<Publicacion[]> {
        const publicaciones: Publicacion[] = [];

        for (let i = 0; i < items.length; i += VARIANT_BATCH_SIZE) {
            const batch = items.slice(i, i + VARIANT_BATCH_SIZE);

            const resueltos = await Promise.all(
                batch.map((item) => this.resolverPublicacion(item, headers))
            );
            publicaciones.push(...resueltos);

            if (i + VARIANT_BATCH_SIZE < items.length) {
                await sleep(VARIANT_BATCH_DELAY_MS);
            }
        }

        return publicaciones;
    }

    private async resolverPublicacion(
        item: MLItem,
        headers: Record<string, string>
    ): Promise<Publicacion> {
        const hasVariants = Array.isArray(item.variations) && item.variations.length > 0;

        if (!hasVariants) {
            return {
                id: item.id,
                title: item.title,
                sku: getSkuFromAttributes(item.attributes),
            };
        }

        const variants = await Promise.all(
            (item.variations as MLVariation[]).map(async (v) => {
                const skuDirecto = getSkuFromAttributes(v.attributes);
                if (skuDirecto) return { id: String(v.id), sku: skuDirecto };

                try {
                    const vRes = await fetch(
                        `${BASE_URL}/items/${encodeURIComponent(item.id)}/variations/${encodeURIComponent(
                            String(v.id)
                        )}`,
                        { headers }
                    );
                    if (!vRes.ok) return { id: String(v.id), sku: '' };

                    const vData: MLVariation = await vRes.json();
                    return { id: String(v.id), sku: getSkuFromAttributes(vData.attributes) };
                } catch {
                    return { id: String(v.id), sku: '' };
                }
            })
        );

        return {
            id: item.id,
            title: item.title,
            variants: variants.some((v) => v.sku) ? variants : undefined,
        };
    }
}
