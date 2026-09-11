import React, {useState} from 'react';
import Papa from 'papaparse';
import {Box, Button, TextField, Typography} from '@mui/material';
import {MaterialReactTable, type MRT_ColumnDef} from 'material-react-table';
import {saveAs} from 'file-saver';
import {Publicacion} from '../types/Publicacion';

interface Props {
    publicaciones: Publicacion[];
    serviceId: string;
    isServiceIdValid: boolean;
    coeficientesMap: Record<string, string>;
    onResultados?: () => void;
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
    coeficientPrice: number;
    safety_stock?: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    dateLastSync: string;
    listingId: string;
}

interface ErrorDeCruce {
    publicacion: string;
    nombre: string;
    skuCargado: string;
    variante: number;
    skuERP: string;
}

const parseCoef = (raw?: string): number => {
    if (!raw) return 1;
    const n = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : 1;
};


const CSVComparador: React.FC<Props> = ({publicaciones, serviceId, isServiceIdValid, coeficientesMap, onResultados}) => {
    const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([]);
    const [errores, setErrores] = useState<ErrorDeCruce[]>([]);
    const [safetyStockGeneral, setSafetyStockGeneral] = useState('0');
    const [coeficientePriceGeneral, setCoeficientePriceGeneral] = useState('1');

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
                        skuMap[row.sku] = {id: row.id, erpId: row.articleId};
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

            const priceCoef = parseCoef(String(coeficientesMap?.[pub.id] ?? 1));
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
                                coeficientPrice: priceCoef,
                                safety_stock: 0,
                                createdAt: '',
                                updatedAt: '',
                                deletedAt: '',
                                dateLastSync: '',
                                listingId: ''
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
                        coeficientPrice: priceCoef,
                        safety_stock: 0,
                        createdAt: '',
                        updatedAt: '',
                        deletedAt: '',
                        dateLastSync: '',
                        listingId: ''
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

        if (correctos.length > 0 || incorrectos.length > 0) {
            onResultados?.();
        }
    };

    const aplicarATodas = () => {
        const safetyStock = parseInt(safetyStockGeneral, 10);
        const coeficientPrice = parseCoef(coeficientePriceGeneral);

        setCoincidencias(prev =>
            prev.map(c => ({
                ...c,
                safety_stock: Number.isFinite(safetyStock) ? safetyStock : 0,
                coeficientPrice,
            }))
        );
    };

    const exportarCoincidencias = () => {
        const csv = Papa.unparse(coincidencias);
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        saveAs(blob, 'Coincidencias.csv');
    };

    const exportarErrores = () => {
        const csv = Papa.unparse(errores);
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        saveAs(blob, 'Errores.csv');
    };

    const columnsCoincidencias: MRT_ColumnDef<Coincidencia>[] = [
        {accessorKey: 'productId', header: 'ID ERP'},
        {accessorKey: 'destinationProductId', header: 'ID Publicación'},
        {accessorKey: 'erpId', header: 'ID Artículo ERP'},
        {accessorKey: 'variantId', header: 'ID Variante'},
        {accessorKey: 'isPrimaryVariant', header: 'Principal'},
        {accessorKey: 'safety_stock', header: 'Safety Stock'},
        {accessorKey: 'coeficientPrice', header: 'Coeficiente Precio'},
    ];

    const columnsErrores: MRT_ColumnDef<ErrorDeCruce>[] = [
        {accessorKey: 'publicacion', header: 'Publicación'},
        {accessorKey: 'nombre', header: 'Nombre'},
        {accessorKey: 'skuCargado', header: 'SKU cargado'},
        {accessorKey: 'variante', header: 'N° Variante'},
        {accessorKey: 'skuERP', header: 'Resultado'},
    ];

    return (
        <Box sx={{mt: 4}}>
            <Typography sx={{color: '#555', mb: 1}}>
                {isServiceIdValid
                    ? 'Subí el CSV del ERP con columnas sku, id y articleId — se va a cruzar contra las publicaciones elegidas.'
                    : 'Completá el Service ID arriba para poder subir el archivo.'}
            </Typography>
            <Button variant="contained" component="label" disabled={!isServiceIdValid}>
                Subir CSV
                <input type="file" hidden accept=".csv" onChange={handleCSVUpload}/>
            </Button>

            {coincidencias.length > 0 && (
                <Box sx={{mt: 4, backgroundColor: '#fff', borderRadius: 2, p: 2}}>
                    <Typography
                        variant="h6"
                        sx={{mb: 2, textAlign: 'center', fontWeight: 700, color: '#2e7d32'}}
                    >
                        ✅ Coincidencias
                    </Typography>

                    <Typography sx={{color: '#555', mb: 1}}>
                        Estos valores se aplican a <strong>todas</strong> las coincidencias de la tabla de abajo, no fila por fila.
                    </Typography>
                    <Box sx={{display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap'}}>
                        <TextField
                            label="Safety Stock"
                            type="number"
                            size="small"
                            value={safetyStockGeneral}
                            onChange={(e) => setSafetyStockGeneral(e.target.value)}
                        />
                        <TextField
                            label="Coeficiente Precio"
                            type="number"
                            size="small"
                            value={coeficientePriceGeneral}
                            onChange={(e) => setCoeficientePriceGeneral(e.target.value)}
                        />
                        <Button variant="outlined" onClick={aplicarATodas}>
                            Aplicar a todas
                        </Button>
                    </Box>

                    <MaterialReactTable data={coincidencias} columns={columnsCoincidencias}/>
                    <Box sx={{mt: 2, display: 'flex', justifyContent: 'center'}}>
                        <Button
                            variant="contained"
                            sx={{backgroundColor: '#5d0cff', '&:hover': {backgroundColor: '#4b0ac9'}}}
                            onClick={exportarCoincidencias}
                        >
                            Exportar Coincidencias
                        </Button>
                    </Box>
                </Box>
            )}

            {errores.length > 0 && (
                <Box sx={{mt: 4, backgroundColor: '#fff', borderRadius: 2, p: 2}}>
                    <Typography
                        variant="h6"
                        sx={{mb: 2, textAlign: 'center', fontWeight: 700, color: '#c62828'}}
                    >
                        ⚠️ Errores
                    </Typography>
                    <MaterialReactTable data={errores} columns={columnsErrores}/>
                    <Box sx={{mt: 2, display: 'flex', justifyContent: 'center'}}>
                        <Button variant="contained" color="error" onClick={exportarErrores}>
                            Exportar Errores
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default CSVComparador;