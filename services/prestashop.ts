import { Publicacion } from '../types/Publicacion';

export const consultarPresta = async (
    row: { id: string },
    credenciales: Record<string, string>
): Promise<Publicacion | null> => {
    const { site_protocol, prestashop_url, api_key } = credenciales;

    try {
        const res = await fetch('/api/prestashop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                site_protocol,
                prestashop_url,
                api_key,
                id: row.id,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('PrestaShop API error:', error);
            return null;
        }

        const data: Publicacion = await res.json();
        return data;
    } catch (e) {
        console.error('PrestaShop error:', e);
        return null;
    }
};
