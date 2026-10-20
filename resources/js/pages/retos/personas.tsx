import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { RetosHeader } from '@/components/retos/retos-header';
import { Input } from '@/components/ui/input';

interface Person {
    id: string;
    name: string;
    apodo: string | null;
    username: string;
    role_name: string;
    dominated: number;
}

/** Sin tildes ni mayúsculas, para buscar. */
function plain(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

export default function PersonasPage({
    people,
    total,
    pending_reviews,
}: {
    people: Person[];
    total: number;
    pending_reviews: number;
}) {
    const [query, setQuery] = useState('');
    const q = plain(query.trim());
    const shown = q
        ? people.filter((p) =>
              plain(`${p.name} ${p.apodo ?? ''} ${p.username}`).includes(q),
          )
        : people;

    return (
        <div className="min-h-screen bg-background">
            <Head title="Personas" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <RetosHeader
                        title="Personas"
                        pendingReviews={pending_reviews}
                    >
                        Elige a alguien para ver su árbol y marcar a mano las
                        habilidades que ya domina.
                    </RetosHeader>

                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, apodo o usuario"
                            className="pl-9"
                            aria-label="Buscar persona"
                        />
                    </div>

                    {shown.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                            No hay nadie con ese nombre.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                            {shown.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        href={`/retos/personas/${p.id}`}
                                        className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">
                                                {p.name}
                                                {p.apodo && (
                                                    <span className="font-normal text-muted-foreground italic">
                                                        {' '}
                                                        «{p.apodo}»
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                @{p.username} · {p.role_name}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                            {p.dominated} de {total}
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
