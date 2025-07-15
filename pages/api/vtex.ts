import type { NextApiRequest, NextApiResponse } from 'next';
import { Publicacion } from '../../types/Publicacion';

interface VtexProduct {
    Id: number;
    Name: string;
    RefId?: string;
}

interface VtexSku {
    Id: number;
    RefId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { api_key, api_token, api_url, id } = req.body;

    if (!api_key || !api_token || !api_url || !id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    let baseUrl = api_url.trim().replace(/\/+$/, '');

// Si no empieza con http(s), lo asumimos como subdominio de VTEX
    if (!/^https?:\/\//.test(baseUrl)) {
        baseUrl = `https://${baseUrl}.myvtex.com`;
    }

    const headers = {
        'X-VTEX-API-AppKey': api_key,
        'X-VTEX-API-AppToken': api_token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    try {
        const productRes = await fetch(`${baseUrl}/api/catalog/pvt/product/${id}`, { headers });

        if (!productRes.ok) {
            const errorText = await productRes.text();
            return res.status(productRes.status).json({
                error: 'VTEX API error',
                detail: errorText,
            });
        }

        const productData: VtexProduct = await productRes.json();

        let variants: { id: string; sku: string }[] = [];

        const skusRes = await fetch(`${baseUrl}/api/catalog/pvt/product/${id}/skus`, { headers });

        if (skusRes.ok) {
            const skus: VtexSku[] = await skusRes.json();
            variants = skus.map((sku) => ({
                id: sku.Id.toString(),
                sku: sku.RefId ?? '',
            }));
        }

        const response: Publicacion = {
            id: productData.Id.toString(),
            title: productData.Name,
            sku: variants.length > 0 ? undefined : productData.RefId ?? '',
            variants: variants.length > 0 ? variants : undefined,
        };

        return res.status(200).json(response);
    } catch (e) {
        console.error('VTEX proxy error:', e);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
