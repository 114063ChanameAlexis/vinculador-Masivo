import { ValidadorStrategy } from './ValidadorStrategy';
import { VtexCredenciales } from '../../types/Credenciales';
import { normalizarBaseUrlVtex } from '../utils/http';

export class VtexValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            dominio?: string;
            ping?: string;
        };
    }> {
        const { api_key, api_token, api_url } = data as unknown as VtexCredenciales;

        if (!api_key || !api_token || !api_url) {
            return { valido: false, mensaje: 'Faltan datos: api_key, api_token o api_url' };
        }

        const baseUrl = normalizarBaseUrlVtex(api_url);

        const endpoint = `${baseUrl}/api/catalog_system/pvt/products/GetProductAndSkuIds`;

        try {
            const res = await fetch(endpoint, {
                headers: {
                    'X-VTEX-API-AppKey': api_key,
                    'X-VTEX-API-AppToken': api_token,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            const body = await res.text();
            console.log('📦 Respuesta de VTEX:', res.status, body);

            if (!res.ok) {
                return {
                    valido: false,
                    mensaje: `VTEX respondió con error: ${res.status} - ${body}`,
                };
            }

            return {
                valido: true,
                datos: {
                    dominio: baseUrl,
                    ping: body,
                },
            };
        } catch (err: unknown) {
            console.error('❌ Error al validar VTEX:', err);
            if (err instanceof Error) {
                return { valido: false, mensaje: err.message };
            }
            return { valido: false, mensaje: 'Error inesperado al validar VTEX' };
        }
    }
}
