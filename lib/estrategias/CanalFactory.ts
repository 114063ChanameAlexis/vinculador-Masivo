import { CanalStrategy } from './CanalStrategy';
import { TiendanubeStrategy } from './TiendanubeStrategy';
import { MercadoLibreStrategy } from './MercadoLibreStrategy';
// import otros si ya tenés

export const getStrategy = (canal: string): CanalStrategy => {
    switch (canal) {
        case 'tiendanube':
            return new TiendanubeStrategy();
        case 'mercadolibre':
            return new MercadoLibreStrategy();
        // otros...
        default:
            throw new Error(`Canal no soportado: ${canal}`);
    }
};
