export interface MercadoLibreCredenciales {
    token: string;
    userId?: string;
}

export interface ShopifyCredenciales {
    apiKey: string;
    shopUrl: string;
}

export interface WooCommerceCredenciales {
    consumerKey: string;
    consumerSecret: string;
    storeUrl: string;
}

export interface TiendanubeCredenciales {
    access_token: string;
    tienda_id: string;
}

export interface PrestaShopCredenciales {
    api_key: string;
    prestashop_url: string;
    site_protocol: string;
}

export interface VtexCredenciales {
    api_key: string;
    api_token: string;
    api_url: string;
}
