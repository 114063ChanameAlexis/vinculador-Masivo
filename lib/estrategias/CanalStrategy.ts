import { Publicacion } from '../../types/Publicacion';

export interface CanalStrategy {
    obtenerPublicaciones(data: Record<string, unknown>): Promise<Publicacion[]>;
}