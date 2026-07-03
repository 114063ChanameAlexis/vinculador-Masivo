import { ValidadorStrategy } from './ValidadorStrategy';
import { MercadoLibreCredenciales } from '../../types/Credenciales';
import { USER_AGENT } from '../utils/http';

export class MercadoLibreValidador implements ValidadorStrategy {
    async validarCredenciales(data: Record<string, unknown>) {
        const { token } = data as unknown as MercadoLibreCredenciales;
        if (!token) return { valido: false, mensaje: 'Token requerido' };

        try {
            const res = await fetch('https://api.mercadolibre.com/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT,
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                return {
                    valido: false,
                    mensaje: `Token inválido: ${res.status} - ${errorText}`
                };
            }

            const data = await res.json();
            return {
                valido: true,
                datos: {
                    nickname: data.nickname,
                    id: data.id,
                    nombre: data.first_name + ' ' + data.last_name,
                }
            };
        } catch (err) {
            console.error(err);
            return {
                valido: false,
                mensaje: 'Error al validar token de Mercado Libre',
            };
        }
    }
}
