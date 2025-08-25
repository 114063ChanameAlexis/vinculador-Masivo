import React, { useState } from 'react';
import Papa from 'papaparse';
import { Box, Button, Typography } from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { saveAs } from 'file-saver';
import { Publicacion } from '../types/Publicacion';

interface Props {
    publicaciones: Publicacion[];
    serviceId: string;
    isServiceIdValid: boolean;
}

interface CSVRow {
    sku: string;
    id: string;
    articleId: string;
}

interface Coincidencia {
    id: string;
    productId: string;
    serviceId: string;
    destinationProductId: string;
    erpId: string;
    isVariant?: string;
    variantId?: string;
    isPrimaryVariant?: string;
    coeficientStock: number;
    coeficientPrice: number;
    safety_stock?: number;
    createdAt: string;
    updatedAt:  string;
    deletedAt:  string;
    dateLastSync: string;
}

interface ErrorDeCruce {
    publicacion: string;
    nombre: string;
    skuCargado: string;
    variante: number;
    skuERP: string;
}

const CSVComparador: React.FC<Props> = ({ publicaciones, serviceId, isServiceIdValid }) => {
    const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([]);
    const [errores, setErrores] = useState<ErrorDeCruce[]>([]);

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data;
                const skuMap: Record<string, { id: string; erpId: string }> = {};
                parsed.forEach(row => {
                    if (row.sku) {
                        skuMap[row.sku] = { id: row.id, erpId: row.articleId };
                    }
                });

                compararConPublicaciones(skuMap);
            },
        });
    };

    const compararConPublicaciones = (skuMap: Record<string, { id: string; erpId: string }>) => {
        const correctos: Coincidencia[] = [];
        const incorrectos: ErrorDeCruce[] = [];

        publicaciones.forEach(pub => {
            if (pub.variants?.length) {
                const allMatch = pub.variants.every(v => v.sku && skuMap[v.sku]);
                if (allMatch) {
                    let isFirst = true;
                    pub.variants.forEach(variant => {
                        const sku = variant.sku;
                        if (sku && skuMap[sku]) {
                            const match = skuMap[sku];
                            correctos.push({
                                id: crypto.randomUUID().replace(/-/g, '').toUpperCase(),
                                productId: match.id.slice(2).toUpperCase(),
                                serviceId: serviceId,
                                destinationProductId: pub.id,
                                erpId: match.erpId,
                                isVariant: '1',
                                variantId: variant.id,
                                isPrimaryVariant: isFirst ? '1' : '0',
                                coeficientStock: 1,
                                coeficientPrice: 1,
                                safety_stock: 0,
                                createdAt: '',
                                updatedAt: '',
                                deletedAt: '',
                                dateLastSync: ''
                            });
                            isFirst = false;
                        }
                    });
                } else {
                    pub.variants.forEach((variant, idx) => {
                        incorrectos.push({
                            publicacion: pub.id,
                            nombre: pub.title,
                            skuCargado: variant.sku,
                            variante: idx + 1,
                            skuERP: variant.sku && skuMap[variant.sku] ? 'Encontrado' : 'No encontrado',
                        });
                    });
                }
            } else {
                const sku = pub.sku;
                if (sku && skuMap[sku]) {
                    const match = skuMap[sku];
                    correctos.push({
                        id: crypto.randomUUID().replace(/-/g, '').toUpperCase(),
                        productId: match.id.slice(2).toUpperCase(),
                        serviceId: serviceId,
                        destinationProductId: pub.id,
                        erpId: match.erpId,
                        isVariant: '',
                        variantId: '',
                        isPrimaryVariant: '',
                        coeficientStock: 1,
                        coeficientPrice: 1,
                        safety_stock: 0,
                        createdAt: '',
                        updatedAt: '',
                        deletedAt: '',
                        dateLastSync: ''
                    });
                } else {
                    incorrectos.push({
                        publicacion: pub.id,
                        nombre: pub.title,
                        skuCargado: sku ?? 'Sin SKU',
                        variante: 1,
                        skuERP: 'No encontrado',
                    });
                }
            }
        });

        setCoincidencias(correctos);
        setErrores(incorrectos);
    };

    const exportarCoincidencias = () => {
        const csv = Papa.unparse(coincidencias);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'Coincidencias.csv');
    };

    const exportarErrores = () => {
        const csv = Papa.unparse(errores);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'Errores.csv');
    };

    const columnsCoincidencias: MRT_ColumnDef<Coincidencia>[] = [
        { accessorKey: 'productId', header: 'ID ERP' },
        { accessorKey: 'destinationProductId', header: 'ID Publicación' },
        { accessorKey: 'erpId', header: 'ID Artículo ERP' },
        { accessorKey: 'variantId', header: 'ID Variante' },
        { accessorKey: 'isPrimaryVariant', header: 'Principal' },
    ];

    const columnsErrores: MRT_ColumnDef<ErrorDeCruce>[] = [
        { accessorKey: 'publicacion', header: 'Publicación' },
        { accessorKey: 'nombre', header: 'Nombre' },
        { accessorKey: 'skuCargado', header: 'SKU cargado' },
        { accessorKey: 'variante', header: 'N° Variante' },
        { accessorKey: 'skuERP', header: 'Resultado' },
    ];

    return (
        <Box sx={{ mt: 4 }}>
            <Button variant="contained" component="label" disabled={!isServiceIdValid} >
                Subir CSV
                <input type="file" hidden accept=".csv" onChange={handleCSVUpload} />
            </Button>

            {coincidencias.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 6, textAlign: 'center' }}>
                        Coincidencias
                    </Typography>
                    <MaterialReactTable data={coincidencias} columns={columnsCoincidencias} />
                </>
            )}

            {errores.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 6, textAlign: 'center' }}>
                        Errores ⚠️
                    </Typography>

                    <MaterialReactTable data={errores} columns={columnsErrores} />
                </>
            )}

            {(coincidencias.length > 0 || errores.length > 0) && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={exportarCoincidencias} disabled={!coincidencias.length}>
                        Exportar Coincidencias
                    </Button>
                    <Button variant="outlined" color="error" onClick={exportarErrores} disabled={!errores.length}>
                        Exportar Errores
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default CSVComparador;