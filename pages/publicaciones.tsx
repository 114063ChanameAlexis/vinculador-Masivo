    import React, { useEffect, useState, useMemo } from 'react';
    import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
    import { Box, Button, CircularProgress, Collapse, MenuItem, Select, Typography } from '@mui/material';
    import { TextField } from '@mui/material';
    import Papa from 'papaparse';
    import * as XLSX from 'xlsx';
    import { Publicacion } from '../types/Publicacion';
    import CSVComparador from '../components/CSVComparador';

    const Publicaciones = () => {
        const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
        const [cruzarTodo, setCruzarTodo] = useState(false);
        const [serviceId, setServiceId] = useState('');
        const [tablaVisible, setTablaVisible] = useState(true);

        // Exclusion de publicaciones ya vinculadas (a partir de un Coincidencias.csv viejo, u otro archivo)
        const [vinculadasColumnas, setVinculadasColumnas] = useState<string[]>([]);
        const [vinculadasFilas, setVinculadasFilas] = useState<Record<string, string>[]>([]);
        const [columnaIdVinculado, setColumnaIdVinculado] = useState('');
        const [exclusionActiva, setExclusionActiva] = useState(false);

        useEffect(() => {
            const canal = sessionStorage.getItem('canal');
            const rawForm = sessionStorage.getItem('formData');

            if (!canal || !rawForm) {
                setError('Faltan datos del canal o formulario.');
                setLoading(false);
                return;
            }

            let formData: Record<string, unknown> = {};
            try {
                formData = JSON.parse(rawForm);
            } catch {
                setError('Error al parsear los datos del formulario.');
                setLoading(false);
                return;
            }

            const fetchData = async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/publicaciones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ canal, ...formData }),
                    });

                    if (!res.ok) throw new Error('Error al consultar la API');
                    const data = await res.json();
                    setPublicaciones(data);
                } catch (err) {
                    setError('Error al obtener publicaciones');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };

            void fetchData();
        }, []);

        const aplicarArchivoVinculadas = (filas: Record<string, string>[], columnas: string[]) => {
            setVinculadasFilas(filas);
            setVinculadasColumnas(columnas);
            setColumnaIdVinculado('');
            setExclusionActiva(false);
        };

        const handleArchivoVinculadasUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const esExcel = /\.xlsx?$/i.test(file.name);

            if (esExcel) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
                    const filas = XLSX.utils.sheet_to_json<Record<string, string>>(primeraHoja, { defval: '' });
                    const columnas = filas.length ? Object.keys(filas[0]) : [];
                    aplicarArchivoVinculadas(filas, columnas);
                };
                reader.readAsArrayBuffer(file);
            } else {
                Papa.parse<Record<string, string>>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        aplicarArchivoVinculadas(results.data, results.meta.fields || []);
                    },
                });
            }

            e.target.value = '';
        };

        const idsYaVinculados = useMemo(() => {
            if (!columnaIdVinculado) return new Set<string>();
            return new Set(
                vinculadasFilas
                    .map((fila) => fila[columnaIdVinculado]?.trim())
                    .filter((valor): valor is string => Boolean(valor))
            );
        }, [vinculadasFilas, columnaIdVinculado]);

        const publicacionesVisibles = useMemo(() => {
            if (!exclusionActiva || idsYaVinculados.size === 0) return publicaciones;
            return publicaciones.filter((p) => !idsYaVinculados.has(p.id.trim()));
        }, [publicaciones, exclusionActiva, idsYaVinculados]);

        // Columnas de la tabla principal
        const columns = useMemo<MRT_ColumnDef<Publicacion>[]>(() => [
            { accessorKey: 'id', header: 'ID Publicación' },
            { accessorKey: 'title', header: 'Título' },
            {
                accessorKey: 'variantId',
                header: 'Variante ID',
                Cell: ({ row }) => {
                    const variants = row.original.variants;
                    return variants?.length ? variants.map(v => v.id).join(' | ') : '-';
                },
            },
            {
                accessorKey: 'sku',
                header: 'SKU',
                Cell: ({ row }) => {
                    const variants = row.original.variants;
                    return variants?.length
                        ? variants.map(v => v.sku).join(' | ')
                        : row.original.sku || 'Sin SKU';
                },
            },
        ], []);

        // Publicaciones seleccionadas o todas (según modo), sobre lo que quede visible tras la exclusión
        const publicacionesParaCruzar = useMemo(() => {
            if (cruzarTodo) return publicacionesVisibles;
            return publicacionesVisibles.filter((_, index) => rowSelection[index]);
        }, [cruzarTodo, publicacionesVisibles, rowSelection]);

        if (loading) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '60vh',
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Obteniendo publicaciones...</Typography>
                </Box>
            );
        }
        if (error) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '60vh',
                    }}
                >
                    <Typography variant="h6">
                        {error}
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ padding: 2 }}>
                <Typography variant="overline" sx={{ color: '#1a1a2e', fontWeight: 700, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>
                    Paso 1 · Service ID para la vinculación
                </Typography>
                <Box sx={{ backgroundColor: '#fff', borderRadius: 2, p: 2, mb: 2 }}>
                    <TextField
                        label="Service ID"
                        variant="outlined"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        helperText="Se usa para generar el CSV de vinculación al final del proceso."
                        fullWidth
                    />
                </Box>

                <Typography variant="overline" sx={{ color: '#1a1a2e', fontWeight: 700, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>
                    Paso 2 · (Opcional) excluir publicaciones ya vinculadas antes
                </Typography>
                <Box sx={{ backgroundColor: '#fff', borderRadius: 2, p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ color: '#555', width: '100%' }}>
                        Si ya cruzaste antes, subí ese archivo (por ejemplo un <code>Coincidencias.csv</code> anterior) para no volver a vincular las mismas publicaciones.
                    </Typography>
                    <Button variant="outlined" component="label">
                        Subir ya vinculadas (CSV/XLSX)
                        <input
                            type="file"
                            hidden
                            accept=".csv,.xlsx,.xls"
                            onChange={handleArchivoVinculadasUpload}
                        />
                    </Button>

                    {vinculadasColumnas.length > 0 && (
                        <>
                            <Select
                                size="small"
                                displayEmpty
                                value={columnaIdVinculado}
                                onChange={(e) => setColumnaIdVinculado(e.target.value)}
                                sx={{ minWidth: 260 }}
                            >
                                <MenuItem value="" disabled>
                                    Elegí la columna con el ID de publicación
                                </MenuItem>
                                {vinculadasColumnas.map((col) => (
                                    <MenuItem key={col} value={col}>
                                        {col}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Button
                                variant="contained"
                                sx={{ backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                                onClick={() => setExclusionActiva(true)}
                                disabled={!columnaIdVinculado}
                            >
                                Excluir ya vinculadas
                            </Button>

                            {exclusionActiva && (
                                <Button variant="text" onClick={() => setExclusionActiva(false)}>
                                    Quitar exclusión
                                </Button>
                            )}
                        </>
                    )}

                    {exclusionActiva && (
                        <Typography sx={{ color: '#555' }}>
                            Mostrando {publicacionesVisibles.length} de {publicaciones.length} (excluidas: {publicaciones.length - publicacionesVisibles.length})
                        </Typography>
                    )}
                </Box>

                <Typography variant="overline" sx={{ color: '#1a1a2e', fontWeight: 700, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>
                    Paso 3 · Elegí qué publicaciones vas a cruzar
                </Typography>
                <Button
                    variant="text"
                    onClick={() => setTablaVisible((v) => !v)}
                    sx={{ mb: 1, display: 'block' }}
                >
                    {tablaVisible ? 'Ocultar publicaciones ▲' : 'Ver publicaciones ▼'}
                </Button>

                <Collapse in={tablaVisible}>
                    <MaterialReactTable
                        columns={columns}
                        data={publicacionesVisibles}
                        enableRowSelection
                        enableGlobalFilter
                        enableColumnFilters
                        enablePagination
                        enableSorting
                        onRowSelectionChange={setRowSelection}
                        state={{ rowSelection }}
                        initialState={{
                            showGlobalFilter: true,
                            pagination: { pageIndex: 0, pageSize: 5 },
                            density: 'compact',
                        }}
                    />
                </Collapse>

                {/* Botones para elegir el modo de cruce */}
                <Typography sx={{ color: '#1a1a2e', fontWeight: 600, mt: 1, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>
                    Tildá filas en la tabla y usá &quot;Cruzar seleccionadas&quot;, o &quot;Cruzar todas&quot; para trabajar con todo el listado.
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                        onClick={() => setCruzarTodo(false)}
                        disabled={Object.keys(rowSelection).length === 0}
                    >
                        Cruzar seleccionadas ({Object.keys(rowSelection).length})
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                        onClick={() => setCruzarTodo(true)}
                        disabled={publicacionesVisibles.length === 0}
                    >
                        Cruzar todas ({publicacionesVisibles.length})
                    </Button>
                </Box>

                {/* Componente para subir y cruzar CSV */}
                {publicacionesParaCruzar.length > 0 && (
                    <>
                        <Typography variant="overline" sx={{ display: 'block', mt: 3, color: '#1a1a2e', fontWeight: 700, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>
                            Paso 4 · Subí el archivo del ERP para cruzar por SKU
                        </Typography>
                        <CSVComparador
                            publicaciones={publicacionesParaCruzar}
                            serviceId={serviceId}
                            isServiceIdValid={Boolean(serviceId.trim())}
                            coeficientesMap={{}}
                            onResultados={() => setTablaVisible(false)}
                        />
                    </>
                )}
            </Box>
        );
    };

    export default Publicaciones;