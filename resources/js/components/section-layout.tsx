import { Head } from '@inertiajs/react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { type ReactNode } from 'react';

interface SectionLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export function SectionLayout({
    children,
    title,
    description,
}: SectionLayoutProps) {
    return (
        <main className="min-h-screen">
            <Head title={title} />
            <Navigation />
            <div className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 pt-12">
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {title}
                        </h1>
                        <p className="max-w-2xl text-xl text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
            <Footer />
        </main>
    );
}
