import { ValidadorStrategy } from './ValidadorStrategy';

export class WooCommerceValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            url?: string;
            tiendaActiva?: boolean;
        };
    }> {
        const consumerKey = data.consumerKey as string;
        const consumerSecret = data.consumerSecret as string;
        const storeUrl = data.storeUrl as string;

        if (!consumerKey || !consumerSecret || !storeUrl) {
            return { valido: false, mensaje: 'Faltan datos: consumerKey, consumerSecret o storeUrl' };
        }

        const endpoint = `${storeUrl}/wp-json/wc/v3/products?per_page=1`;

        try {
            const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

            const res = await fetch(endpoint, {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Integrador Wualá (info@wuala.net)',
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                return {
                    valido: false,
                    mensaje: `Error desde WooCommerce: ${res.status} - ${errorText}`,
                };
            }

            return {
                valido: true,
                datos: {
                    url: storeUrl,
                    tiendaActiva: true,
                },
            };
        } catch (err: unknown) {
            if (err instanceof Error) {
                return { valido: false, mensaje: err.message };
            }
            return { valido: false, mensaje: 'Error inesperado al validar WooCommerce' };
        }
    }
}