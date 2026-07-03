import { ValidadorStrategy } from './ValidadorStrategy';
import { ShopifyCredenciales } from '../../types/Credenciales';

export class ShopifyValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            name?: string;
            email?: string;
            dominio?: string;
        };
    }> {
        const { apiKey, shopUrl } = data as unknown as ShopifyCredenciales;

        if (!apiKey || !shopUrl) {
            return { valido: false, mensaje: 'Faltan datos: apiKey o shopUrl' };
        }

        const fullDomain = `${shopUrl}.myshopify.com`;

        try {
            const res = await fetch(`https://${fullDomain}/admin/api/2023-07/shop.json`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': apiKey,
                },
            });

            if (!res.ok) {
                const texto = await res.text();
                return {
                    valido: false,
                    mensaje: `Error desde Shopify: ${res.status} - ${texto}`,
                };
            }

            const { shop } = await res.json();

            return {
                valido: true,
                datos: {
                    name: shop.name,
                    email: shop.email,
                    dominio: shop.domain,
                },
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                return { valido: false, mensaje: error.message };
            }
            return { valido: false, mensaje: 'Error inesperado al validar Shopify' };
        }
    }
}
