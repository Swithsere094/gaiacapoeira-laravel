import { Link } from '@inertiajs/react';
import {
    Menu,
    X,
    Play,
    ScrollText,
    Music,
    LogIn,
    LogOut,
    User,
    Users,
    BarChart3,
    KeyRound,
    CalendarDays,
    Ticket,
    Trophy,
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { getCordaSrc } from '@/lib/constants/cordas';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const baseNavItems = [
    { href: '/galera', label: 'Galera', icon: Play },
    { href: '/canciones', label: 'Sabiá cantou', icon: Music },
    { href: '/politica', label: 'Política', icon: ScrollText },
    { href: '/eventos', label: 'Eventos', icon: CalendarDays },
];

// Retos: con cualquiera de sus permisos (se liberan por partes).
const retosNavItem = { href: '/retos', label: 'Retos', icon: Trophy };

export function Navigation() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, loading, signOut, can, isAdmin } = useAuth();
    const canRetos =
        can('retos.entrenar') || can('retos.arbol') || can('retos.revisar');
    const navItems = canRetos ? [...baseNavItems, retosNavItem] : baseNavItems;

    // Menú de la cuenta (desplegable en la computadora, lista en el celular).
    // Gestionar usuarios y roles es solo de admin (no es un permiso asignable).
    const accountItems = [
        { href: '/perfil', label: 'Mi perfil', icon: User, show: true },
        {
            href: '/admin/usuarios',
            label: 'Gestionar usuarios',
            icon: Users,
            show: isAdmin,
        },
        {
            href: '/admin/roles',
            label: 'Gestionar roles',
            icon: KeyRound,
            show: isAdmin,
        },
        {
            href: '/encuentros',
            label: 'Encuentros',
            icon: Ticket,
            show: can('encuentros.gestionar'),
        },
        {
            href: '/admin/analytics',
            label: 'Analíticas',
            icon: BarChart3,
            show: can('analiticas.ver'),
        },
    ].filter((item) => item.show);
    const [profileItem, ...adminItems] = accountItems;

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + '/');
    const closeMobile = () => setMobileMenuOpen(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 0);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className={cn(
                        'flex items-center justify-between transition-all duration-300',
                        scrolled ? 'h-16' : 'h-24',
                    )}
                >
                    <Link href="/" className="group flex items-center gap-3">
                        <div
                            className={cn(
                                'flex items-center justify-center rounded-full bg-primary transition-all duration-300',
                                scrolled ? 'h-10 w-10' : 'h-14 w-14',
                            )}
                        >
                            <span
                                className={cn(
                                    'font-serif font-bold text-primary-foreground transition-all duration-300',
                                    scrolled ? 'text-lg' : 'text-2xl',
                                )}
                            >
                                A
                            </span>
                        </div>
                        <span
                            className={cn(
                                'font-serif font-bold text-foreground transition-all duration-300 group-hover:text-primary',
                                scrolled ? 'text-xl' : 'text-2xl',
                            )}
                        >
                            Areia no Mar
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={
                                    isActive(item.href) ? 'page' : undefined
                                }
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                                    isActive(item.href)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}

                        {/* Auth Section */}
                        {!loading &&
                            (user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="ml-2 h-auto gap-2 py-1.5 hover:bg-secondary hover:text-foreground"
                                        >
                                            <CordaAvatar
                                                src={getCordaSrc(user.avatar)}
                                                size={scrolled ? 'sm' : 'lg'}
                                            />
                                            <span className="max-w-24 truncate">
                                                {user.name || user.username}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-52"
                                    >
                                        {accountItems.map((item) => (
                                            <Fragment key={item.href}>
                                                {item === adminItems[0] && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={item.href}
                                                        className="cursor-pointer"
                                                    >
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                        {item.label}
                                                    </Link>
                                                </DropdownMenuItem>
                                            </Fragment>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={signOut}
                                            className="cursor-pointer text-destructive"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Cerrar sesión
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link href="/auth/login">
                                    <Button
                                        variant="outline"
                                        className="ml-2 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Entrar
                                    </Button>
                                </Link>
                            ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="rounded-md p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
                        aria-label={
                            mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'
                        }
                        aria-expanded={mobileMenuOpen}
                        aria-controls="menu-movil"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div
                        id="menu-movil"
                        className="border-t border-border py-4 md:hidden"
                    >
                        <div className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMobile}
                                    aria-current={
                                        isActive(item.href) ? 'page' : undefined
                                    }
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-all',
                                        isActive(item.href)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            ))}

                            {/* Mobile Auth */}
                            {!loading && (
                                <div className="mt-2 border-t border-border pt-4">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 px-4 py-2 text-foreground">
                                                <CordaAvatar
                                                    src={getCordaSrc(
                                                        user.avatar,
                                                    )}
                                                    size="md"
                                                />
                                                <span className="font-medium">
                                                    {user.name || user.username}
                                                </span>
                                            </div>
                                            {[profileItem, ...adminItems].map(
                                                (item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={closeMobile}
                                                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <item.icon className="h-5 w-5" />
                                                        {item.label}
                                                    </Link>
                                                ),
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    signOut();
                                                    closeMobile();
                                                }}
                                                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-destructive hover:bg-destructive/10"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Cerrar sesión
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href="/auth/login"
                                            onClick={closeMobile}
                                            className="flex items-center gap-3 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground"
                                        >
                                            <LogIn className="h-5 w-5" />
                                            Iniciar sesión
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

function CordaAvatar({
    src,
    size,
}: {
    src: string | null;
    size: 'sm' | 'md' | 'lg';
}) {
    const dim =
        size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-10 h-10' : 'w-14 h-14';
    const iconSize =
        size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7';
    if (!src)
        return (
            <div
                className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary transition-all duration-300`}
            >
                <User
                    className={`${iconSize} text-primary-foreground transition-all duration-300`}
                />
            </div>
        );
    return (
        <div
            className={`${dim} flex shrink-0 items-center justify-center overflow-hidden transition-all duration-300`}
        >
            {/* Los PNG de /Cuerda x cuerda/ tienen mucho margen transparente alrededor del dibujo y
          el dibujo en sí no está centrado en el lienzo (centro real medido en ~40.4% vertical,
          no 50%) — translateY corrige eso antes del escalado (por eso va primero: así no se
          amplifica con el scale) y el scale lo agranda para que se note dentro de la caja. */}
            <img
                src={src}
                alt="Cuerda"
                className="h-full w-full object-contain drop-shadow"
                style={{ transform: 'translateY(9.6%) scale(1.8)' }}
            />
        </div>
    );
}
