import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MANUAL_SECTIONS } from '@/lib/constants/manual-sections';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function jumpTo(id: string) {
    document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ManualToc() {
    const [activeId, setActiveId] = useState<string>(MANUAL_SECTIONS[0].id);

    useEffect(() => {
        const elements = MANUAL_SECTIONS.map((s) =>
            document.getElementById(s.id),
        ).filter((el): el is HTMLElement => el !== null);
        if (elements.length === 0) return;

        // rootMargin negativo arriba compensa el header fijo; el negativo abajo
        // hace que una sección se marque "activa" apenas su título entra al
        // tercio superior de la pantalla, no recién cuando ocupa todo el viewport.
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((a, b) =>
                    a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
                );
                setActiveId(top.target.id);
            },
            { rootMargin: '-120px 0px -70% 0px', threshold: 0 },
        );
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const activeTitle = MANUAL_SECTIONS.find((s) => s.id === activeId)?.title;

    return (
        <>
            <div className="mb-6 lg:hidden print:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 sm:w-auto"
                        >
                            <List className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                                Índice — {activeTitle}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="max-h-96 w-72 overflow-y-auto"
                    >
                        {MANUAL_SECTIONS.map((s) => (
                            <DropdownMenuItem
                                key={s.id}
                                onClick={() => jumpTo(s.id)}
                                className={cn(
                                    'cursor-pointer',
                                    activeId === s.id &&
                                        'font-medium text-primary',
                                )}
                            >
                                {s.title}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <nav
                aria-label="Índice del manual"
                className="sticky top-28 hidden w-56 shrink-0 self-start lg:block print:hidden"
            >
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Índice
                </p>
                <ul className="max-h-[calc(100vh-9rem)] space-y-1 overflow-y-auto pr-2">
                    {MANUAL_SECTIONS.map((s) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                onClick={() => jumpTo(s.id)}
                                className={cn(
                                    'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                                    activeId === s.id
                                        ? 'bg-primary/10 font-medium text-primary'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )}
                            >
                                {s.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
