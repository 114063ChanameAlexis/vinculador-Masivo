import type { NextApiRequest, NextApiResponse } from 'next';
import { Publicacion } from '../../types/Publicacion';

interface WooVariant {
    id: number;
    sku?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { storeUrl, id, consumerKey, consumerSecret } = req.body;

    if (!storeUrl || !id || !consumerKey || !consumerSecret) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const headers = {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Integrador Wualá (info@wuala.net)',
        };

        // Consulta principal del producto
        const wooRes = await fetch(`${storeUrl}/wp-json/wc/v3/products/${id}`, { headers });

        if (!wooRes.ok) {
            const errorText = await wooRes.text();
            return res.status(wooRes.status).json({
                error: 'WooCommerce API error',
                detail: errorText,
            });
        }

        const productData = await wooRes.json();


        let variants: { id: string; sku: string }[] = [];


        if (Array.isArray(productData.variations) && productData.variations.length > 0) {
            const variantRes = await fetch(
                `${storeUrl}/wp-json/wc/v3/products/${id}/variations?per_page=100&page=1`,
                { headers }
            );

            if (variantRes.ok) {
                const variantData: WooVariant[] = await variantRes.json();
                variants = variantData.map((v) => ({
                    id: v.id.toString(),
                    sku: v.sku ?? '',
                }));
            }
        }

        // Formatear respuesta final
        const response: Publicacion = {
            id: productData.id.toString(),
            title: productData.name,
            sku: variants.length > 0 ? undefined : productData.sku ?? '',
            variants: variants.length > 0 ? variants : undefined,
        };

        return res.status(200).json(response);
    } catch (e) {
        console.error('Woo proxy error:', e);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}