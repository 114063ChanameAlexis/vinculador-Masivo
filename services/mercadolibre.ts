import { Publicacion } from '../types/Publicacion';

interface Attribute {
    id: string;
    value_name?: string;
}

interface Variation {
    id: number;
    attributes?: Attribute[];
}

function getSKUFromAttributes(attributes?: Attribute[]): string {
    return (
        attributes?.find((attr: Attribute) => attr.id === 'SELLER_SKU')?.value_name || ''
    );
}

export const consultarML = async (
    row: { id: string },
    credenciales: Record<string, string>
): Promise<Publicacion | null> => {
    try {
        const headers = {
            Authorization: `Bearer ${credenciales.token}`,
        };

        const res = await fetch(`https://api.mercadolibre.com/items/${row.id}`, { headers });
        if (!res.ok) return null;

        const data = await res.json();
        const hasVariants = Array.isArray(data.variations) && data.variations.length > 0;

        let variants;
        if (hasVariants) {
            variants = await Promise.all(
                data.variations.map(async (v: Variation) => {
                    const sku = getSKUFromAttributes(v.attributes);

                    if (sku) {
                        return {
                            id: v.id.toString(),
                            sku,
                        };
                    }

                    try {
                        const vRes = await fetch(
                            `https://api.mercadolibre.com/items/${row.id}/variations/${v.id}`,
                            { headers }
                        );
                        if (!vRes.ok) return { id: v.id.toString(), sku: '' };
                        const vData = await vRes.json();
                        return {
                            id: v.id.toString(),
                            sku: getSKUFromAttributes(vData.attributes),
                        };
                    } catch {
                        return { id: v.id.toString(), sku: '' };
                    }
                })
            );
        }

        return {
            id: data.id,
            title: data.title,
            sku: hasVariants ? undefined : getSKUFromAttributes(data.attributes),
            variants,
        };
    } catch (e) {
        console.error('Mercado Libre error:', e);
        return null;
    }
};