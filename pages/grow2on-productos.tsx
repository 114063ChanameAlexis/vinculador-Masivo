import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Grow2onProducto } from '../types/Grow2onProducto';

const Grow2onProductos = () => {
    const [token, setToken] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [productos, setProductos] = useState<Grow2onProducto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [csvColumnas, setCsvColumnas] = useState<string[]>([]);
    const [csvFilas, setCsvFilas] = useState<Record<string, string>[]>([]);
    const [columnaSku, setColumnaSku] = useState('');
    const [filtroActivo, setFiltroActivo] = useState(false);

    const buscarProductos = async () => {
        if (!token.trim() || !serviceId.trim()) {
            setError('Completá el token y el Service ID.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/grow2on/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, serviceId }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Error al consultar productos');
            }

            const data: Grow2onProducto[] = await res.json();
            setProductos(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error inesperado');
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    const aplicarArchivo = (filas: Record<string, string>[], columnas: string[]) => {
        setCsvFilas(filas);
        setCsvColumnas(columnas);
        setColumnaSku('');
        setFiltroActivo(false);
    };

    const handleArchivoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const esExcel = /\.xlsx?$/i.test(file.name);

        if (esExcel) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
                const filas = XLSX.utils.sheet_to_json<Record<string, string>>(primeraHoja, {
                    defval: '',
                });
                const columnas = filas.length ? Object.keys(filas[0]) : [];

                aplicarArchivo(filas, columnas);
            };
            reader.readAsArrayBuffer(file);
        } else {
            Papa.parse<Record<string, string>>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    aplicarArchivo(results.data, results.meta.fields || []);
                },
            });
        }

        e.target.value = '';
    };

    const skusDelCsv = useMemo(() => {
        if (!columnaSku) return new Set<string>();
        return new Set(
            csvFilas
                .map((fila) => fila[columnaSku]?.trim())
                .filter((valor): valor is string => Boolean(valor))
        );
    }, [csvFilas, columnaSku]);

    const productosFiltrados = useMemo(() => {
        if (!filtroActivo || skusDelCsv.size === 0) return productos;
        return productos.filter((p) => p.sku && skusDelCsv.has(p.sku.trim()));
    }, [productos, filtroActivo, skusDelCsv]);

    const exportarParaVincular = () => {
        // Formato esperado por CSVComparador.tsx (interface CSVRow): sku, id, articleId
        // CSVComparador hace match.id.slice(2) al leer "id", así que anteponemos
        // 2 caracteres de relleno para que el UUID de productId llegue intacto.
        // Además se sacan los guiones, igual que hace CSVComparador con el campo "id"
        // de la relación (crypto.randomUUID().replace(/-/g, '')).
        const filas = productosFiltrados.map((p) => ({
            sku: p.sku,
            id: `00${p.productId.replace(/-/g, '')}`,
            articleId: p.articleId,
        }));

        const csv = Papa.unparse(filas);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'productos-para-vincular.csv');
    };

    const columns = useMemo<MRT_ColumnDef<Grow2onProducto>[]>(() => [
        { accessorKey: 'articleId', header: 'ID Artículo' },
        { accessorKey: 'sku', header: 'SKU' },
        { accessorKey: 'name', header: 'Nombre' },
        { accessorKey: 'categories', header: 'Categoría' },
        { accessorKey: 'brand', header: 'Marca' },
        {
            accessorFn: (row) => row.serviceInfo?.price ?? '',
            id: 'price',
            header: 'Precio',
        },
        {
            accessorFn: (row) => row.serviceInfo?.stock ?? '',
            id: 'stock',
            header: 'Stock',
        },
    ], []);

    return (
        <>
            <Head>
                <title>Productos Grow2on</title>
            </Head>

            <Box sx={{ padding: 2, maxWidth: 1000, margin: 'auto' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Catálogo Grow2on
                </Typography>

                <Box sx={{ backgroundColor: '#fff', borderRadius: 2, p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Token"
                        variant="outlined"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                    />
                    <TextField
                        label="Service ID"
                        variant="outlined"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                    />
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                        onClick={buscarProductos}
                        disabled={loading}
                    >
                        {loading ? 'Buscando...' : 'Buscar productos'}
                    </Button>
                </Box>

                {productos.length > 0 && (
                    <Box sx={{ backgroundColor: '#fff', borderRadius: 2, p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button variant="outlined" component="label">
                            Subir CSV o XLSX
                            <input
                                type="file"
                                hidden
                                accept=".csv,.xlsx,.xls"
                                onChange={handleArchivoUpload}
                            />
                        </Button>

                        {csvColumnas.length > 0 && (
                            <>
                                <Select
                                    size="small"
                                    displayEmpty
                                    value={columnaSku}
                                    onChange={(e) => setColumnaSku(e.target.value)}
                                    sx={{ minWidth: 220 }}
                                >
                                    <MenuItem value="" disabled>
                                        Elegí la columna SKU
                                    </MenuItem>
                                    {csvColumnas.map((col) => (
                                        <MenuItem key={col} value={col}>
                                            {col}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Button
                                    variant="contained"
                                    sx={{ backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                                    onClick={() => setFiltroActivo(true)}
                                    disabled={!columnaSku}
                                >
                                    Aplicar filtro
                                </Button>

                                {filtroActivo && (
                                    <Button variant="text" onClick={() => setFiltroActivo(false)}>
                                        Quitar filtro
                                    </Button>
                                )}
                            </>
                        )}

                        {filtroActivo && (
                            <>
                                <Typography sx={{ color: '#555' }}>
                                    Mostrando {productosFiltrados.length} de {productos.length} (SKUs del CSV: {skusDelCsv.size})
                                </Typography>

                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={exportarParaVincular}
                                    disabled={productosFiltrados.length === 0}
                                >
                                    Exportar CSV para vincular
                                </Button>
                            </>
                        )}
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Typography sx={{ color: '#c62828', mb: 2, textAlign: 'center' }}>
                        {error}
                    </Typography>
                )}

                {productos.length > 0 && (
                    <MaterialReactTable
                        columns={columns}
                        data={productosFiltrados}
                        enableGlobalFilter
                        enableColumnFilters
                        enablePagination
                        enableSorting
                        initialState={{
                            showGlobalFilter: true,
                            pagination: { pageIndex: 0, pageSize: 10 },
                            density: 'compact',
                        }}
                    />
                )}
            </Box>
        </>
    );
};

export default Grow2onProductos;
