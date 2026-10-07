import { Link } from '@inertiajs/react';

export function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/" className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                                <span className="font-serif text-lg font-bold text-primary-foreground">
                                    A
                                </span>
                            </div>
                            <span className="font-serif text-xl font-bold text-foreground">
                                Areia no Mar
                            </span>
                        </Link>
                        <p className="max-w-md text-muted-foreground">
                            Preservando la tradición y cultura de la capoeira a
                            través de nuestra comunidad. Un espacio digital para
                            aprender, compartir y crecer juntos.
                        </p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-serif font-bold text-foreground">
                            Secciones
                        </h2>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/galera"
                                    className="text-muted-foreground transition-colors hover:text-primary"
                                >
                                    Galera
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/politica"
                                    className="text-muted-foreground transition-colors hover:text-primary"
                                >
                                    Política
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/canciones"
                                    className="text-muted-foreground transition-colors hover:text-primary"
                                >
                                    Sabiá cantou
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="mb-4 font-serif font-bold text-foreground">
                            Comunidad
                        </h2>
                        <ul className="space-y-2">
                            <li>
                                <span className="text-muted-foreground">
                                    Grupo de Capoeira
                                </span>
                            </li>
                            <li>
                                <span className="text-muted-foreground">
                                    Clases y Entrenamientos
                                </span>
                            </li>
                            <li>
                                <span className="text-muted-foreground">
                                    Eventos y Batizados
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Areia no Mar. Todos los
                        derechos reservados.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Hecho con amor por la comunidad
                    </p>
                </div>
            </div>
        </footer>
    );
}
