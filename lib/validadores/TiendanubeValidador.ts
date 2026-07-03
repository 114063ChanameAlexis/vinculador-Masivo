import { ValidadorStrategy } from './ValidadorStrategy';
import { TiendanubeCredenciales } from '../../types/Credenciales';
import { USER_AGENT } from '../utils/http';

export class TiendanubeValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: {
            nickname?: string;
            email?: string;
            dominio?: string;
        };
    }> {
        const { access_token, tienda_id } = data as unknown as TiendanubeCredenciales;

        console.log('🔐 Validando Tiendanube con:');
        console.log('🔑 access_token:', access_token?.slice(0, 4) + '****');
        console.log('🆔 tienda_id:', tienda_id);

        if (!access_token || !tienda_id) {
            return { valido: false, mensaje: 'Faltan datos: access_token o tienda_id' };
        }

        const url = `https://api.tiendanube.com/v1/${tienda_id}/store`;
        console.log('🌐 Endpoint:', url);

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authentication': `bearer ${access_token}`,
                    'User-Agent': USER_AGENT
                },
            });

            console.log('📦 Status Tiendanube:', res.status);

            if (!res.ok) {
                const texto = await res.text();
                console.error('❌ Error desde Tiendanube:', texto);
                return {
                    valido: false,
                    mensaje: `Error desde Tiendanube: ${res.status} - ${texto}`,
                };
            }

            const tienda = await res.json();
            console.log('✅ Datos tienda:', tienda);

            return {
                valido: true,
                datos: {
                    nickname: tienda.name?.es || tienda.name,
                    email: tienda.email,
                    dominio: tienda.domains?.[0] ?? undefined,
                },
            };
        } catch (err: unknown) {
            console.error('❌ Error inesperado al validar Tiendanube:', err);
            if (err instanceof Error) {
                return { valido: false, mensaje: err.message };
            }
            return { valido: false, mensaje: 'Error inesperado al validar Tiendanube' };
        }
    }
}