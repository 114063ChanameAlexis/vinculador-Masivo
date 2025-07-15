import { ValidadorStrategy } from './ValidadorStrategy';
import { MercadoLibreValidador } from './MercadoLibreValidador';
import { ShopifyValidador } from './ShopifyValidador';
import {PrestaShopValidador} from "./PrestaShopValidador";
import {TiendanubeValidador} from "./TiendanubeValidador";
import {WooCommerceValidador} from "./WooCommerceValidador";
import {VtexValidador} from "./VtexValidador";

export const getValidador = (canal: string): ValidadorStrategy => {
    switch (canal) {
        case 'mercadolibre':
            return new MercadoLibreValidador();
        case 'shopify':
            return new ShopifyValidador();
        case 'prestashop':
            return new PrestaShopValidador();
        case 'tiendanube':
            return new TiendanubeValidador();
        case 'woocommerce':
            return new WooCommerceValidador()
        case 'vtex':
            return new VtexValidador()
        // ...
        default:
            throw new Error(`Validador no disponible para el canal: ${canal}`);
    }
};
