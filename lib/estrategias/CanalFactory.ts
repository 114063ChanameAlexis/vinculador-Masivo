import { CanalStrategy } from './CanalStrategy';
import { TiendanubeStrategy } from './TiendanubeStrategy';
import { ShopifyStrategy} from "./ShopifyStrategy";
import { WooCommerceStrategy } from './WooCommerceStrategy';

export const getStrategy = (canal: string): CanalStrategy => {
    switch (canal) {
        case 'tiendanube':
            return new TiendanubeStrategy();
        case 'shopify':
            return new ShopifyStrategy();
        case 'woocommerce':
            return new WooCommerceStrategy();
        default:
            throw new Error(`Canal no soportado: ${canal}`);
    }
};
