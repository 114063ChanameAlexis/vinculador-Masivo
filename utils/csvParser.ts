import Papa from 'papaparse';

export const obtenerPublicacionesDesdeArchivo = (
    file: File
): Promise<Array<{ id: string }>> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as Array<{ id: string }>;
                resolve(data.filter(r => r.id));
            },
            error: reject,
        });
    });
};