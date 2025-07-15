import { Publicacion } from '../types/Publicacion';

export const consultarVTEX = async (
    row: { id: string },
    credenciales: Record<string, string>
): Promise<Publicacion | null> => {
    const { api_key, api_token, api_url } = credenciales;

    try {
        const res = await fetch('/api/vtex', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: row.id,
                api_key,
                api_token,
                api_url,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('VTEX API error:', error);
            return null;
        }

        const data: Publicacion = await res.json();
        return data;
    } catch (e) {
        console.error('VTEX error:', e);
        return null;
    }
};
