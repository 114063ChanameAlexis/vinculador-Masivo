import { Publicacion } from '../types/Publicacion';

export const consultarML = async (
    row: { id: string },
    credenciales: Record<string, string> // { token: string }
): Promise<Publicacion | null> => {
    try {
        const res = await fetch('/api/mercadolibre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: row.id,
                token: credenciales.token,
            }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            console.error('ML API proxy error:', error);
            return null;
        }

        const data: Publicacion = await res.json();
        return data;
    } catch (e) {
        console.error('ML frontend error:', e);
        return null;
    }
};
