import Papa from 'papaparse';

export const obtenerPublicacionesDesdeArchivo = (
    file: File
): Promise<Array<{ id: string ; Coeficiente: string}>> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as Array<{ id: string ; Coeficiente: string}>;
                resolve(data.filter(r => r.id));
            },
            error: reject,
        });
    });
};