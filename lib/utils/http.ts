import type { NextApiRequest, NextApiResponse } from 'next';

export const USER_AGENT = 'Integrador Wualá (info@wuala.net)';

export const basicAuthHeader = (user: string, pass: string = ''): string => {
    return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
};

export const normalizarBaseUrlVtex = (apiUrl: string): string => {
    let baseUrl = apiUrl.trim().replace(/\/+$/, '');

    // Si no empieza con http(s), lo asumimos como subdominio de VTEX
    if (!/^https?:\/\//.test(baseUrl)) {
        baseUrl = `https://${baseUrl}.myvtex.com`;
    }

    return baseUrl;
};

export const requirePost = (req: NextApiRequest, res: NextApiResponse): boolean => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return true;
    }
    return false;
};
