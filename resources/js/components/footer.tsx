import { Link } from "@inertiajs/react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-lg">A</span>
              </div>
              <span className="font-serif text-xl font-bold text-foreground">
                Areia no Mar
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Preservando la tradición y cultura de la capoeira a través de nuestra comunidad.
              Un espacio digital para aprender, compartir y crecer juntos.
            </p>
          </div>

          <div>
            <h2 className="font-serif font-bold text-foreground mb-4">Secciones</h2>
            <ul className="space-y-2">
              <li><Link href="/galera" className="text-muted-foreground hover:text-primary transition-colors">Galera</Link></li>
              <li><Link href="/politica" className="text-muted-foreground hover:text-primary transition-colors">Política</Link></li>
              <li><Link href="/canciones" className="text-muted-foreground hover:text-primary transition-colors">Sabiá cantou</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif font-bold text-foreground mb-4">Comunidad</h2>
            <ul className="space-y-2">
              <li><span className="text-muted-foreground">Grupo de Capoeira</span></li>
              <li><span className="text-muted-foreground">Clases y Entrenamientos</span></li>
              <li><span className="text-muted-foreground">Eventos y Batizados</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Areia no Mar. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Hecho con amor por la comunidad
          </p>
        </div>
      </div>
    </footer>
  )
}
