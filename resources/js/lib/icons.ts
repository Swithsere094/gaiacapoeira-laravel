/**
 * Íconos de las habilidades y de las categorías de retos sueltos, para
 * reconocerlos de un vistazo.
 *
 * Las habilidades guardan el nombre del ícono en `habilidades.icon` (lo
 * asigna la migración add_icon_to_habilidades; más adelante, el editor de
 * contenido). Solo valen los nombres de esta lista: uno desconocido o vacío
 * usa el genérico. tests/Unit/IconsTest.php verifica que los íconos de la
 * migración existan acá.
 */
import {
    Activity,
    ArrowDownToLine,
    AudioLines,
    Bell,
    BookOpen,
    Brush,
    Compass,
    Crown,
    Disc3,
    Drill,
    Drum,
    Dumbbell,
    Ear,
    Feather,
    Footprints,
    Hand,
    HeartPulse,
    LayoutGrid,
    ListMusic,
    Megaphone,
    Mic,
    MicVocal,
    Moon,
    MoveHorizontal,
    Music2,
    Music3,
    Music4,
    PawPrint,
    PersonStanding,
    Redo2,
    RefreshCcw,
    RotateCcw,
    RotateCw,
    Scale,
    Shield,
    ShieldHalf,
    Shuffle,
    Target,
    Tornado,
    Users,
    Waves,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SKILL_ICONS: Record<string, LucideIcon> = {
    'arrow-down-to-line': ArrowDownToLine,
    'audio-lines': AudioLines,
    bell: Bell,
    'book-open': BookOpen,
    brush: Brush,
    compass: Compass,
    crown: Crown,
    'disc-3': Disc3,
    drill: Drill,
    drum: Drum,
    feather: Feather,
    footprints: Footprints,
    hand: Hand,
    'layout-grid': LayoutGrid,
    'list-music': ListMusic,
    megaphone: Megaphone,
    mic: Mic,
    'mic-vocal': MicVocal,
    moon: Moon,
    'move-horizontal': MoveHorizontal,
    'music-2': Music2,
    'music-3': Music3,
    'music-4': Music4,
    'paw-print': PawPrint,
    'person-standing': PersonStanding,
    'redo-2': Redo2,
    'refresh-ccw': RefreshCcw,
    'rotate-ccw': RotateCcw,
    'rotate-cw': RotateCw,
    scale: Scale,
    shield: Shield,
    'shield-half': ShieldHalf,
    shuffle: Shuffle,
    tornado: Tornado,
    users: Users,
    zap: Zap,
};

/** Íconos de las categorías de retos sueltos (App\Models\Reto::CATEGORIES). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    flexibilidad: Waves,
    fortalecimiento: Dumbbell,
    resistencia: HeartPulse,
    movilidad: Activity,
    musicalidad: Ear,
};

/** Ícono de una habilidad (el genérico si no tiene o no se reconoce). */
export function skillIcon(name: string | null | undefined): LucideIcon {
    return (name && SKILL_ICONS[name]) || Target;
}

/** Ícono de una categoría de reto suelto. */
export function categoryIcon(category: string | null | undefined): LucideIcon {
    return (category && CATEGORY_ICONS[category]) || Target;
}
