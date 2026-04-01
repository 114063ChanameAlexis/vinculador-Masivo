    import React, { useEffect, useState, useMemo } from 'react';
    import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
    import { Box, Button, CircularProgress, Typography } from '@mui/material';
    import { TextField } from '@mui/material';
    import { Publicacion } from '../types/Publicacion';
    import CSVComparador from '../components/CSVComparador';

    const Publicaciones = () => {
        const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
        const [cruzarTodo, setCruzarTodo] = useState(false);
        const [serviceId, setServiceId] = useState('');

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

        // Publicaciones seleccionadas o todas (según modo)
        const publicacionesParaCruzar = useMemo(() => {
            if (cruzarTodo) return publicaciones;
            return publicaciones.filter((_, index) => rowSelection[index]);
        }, [cruzarTodo, publicaciones, rowSelection]);

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
                <MaterialReactTable
                    columns={columns}
                    data={publicaciones}
                    enableRowSelection
                    enableGlobalFilter
                    enableColumnFilters
                    enablePagination
                    enableSorting
                    onRowSelectionChange={setRowSelection}
                    state={{ rowSelection }}
                    initialState={{
                        showGlobalFilter: true,
                        pagination: { pageIndex: 0, pageSize: 10 },
                    }}
                />

                {/* Botones para elegir el modo de cruce */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setCruzarTodo(false)}
                        disabled={Object.keys(rowSelection).length === 0}
                    >
                        Cruzar seleccionadas ({Object.keys(rowSelection).length})
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setCruzarTodo(true)}
                        disabled={publicaciones.length === 0}
                    >
                        Cruzar todas ({publicaciones.length})
                    </Button>
                </Box>

                {/* Componente para subir y cruzar CSV */}
                {publicacionesParaCruzar.length > 0 && (
                    <>
                        <TextField
                            label="Service ID"
                            variant="outlined"
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            sx={{ mt: 4, mb: 2 }}
                            fullWidth
                        />

                        <CSVComparador
                            publicaciones={publicacionesParaCruzar}
                            serviceId={serviceId}
                            isServiceIdValid={Boolean(serviceId.trim())}
                            coeficientesMap={{}}
                        />
                    </>
                )}
            </Box>
        );
    };

    export default Publicaciones;