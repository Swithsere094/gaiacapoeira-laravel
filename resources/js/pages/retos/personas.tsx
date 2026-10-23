import { Link } from '@inertiajs/react';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { RetosLayout } from '@/components/retos/retos-layout';
import { SearchInput } from '@/components/search-input';

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
        <RetosLayout
            title="Personas"
            width="narrow"
            pendingReviews={pending_reviews}
            className="space-y-6"
            description={
                <>
                    Elige a alguien para ver su árbol y marcar a mano las
                    habilidades que ya domina.
                </>
            }
        >
            <SearchInput
                value={query}
                onChange={setQuery}
                label="Buscar persona"
                placeholder="Buscar por nombre, apodo o usuario"
            />

            {shown.length === 0 ? (
                <EmptyState icon={Search}>
                    No hay nadie con ese nombre.
                </EmptyState>
            ) : (
                <ul className="divide-y divide-border panel">
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
        </RetosLayout>
    );
}
