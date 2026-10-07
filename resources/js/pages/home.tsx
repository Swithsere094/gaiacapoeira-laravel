import { Head } from '@inertiajs/react';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Navigation } from '@/components/navigation';

export default function Home() {
    return (
        <main className="min-h-screen">
            <Head title="Repositorio del Grupo" />
            <Navigation />
            <Hero />
            <Footer />
        </main>
    );
}
