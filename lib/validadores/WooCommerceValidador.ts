import { ValidadorStrategy } from './ValidadorStrategy';
import { WooCommerceCredenciales } from '../../types/Credenciales';
import { basicAuthHeader, USER_AGENT } from '../utils/http';

export class WooCommerceValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            url?: string;
            tiendaActiva?: boolean;
        };
    }> {
        const { consumerKey, consumerSecret, storeUrl } = data as unknown as WooCommerceCredenciales;

        if (!consumerKey || !consumerSecret || !storeUrl) {
            return { valido: false, mensaje: 'Faltan datos: consumerKey, consumerSecret o storeUrl' };
        }

        const endpoint = `${storeUrl}/wp-json/wc/v3/products?per_page=1`;

        try {
            const res = await fetch(endpoint, {
                headers: {
                    Authorization: basicAuthHeader(consumerKey, consumerSecret),
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT,
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