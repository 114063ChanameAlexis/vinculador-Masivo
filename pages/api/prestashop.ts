import type { NextApiRequest, NextApiResponse } from 'next';
import { Publicacion } from '../../types/Publicacion';

interface Product {
    id: number;
    name: Record<string, string>; // nombre por idioma
    reference?: string;
}

interface Combination {
    id: number;
}

interface CombinationDetail {
    combination: {
        id: number;
        reference?: string;
    };
}

interface CombinationList {
    combinations: Combination[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { site_protocol, prestashop_url, api_key, id } = req.body;

    if (!site_protocol || !prestashop_url || !api_key || !id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const storeUrl = `${site_protocol}://${prestashop_url.replace(/\/+$/, '')}`;
    const headers = {
        Authorization: `Basic ${Buffer.from(api_key + ':').toString('base64')}`,
    };

    try {
        // Obtener producto principal
        const productRes = await fetch(`${storeUrl}/api/products/${id}?output_format=JSON`, { headers });
        if (!productRes.ok) {
            const errorText = await productRes.text();
            return res.status(productRes.status).json({
                error: 'PrestaShop API error',
                detail: errorText,
            });
        }

        const productData = await productRes.json();
        const product: Product = productData.product;

        // Consultar combinaciones
        const combRes = await fetch(
            `${storeUrl}/api/combinations/?filter[id_product]=[${id}]&display=full&output_format=JSON`,
            { headers }
        );

        const combData: CombinationList = await combRes.json();
        const hasVariants = combData.combinations?.length > 0;

        let variants: { id: string; sku: string }[] | undefined;

        if (hasVariants) {
            const variantIds = combData.combinations.map((c: Combination) => c.id);

            variants = await Promise.all(
                variantIds.map((variantId: number) =>
                    fetch(`${storeUrl}/api/combinations/${variantId}?output_format=JSON`, { headers })
                        .then((res) => res.json())
                        .then((data: CombinationDetail) => ({
                            id: data.combination.id.toString(),
                            sku: data.combination.reference ?? '',
                        }))
                )
            );
        }

        const response: Publicacion = {
            id: product.id.toString(),
            title: product.name[Object.keys(product.name)[0]],
            sku: hasVariants ? undefined : product.reference ?? '',
            variants: variants?.length ? variants : undefined,
        };

        return res.status(200).json(response);
    } catch (e) {
        console.error('PrestaShop proxy error:', e);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
