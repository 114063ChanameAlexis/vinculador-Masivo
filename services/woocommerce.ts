import { Publicacion } from '../types/Publicacion';

export const consultarWoo = async (
    row: { id: string },
    credenciales: Record<string, string>
): Promise<Publicacion | null> => {
    const { storeUrl, consumerKey, consumerSecret } = credenciales;

    try {
        const res = await fetch('/api/woocommerce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeUrl,
                id: row.id,
                consumerKey,
                consumerSecret,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('Woo API error:', error);
            return null;
        }

        const data: Publicacion = await res.json();
        return data;
    } catch (e) {
        console.error('WooCommerce error:', e);
        return null;
    }
};