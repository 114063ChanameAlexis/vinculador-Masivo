// pages/api/validar.ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {getValidador} from '../../lib/validadores/ValidadorFactory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Método no permitido'});
    }

    const {canal, ...credenciales} = req.body;

    if (!canal) {
        return res.status(400).json({error: 'Canal requerido'});
    }

    try {
        const validador = getValidador(canal);
        const resultado = await validador.validarCredenciales(credenciales);
        res.status(200).json(resultado);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({valido: false, mensaje: err.message});
        } else {
            res.status(500).json({valido: false, mensaje: 'Error interno'});
        }
    }
}