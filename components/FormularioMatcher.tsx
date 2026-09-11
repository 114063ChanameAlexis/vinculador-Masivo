import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Snackbar, Alert, type AlertColor } from '@mui/material';
import { canales, camposPorCanal } from '../lib/canales';
import styles from '../styles/FormularioMatcher.module.css';

const CANALES_PUBLICACIONES = ['tiendanube', 'shopify', 'woocommerce', 'mercadolibre'];

const FormularioMatcher = () => {
    const [canal, setCanal] = useState('');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notificacion, setNotificacion] = useState<{ mensaje: string; severidad: AlertColor } | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canal) {
            setNotificacion({ mensaje: 'Selecciona un canal.', severidad: 'warning' });
            return;
        }

        const camposRequeridos = camposPorCanal[canal] || [];
        for (const campo of camposRequeridos) {
            const valor = formData[campo.name]?.trim();
            if (!valor) {
                setNotificacion({ mensaje: `El campo "${campo.placeholder}" es obligatorio.`, severidad: 'warning' });
                return;
            }
        }

        // Evitar múltiples envíos
        setIsSubmitting(true);

        // 🔐 Validar credenciales con tu backend
        const res = await fetch('/api/validar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ canal, ...formData }),
        });

        const result = await res.json();

        if (!result.valido) {
            setNotificacion({ mensaje: `Error: ${result.mensaje}`, severidad: 'error' });
            setIsSubmitting(false);
            return;
        }

        setNotificacion({
            mensaje: `Canal conectado: ${result.datos?.nickname || result.datos?.name || 'OK'}`,
            severidad: 'success',
        });

        const formDataConId =
            canal === 'mercadolibre' && result.datos?.id
                ? { ...formData, userId: String(result.datos.id) }
                : formData;

        sessionStorage.setItem('canal', canal);
        sessionStorage.setItem('formData', JSON.stringify(formDataConId));

        const destino = CANALES_PUBLICACIONES.includes(canal)
            ? '/publicaciones'
            : '/consultas';

        // Pequeña pausa para que se alcance a ver la notificación antes de redirigir
        setTimeout(() => {
            void router.push(destino);
        }, 1000);
    };

    return (
        <>
        <form onSubmit={handleSubmit} className={styles.formulario}>
            <p className={styles.pasoLabel}>Paso 1 · Elegí el canal que querés vincular</p>
            <div className={styles.selectorCanales}>
                {canales.map((canalItem) => (
                    <div
                        key={canalItem.id}
                        onClick={() => setCanal(canalItem.id)}
                        className={`${styles.selectorCanal} ${
                            canal === canalItem.id ? styles.activo : ''
                        }`}
                    >
                        <img
                            src={canalItem.logo}
                            alt={canalItem.nombre}
                        />
                    </div>
                ))}
            </div>

            {canal && (
                <p className={styles.infoCanal}>
                    {CANALES_PUBLICACIONES.includes(canal)
                        ? 'Vas a ver el listado completo de tus publicaciones para elegir cuáles cruzar con tu ERP.'
                        : 'Vas a consultar publicaciones puntuales por ID.'}
                </p>
            )}

            {canal && (
                <>
                    <p className={styles.pasoLabel}>Paso 2 · Completá las credenciales</p>
                    {camposPorCanal[canal]?.map((campo) => (
                        <input
                            key={campo.name}
                            type="text"
                            name={campo.name}
                            placeholder={campo.placeholder}
                            onChange={handleChange}
                            className={styles.campoInput}
                        />
                    ))}
                </>
            )}

            <button
                type="submit"
                className={styles.botonSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Validando y conectando...' : 'Conectar y continuar'}
            </button>
        </form>

        <Snackbar
            open={notificacion !== null}
            autoHideDuration={4000}
            onClose={() => setNotificacion(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            {notificacion ? (
                <Alert severity={notificacion.severidad} onClose={() => setNotificacion(null)}>
                    {notificacion.mensaje}
                </Alert>
            ) : undefined}
        </Snackbar>
        </>
    );
};

export default FormularioMatcher;
