import type { NextApiRequest, NextApiResponse } from 'next';
import { getStrategy } from '../../lib/estrategias/CanalFactory';
import { requirePost } from '../../lib/utils/http';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requirePost(req, res)) return;

    const { canal, ...data } = req.body;

    if (!canal) {
        return res.status(400).json({ error: 'Canal requerido' });
    }

    try {
        const strategy = getStrategy(canal);
        const publicaciones = await strategy.obtenerPublicaciones(data);
        res.status(200).json(publicaciones);
    } catch (err: unknown) {
        console.error('Error en /api/publicaciones:', err);
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: 'Error inesperado' });
        }
    }
}

