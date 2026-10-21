import { Medal as MedalLucide } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MEDAL_MIN_DAYS, MEDAL_STYLE } from '@/lib/retos';
import type { Medal, MedalCount } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Colores de cada medalla (degradado del metal, borde y el ícono encima). */
const METAL: Record<
    Medal | 'none',
    { light: string; dark: string; rim: string; ink: string }
> = {
    oro: { light: '#FBE7A1', dark: '#B48A2A', rim: '#8C6A1C', ink: '#4A3406' },
    plata: {
        light: '#F4F7FA',
        dark: '#8E9BA8',
        rim: '#66727E',
        ink: '#25303A',
    },
    bronce: {
        light: '#F2BC90',
        dark: '#985A2A',
        rim: '#6E3E19',
        ink: '#371A06',
    },
    none: { light: '#24404F', dark: '#112733', rim: '#1E4050', ink: '#4F6875' },
};

/**
 * Medalla dibujada: disco metálico con cinta y el ícono del reto adentro.
 * Sin medalla (`null`) se ve apagada: "por ganar". `size` es el diámetro en px.
 */
export function MedalBadge({
    medal,
    icon: Icon = MedalLucide,
    size = 40,
    shine = false,
    className,
}: {
    medal: Medal | null;
    icon?: LucideIcon;
    size?: number;
    /** Un destello que cruza la medalla cada tanto. */
    shine?: boolean;
    className?: string;
}) {
    const m = METAL[medal ?? 'none'];
    const ribbon = medal ? 'var(--secondary)' : 'var(--muted)';
    const stripe = medal ? 'var(--primary)' : 'var(--border)';

    return (
        <span
            role="img"
            aria-label={
                medal
                    ? `Medalla de ${MEDAL_STYLE[medal].label.toLowerCase()}`
                    : 'Medalla por ganar'
            }
            className={cn('relative inline-block shrink-0', className)}
            style={{ width: size, height: size * 1.3 }}
        >
            {/* Cinta */}
            <svg
                aria-hidden="true"
                viewBox="0 0 40 24"
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{ width: size * 0.72, height: size * 0.45 }}
            >
                <polygon points="4,0 17,0 24,24 11,24" fill={ribbon} />
                <polygon points="23,0 36,0 29,24 16,24" fill={ribbon} />
                <polygon points="9,0 12,0 19,24 16,24" fill={stripe} />
                <polygon points="28,0 31,0 24,24 21,24" fill={stripe} />
            </svg>
            {/* Disco */}
            <span
                className="absolute bottom-0 left-0 flex items-center justify-center overflow-hidden rounded-full"
                style={{
                    width: size,
                    height: size,
                    color: m.ink,
                    background: `radial-gradient(circle at 32% 28%, ${m.light}, ${m.dark} 75%)`,
                    boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.06)}px ${m.rim}, inset 0 0 0 ${Math.max(2.5, size * 0.11)}px ${m.light}55, 0 2px 6px rgb(0 0 0 / 0.45)`,
                }}
            >
                <Icon
                    aria-hidden="true"
                    style={{ width: size * 0.46, height: size * 0.46 }}
                    strokeWidth={2.25}
                />
                {shine && medal && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/45 blur-[2px]"
                    />
                )}
            </span>
        </span>
    );
}

/** Medalla chica sin ícono (contadores, listas). */
export function MedalIcon({
    medal,
    size = 20,
    className,
}: {
    medal: Medal;
    size?: number;
    className?: string;
}) {
    return <MedalBadge medal={medal} size={size} className={className} />;
}

/** Medallas ganadas de un reto: "🥇×2 🥈×1" (solo las que tiene). */
export function MedalCounts({
    medals,
    className,
}: {
    medals: MedalCount;
    className?: string;
}) {
    const earned = MEDAL_MIN_DAYS.filter(([medal]) => medals[medal] > 0);

    if (earned.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-3', className)}>
            {earned.map(([medal]) => (
                <span
                    key={medal}
                    className="flex items-end gap-1 text-sm font-medium text-foreground"
                    title={`${medals[medal]} de ${MEDAL_STYLE[medal].label.toLowerCase()}`}
                >
                    <MedalIcon medal={medal} size={16} />×{medals[medal]}
                </span>
            ))}
        </div>
    );
}
