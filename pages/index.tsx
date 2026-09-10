import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@mui/material';
import FormularioMatcher from '../components/FormularioMatcher';

export default function Home() {
    return (
        <>
            <Head>
                <title>Vinculador de Productos</title>
                <link
                    rel="icon"
                    href="https://integrador.grow2on.com/assets/grow2on-BALm5jaq.svg"
                />
            </Head>

            <main style={{ textAlign: 'center', padding: '2rem' }}>

                <img
                    src="https://integrador.grow2on.com/assets/grow2on-BALm5jaq.svg"
                    alt="Grow2on Logo"
                    style={{ height: '40px', marginBottom: '1rem' }}
                />

                <FormularioMatcher />

                <Link href="/grow2on-productos" passHref>
                    <Button
                        variant="contained"
                        sx={{ mt: 3, backgroundColor: '#5d0cff', '&:hover': { backgroundColor: '#4b0ac9' } }}
                    >
                        Ver catálogo Grow2on
                    </Button>
                </Link>
            </main>
        </>
    );
}
