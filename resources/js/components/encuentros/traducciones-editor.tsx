import { Languages } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { PanelTitle } from '@/components/headings';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LOCALE_NAMES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Traducciones } from '@/types/encuentros';

type Destino = 'pt' | 'en';

/** Algo traducible del formulario: sus campos en español + sus traducciones. */
type Traducible = { traducciones: Traducciones };

/** Texto en español de `campo` (o '' si no hay). */
const textoDe = (item: Traducible, campo: string): string => {
    const value = (item as unknown as Record<string, unknown>)[campo];

    return typeof value === 'string' ? value : '';
};

/** Copia de `item` con la traducción de `campo` a `locale` cambiada. */
function conTraduccion<T extends Traducible>(
    item: T,
    locale: Destino,
    campo: string,
    texto: string,
): T {
    return {
        ...item,
        traducciones: {
            ...item.traducciones,
            [locale]: { ...item.traducciones?.[locale], [campo]: texto },
        },
    };
}

interface Campo {
    campo: string;
    label: string;
    largo?: boolean;
    max: number;
}

/**
 * Traducciones opcionales al portugués y al inglés de lo que escribe el
 * organizador (nombre, descripción, datos de pago, opciones de precio,
 * programación y reseñas de invitados). Lo que no se traduce se muestra en
 * español en la página pública.
 */
export function TraduccionesEditor<
    E extends Traducible,
    P extends Traducible,
    A extends Traducible,
    I extends Traducible,
>({
    encuentro,
    precios,
    actividades,
    invitados,
    onEncuentro,
    onPrecios,
    onActividades,
    onInvitados,
}: {
    encuentro: E;
    precios: P[];
    actividades: A[];
    invitados: I[];
    onEncuentro: (traducciones: Traducciones) => void;
    onPrecios: (precios: P[]) => void;
    onActividades: (actividades: A[]) => void;
    onInvitados: (invitados: I[]) => void;
}) {
    const [locale, setLocale] = useState<Destino>('pt');

    /** Campos de un item que tienen texto en español. */
    const campos = (item: Traducible, lista: Campo[]) =>
        lista.filter((c) => textoDe(item, c.campo).trim() !== '');

    const fila = (
        item: Traducible,
        c: Campo,
        onChange: (texto: string) => void,
        key: string,
    ) => {
        const original = textoDe(item, c.campo);
        const valor = item.traducciones?.[locale]?.[c.campo] ?? '';
        const props = {
            'aria-label': `${c.label} en ${LOCALE_NAMES[locale]}`,
            value: valor,
            maxLength: c.max,
            placeholder: original,
        };

        return (
            <div key={key} className="space-y-1">
                <p className="text-xs text-muted-foreground">
                    {c.label}:{' '}
                    <span className="text-foreground/80 italic">
                        {original.length > 120
                            ? `${original.slice(0, 120)}…`
                            : original}
                    </span>
                </p>
                {c.largo ? (
                    <Textarea
                        {...props}
                        rows={3}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <Input
                        {...props}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            </div>
        );
    };

    const lista = <T extends Traducible>(
        titulo: string,
        items: T[],
        definicion: Campo[],
        onChange: (items: T[]) => void,
    ): ReactNode => {
        const filas = items.flatMap((item, i) =>
            campos(item, definicion).map((c) =>
                fila(
                    item,
                    c,
                    (texto) =>
                        onChange(
                            items.map((it, idx) =>
                                idx === i
                                    ? conTraduccion(it, locale, c.campo, texto)
                                    : it,
                            ),
                        ),
                    `${i}-${c.campo}`,
                ),
            ),
        );

        return filas.length > 0 ? <Grupo titulo={titulo}>{filas}</Grupo> : null;
    };

    return (
        <section className="space-y-4 panel p-5">
            <div>
                <PanelTitle icon={Languages}>
                    Traducciones (opcional)
                </PanelTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                    La página pública se puede ver en español, portugués e
                    inglés. Lo que no traduzcas se muestra en español.
                </p>
            </div>

            <div role="tablist" aria-label="Idioma" className="flex gap-2">
                {(['pt', 'en'] as const).map((l) => (
                    <button
                        key={l}
                        type="button"
                        role="tab"
                        aria-selected={l === locale}
                        onClick={() => setLocale(l)}
                        className={cn(
                            'rounded-full border px-4 py-1.5 text-sm transition-colors',
                            l === locale
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {LOCALE_NAMES[l]}
                    </button>
                ))}
            </div>

            <div role="tabpanel" className="space-y-5">
                <Grupo titulo="Encuentro">
                    {campos(encuentro, [
                        { campo: 'nombre', label: 'Nombre', max: 120 },
                        {
                            campo: 'descripcion',
                            label: 'Descripción',
                            largo: true,
                            max: 5000,
                        },
                        {
                            campo: 'info_pago',
                            label: 'Datos de pago',
                            largo: true,
                            max: 2000,
                        },
                        {
                            campo: 'mensaje_final',
                            label: 'Mensaje de cierre',
                            largo: true,
                            max: 3000,
                        },
                    ]).map((c) =>
                        fila(
                            encuentro,
                            c,
                            (texto) =>
                                onEncuentro(
                                    conTraduccion(
                                        encuentro,
                                        locale,
                                        c.campo,
                                        texto,
                                    ).traducciones,
                                ),
                            c.campo,
                        ),
                    )}
                </Grupo>
                {lista(
                    'Opciones de inscripción',
                    precios,
                    [
                        { campo: 'nombre', label: 'Opción', max: 120 },
                        { campo: 'descripcion', label: 'Detalle', max: 200 },
                    ],
                    onPrecios,
                )}
                {lista(
                    'Programación',
                    actividades,
                    [
                        { campo: 'titulo', label: 'Actividad', max: 150 },
                        { campo: 'descripcion', label: 'Detalle', max: 300 },
                    ],
                    onActividades,
                )}
                {lista(
                    'Invitados',
                    invitados,
                    [
                        {
                            campo: 'bio',
                            label: 'Reseña',
                            largo: true,
                            max: 1500,
                        },
                    ],
                    onInvitados,
                )}
            </div>
        </section>
    );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-primary">{titulo}</p>
            {children}
        </div>
    );
}
