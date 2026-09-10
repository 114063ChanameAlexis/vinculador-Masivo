import type { NextApiRequest, NextApiResponse } from 'next';
import { Grow2onProducto } from '../../../types/Grow2onProducto';
import { requirePost, USER_AGENT } from '../../../lib/utils/http';

const BASE_URL = 'https://backend.grow2on.com';
const MAX_RESULTS = 500;

interface Grow2onResponse {
    error: boolean;
    data: Grow2onProducto[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requirePost(req, res)) return;

    const { token, serviceId } = req.body || {};

    if (!token || !serviceId) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: token y serviceId' });
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        'User-Agent': USER_AGENT,
    };

    try {
        const productos: Grow2onProducto[] = [];
        let firstResult = 0;

        while (true) {
            const url = new URL(`${BASE_URL}/products/list`);
            url.searchParams.set('serviceFilter', serviceId);
            url.searchParams.set('orderBy', 'name');
            url.searchParams.set('orderType', 'asc');
            url.searchParams.set('isActive', '1');
            url.searchParams.set('maxResults', String(MAX_RESULTS));
            url.searchParams.set('firstResult', String(firstResult));

            const wooRes = await fetch(url, { headers });

            if (!wooRes.ok) {
                const errorText = await wooRes.text();
                return res.status(wooRes.status).json({
                    error: 'Grow2on API error',
                    detail: errorText,
                });
            }

            const body: Grow2onResponse = await wooRes.json();

            if (body.error) {
                return res.status(502).json({ error: 'Grow2on devolvió error', detail: body });
            }

            const lote = body.data || [];
            productos.push(...lote);

            if (lote.length < MAX_RESULTS) break;
            firstResult += MAX_RESULTS;
        }

        return res.status(200).json(productos);
    } catch (e) {
        console.error('Grow2on proxy error:', e);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
