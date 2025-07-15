import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { obtenerPublicacionesDesdeArchivo } from '../utils/csvParser';
import { consultarPublicacionPorCanal } from '../services/consultasDispatcher';
import { Publicacion } from '../types/Publicacion';
import CSVComparador from '../components/CSVComparador';

const ConsultasPage = () => {
    const router = useRouter();
    const [canal, setCanal] = useState<string>('');
    const [credenciales, setCredenciales] = useState<Record<string, string>>({});
    const [ids, setIds] = useState<{ id: string }[]>([]);
    const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [serviceId, setServiceId] = useState('');

    useEffect(() => {
        const storedCanal = sessionStorage.getItem('canal');
        const storedFormData = sessionStorage.getItem('formData');
        if (storedCanal && storedFormData) {
            setCanal(storedCanal);
            setCredenciales(JSON.parse(storedFormData));
            setIsReady(true);
        } else {
            router.push('/');
        }
    }, [router]);

    const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const nuevosIds = await obtenerPublicacionesDesdeArchivo(file);
        setIds(nuevosIds);
        setPublicaciones([]);
    };

    const consultarPublicaciones = async () => {
        if (!canal || !credenciales || ids.length === 0) return;

        setCargando(true);
        setPublicaciones([]);

        for (const row of ids) {
            const pub = await consultarPublicacionPorCanal(canal, row, credenciales);
            if (pub) {
                setPublicaciones(prev => [...prev, pub]);
            }
        }

        setCargando(false);
    };

    if (!isReady) return null;

    return (
        <Box
            sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 4,
                p: 4,
                maxWidth: 1000,
                margin: '40px auto',
                boxShadow: 5,
            }}
        >
            <Typography variant="h4" gutterBottom>
                📁 Subir archivo de publicaciones
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
                Para comenzar, subir un archivo en formato <strong>CSV</strong> con los IDs de publicaciones.
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                ✔️ El archivo debe tener una columna llamada <strong>id</strong>
                <br />
                ✔️ Se procesará directamente en el navegador usando <strong>PapaParse</strong>
                <br />
                📖{' '}
                <a
                    href="https://www.papaparse.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Ver documentación oficial
                </a>
            </Typography>

            <Button
                variant="contained"
                component="label"
                sx={{ mb: 3, py: 2, px: 4 }}
            >
                Seleccionar archivo CSV
                <input type="file" hidden accept=".csv" onChange={handleArchivo} />
            </Button>

            {ids.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        🧾 IDs detectados:
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {ids.slice(0, 10).map(({ id }) => (
                            <Box
                                key={id}
                                sx={{
                                    width: { xs: '50%', sm: '33.33%', md: '25%' },
                                    boxSizing: 'border-box',
                                }}
                            >
                                <Typography variant="body2">{id}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {ids.length > 10 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            ...y {ids.length - 10} más
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={consultarPublicaciones}
                        disabled={cargando}
                        sx={{ mt: 2 }}
                    >
                        {cargando ? 'Consultando publicaciones...' : 'Consultar publicaciones ahora'}
                    </Button>

                    {cargando && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Procesando: {publicaciones.length} de {ids.length}
                        </Typography>
                    )}
                </Box>
            )}

            {publicaciones.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        🧾 Vista previa de publicaciones:
                    </Typography>

                    {publicaciones.map((pub) => (
                        <Box
                            key={pub.id}
                            sx={{
                                mb: 3,
                                p: 2,
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: '#fafafa',
                            }}
                        >
                            <Typography><strong>🆔 ID:</strong> {pub.id}</Typography>
                            <Typography><strong>🏷️ Título:</strong> {pub.title}</Typography>

                            {Array.isArray(pub.variants) && pub.variants.length > 0 ? (
                                <>
                                    <Typography><strong>🔀 Variantes:</strong></Typography>
                                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                        {pub.variants.map((variant, idx) => (
                                            <li key={variant.id || idx}>
                                                Variante {idx + 1}: SKU: {variant.sku || 'Sin SKU'}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <Typography><strong>📦 SKU:</strong> {pub.sku || 'Sin SKU'}</Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            )}

            {(publicaciones.length > 0 || cargando) && (
                <>
                    <Divider sx={{ my: 4 }} />
                    <TextField
                        label="🔧 Service ID"
                        variant="outlined"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        helperText="Ingresá el ID del servicio del cliente para la comparación"
                        fullWidth
                        sx={{ mb: 3 }}
                    />
                    <CSVComparador
                        publicaciones={publicaciones}
                        serviceId={serviceId}
                        isServiceIdValid={Boolean(serviceId.trim())}
                    />
                </>
            )}
        </Box>
    );
};

export default ConsultasPage;
