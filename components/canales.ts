export const canales = [
    { id: "mercadolibre", nombre: "Mercado Libre", logo: "https://integrador.grow2on.com/assets/mercadolibre-DaJKpyV2.svg" },
    { id: "tiendanube", nombre: "Tiendanube", logo: "https://integrador.grow2on.com/assets/tiendanube-CEpie4LL.svg" },
    { id: "woocommerce", nombre: "WooCommerce", logo: "https://integrador.grow2on.com/assets/woocommerce-M8l621rZ.svg" },
    { id: "shopify", nombre: "Shopify", logo: "https://integrador.grow2on.com/assets/shopify-Duv6EWlU.svg" },
    { id: "prestashop", nombre: "PrestaShop", logo: "https://integrador.grow2on.com/assets/prestashop-CvS8munV.svg" },
    { id: "vtex", nombre: "VTEX", logo: "https://integrador.grow2on.com/assets/vtex-DBqgjNpp.svg" },
];

export const camposPorCanal: Record<string, Array<{ name: string; placeholder: string }>> = {
    mercadolibre: [
        { name: "token", placeholder: "Token de acceso" },
        { name: "user_id", placeholder: "User ID" },
    ],
    shopify: [
        { name: "apiKey", placeholder: "API Key" },
        { name: "shopUrl", placeholder: "Shop URL" },
    ],
    woocommerce: [
        { name: "consumerKey", placeholder: "Consumer Key" },
        { name: "consumerSecret", placeholder: "Consumer Secret" },
        { name: "storeUrl", placeholder: "URL de la tienda" },
    ],
    tiendanube: [
        { name: "access_token", placeholder: "Access Token" },
        { name: "tienda_id", placeholder: "User ID" },
    ],
    prestashop: [
        { name: "apiKey", placeholder: "API Key" },
        { name: "storeUrl", placeholder: "URL de la tienda" },
    ],
    vtex: [
        { name: "appKey", placeholder: "App Key" },
        { name: "appToken", placeholder: "App Token" },
        { name: "accountName", placeholder: "Account Name" },
    ],
};