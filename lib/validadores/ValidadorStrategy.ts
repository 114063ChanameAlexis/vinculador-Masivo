export interface ValidadorStrategy {
    validarCredenciales(data: Record<string, unknown>): Promise<{
        valido: boolean;
        mensaje?: string;
        datos?: unknown;
    }>;
}