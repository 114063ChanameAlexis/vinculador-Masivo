// pages/api/mercadolibre.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Publicacion } from '../../types/Publicacion';

type MLAttribute = { id: string; value_name?: string };
type MLVariation = {
    id: number | string;
    attributes?: MLAttribute[];
    seller_custom_field?: string | null;
};
type MLItem = {
    id: string;
    title: string;
    attributes?: MLAttribute[];
    variations?: MLVariation[];
    seller_custom_field?: string | null;
};

function getSKUFromAttributes(attrs?: MLAttribute[]): string {
    return attrs?.find((a) => a.id === 'SELLER_SKU')?.value_name?.trim() || '';
}

function normalizeSKU(primary?: string | null, fallbackAttrSKU?: string): string {
    // Prioridad: seller_custom_field > attribute SELLER_SKU
    return (primary?.trim() || fallbackAttrSKU || '').trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { id, token } = req.body || {};
    if (!id || !token) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: id y token' });
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
        // 1) Traer item principal
        const itemRes = await fetch(`https://api.mercadolibre.com/items/${encodeURIComponent(id)}`, {
            headers,
        });

        if (!itemRes.ok) {
            const detail = await itemRes.text().catch(() => '');
            return res.status(itemRes.status).json({ error: 'Mercado Libre API error', detail });
        }

        const item: MLItem = await itemRes.json();

        const hasVariants = Array.isArray(item.variations) && item.variations.length > 0;

        // 2) Si hay variaciones, mapear {id, sku}
        let variants: { id: string; sku: string }[] | undefined;

        if (hasVariants) {
            variants = await Promise.all(
                (item.variations as MLVariation[]).map(async (v) => {
                    // Intento 1: SKU directo en la variación
                    const skuDirect = normalizeSKU(v.seller_custom_field, getSKUFromAttributes(v.attributes));

                    if (skuDirect) {
                        return { id: String(v.id), sku: skuDirect };
                    }

                    // Intento 2: endpoint de variación (por si no vino completo en el item)
                    try {
                        const vRes = await fetch(
                            `https://api.mercadolibre.com/items/${encodeURIComponent(id)}/variations/${encodeURIComponent(
                                String(v.id)
                            )}`,
                            { headers }
                        );

                        if (!vRes.ok) return { id: String(v.id), sku: '' };

                        const vData: MLVariation = await vRes.json();
                        const skuFromDetail = normalizeSKU(
                            vData.seller_custom_field,
                            getSKUFromAttributes(vData.attributes)
                        );

                        return { id: String(v.id), sku: skuFromDetail };
                    } catch {
                        return { id: String(v.id), sku: '' };
                    }
                })
            );

            // Si ninguna variación tiene SKU, devolver undefined para no ensuciar la respuesta
            if (!variants.some((v) => v.sku)) {
                variants = undefined;
            }
        }

        // 3) Construir `Publicacion`
        const response: Publicacion = {
            id: item.id,
            title: item.title,
            sku: hasVariants
                ? undefined
                : normalizeSKU(getSKUFromAttributes(item.attributes)),
            variants,
        };

        return res.status(200).json(response);
    } catch (e) {
        console.error('Mercado Libre proxy error:', e);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}