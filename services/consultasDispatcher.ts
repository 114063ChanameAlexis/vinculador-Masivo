import {Publicacion} from '../types/Publicacion';
import {consultarML} from './mercadolibre';
import {consultarWoo} from './woocommerce';
import {consultarVTEX} from './vtex';
import {consultarPresta} from './prestashop';

export const consultarPublicacionPorCanal = async (
    canal: string,
    row: { id: string },
    credenciales: Record<string, string>
): Promise<Publicacion | null> => {
    switch (canal) {
        case 'mercadolibre':
            return consultarML(row, credenciales);
        case 'woocommerce':
            return consultarWoo(row, credenciales);
        case 'vtex':
            return consultarVTEX(row, credenciales);
        case 'prestashop':
            return consultarPresta(row, credenciales);
        default:
            return null;
    }
};