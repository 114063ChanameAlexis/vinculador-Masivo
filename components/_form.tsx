import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { canales, camposPorCanal } from './canales';
import styles from '../styles/FormularioMatcher.module.css';

const FormularioMatcher = () => {
    const [canal, setCanal] = useState('');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar canal seleccionado
        if (!canal) {
            alert('Selecciona un canal.');
            return;
        }

        // Validar campos obligatorios
        const camposRequeridos = camposPorCanal[canal] || [];

        for (const campo of camposRequeridos) {
            const valor = formData[campo.name]?.trim();
            if (!valor) {
                alert(`El campo "${campo.placeholder}" es obligatorio.`);
                return;
            }
        }

        // Guardar datos en sessionStorage
        sessionStorage.setItem('canal', canal);
        sessionStorage.setItem('formData', JSON.stringify(formData));

        const canalesPublicaciones = ['mercadolibre', 'shopify'];
        const destino = canalesPublicaciones.includes(canal)
            ? '/publicaciones'
            : '/consultas';

        router.push(destino);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formulario}>
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
                            className={styles.logo}
                        />
                    </div>
                ))}
            </div>

            {canal &&
                camposPorCanal[canal]?.map((campo) => (
                    <input
                        key={campo.name}
                        type="text"
                        name={campo.name}
                        placeholder={campo.placeholder}
                        onChange={handleChange}
                        className={styles.campoInput}
                    />
                ))}

            <button type="submit" className={styles.botonSubmit}>
                Obtener | Descargar publicaciones
            </button>
        </form>
    );
};

export default FormularioMatcher;
