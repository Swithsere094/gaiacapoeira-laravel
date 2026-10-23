import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Buscador con lupa y botón para limpiar. `label` es lo que lee el lector de
 * pantalla (el placeholder solo no alcanza). `className` va en el contenedor
 * (ancho dentro de la fila: `flex-1`, `sm:max-w-xs`…).
 */
export function SearchInput({
    value,
    onChange,
    label,
    placeholder,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn('relative', className)}>
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={label}
                className="pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label="Limpiar búsqueda"
                >
                    <X aria-hidden="true" className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
