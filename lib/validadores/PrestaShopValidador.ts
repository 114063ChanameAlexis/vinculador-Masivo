import { ValidadorStrategy } from './ValidadorStrategy';
import { PrestaShopCredenciales } from '../../types/Credenciales';
import { basicAuthHeader } from '../utils/http';

export class PrestaShopValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            url?: string;
            entidad?: string;
        };
    }> {
        const { api_key, prestashop_url, site_protocol } = data as unknown as PrestaShopCredenciales;

        if (!api_key || !prestashop_url || !site_protocol) {
            return { valido: false, mensaje: 'Faltan datos: api_key, URL o protocolo' };
        }

        const endpoint = `${site_protocol}://${prestashop_url}/api/customers`;

        try {
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: basicAuthHeader(api_key),
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const texto = await res.text();
                return {
                    valido: false,
                    mensaje: `Error desde PrestaShop: ${res.status} - ${texto}`,
                };
            }

            return {
                valido: true,
                datos: {
                    url: `${site_protocol}://${prestashop_url}`,
                    entidad: 'customers',
                },
            };
        } catch (err: unknown) {
            if (err instanceof Error) {
                return { valido: false, mensaje: err.message };
            }
            return { valido: false, mensaje: 'Error inesperado al validar PrestaShop' };
        }
    }
}