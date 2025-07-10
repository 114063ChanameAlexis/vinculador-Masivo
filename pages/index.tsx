import Head from 'next/head';
import FormularioMatcher from '../components/_form';

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
            </main>
        </>
    );
}
