import { Head, router, usePage } from "@inertiajs/react"
import { useMemo, useState } from "react"
import { useSearchParams } from "@/lib/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { VideoCard } from "@/components/video-card"
import { useAuth } from "@/hooks/use-auth"
import {
  Play,
  Mic2,
  Plus,
  Loader2,
  Search,
  Calendar,
  X,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────
interface Roda {
  id: string
  title: string
  description: string | null
  video_url: string
  location: string | null
  event_date: string | null
  views: number
  created_at: string
}

interface Cantoria {
  id: string
  title: string
  video_url: string | null
  description: string | null
  event_date: string | null
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function monthLabel(roda: Roda): string {
  const raw = roda.event_date
    ? parseLocalDate(roda.event_date)
    : new Date(roda.created_at)
  const label = raw.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function groupByMonth(rodas: Roda[]): { label: string; items: Roda[] }[] {
  const map = new Map<string, Roda[]>()
  for (const r of rodas) {
    const key = monthLabel(r)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

// ── Empty forms ───────────────────────────────────────────────────
const EMPTY_RODA = { title: "", description: "", video_url: "", location: "", event_date: "" }
const EMPTY_CANTORIA = { title: "", video_url: "", description: "", event_date: "" }

// ── Page ──────────────────────────────────────────────────────────
export default function GaleraContent({ rodas, cantorias }: { rodas: Roda[]; cantorias: Cantoria[] }) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") ?? "rodas") as "rodas" | "cantorias"

  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const { flash } = usePage().props

  // Rodas y cantorias llegan como props de Inertia (ya cargadas por el
  // servidor): no hay estado de "cargando" ni de error de carga.
  const rodasLoading = false
  const rodasError = ""
  const cantoriasLoading = false
  const cantoriasError = ""
  const fetchRodas = () => router.reload({ only: ["rodas"] })
  const fetchCantorias = () => router.reload({ only: ["cantorias"] })

  // ── Rodas state ──────────────────────────────────────────────────
  const [jogadorQuery, setJogadorQuery] = useState("")

  const [rodaDialogOpen, setRodaDialogOpen] = useState(false)
  const [rodaForm, setRodaForm] = useState(EMPTY_RODA)
  const [rodaSaving, setRodaSaving] = useState(false)
  const [rodaFormError, setRodaFormError] = useState("")

  // ── YouTube sync state ───────────────────────────────────────────
  // El mensaje del resultado llega como flash de sesión (success/error) y se
  // muestra en la pestaña desde la que se sincronizó.
  const [syncing, setSyncing] = useState(false)
  const [cantoriaSyncing, setCantoriaSyncing] = useState(false)
  const [syncTab, setSyncTab] = useState<"rodas" | "cantorias" | null>(null)
  const flashMsg = flash.error ?? flash.success ?? ""
  const syncMsg = syncTab === "rodas" ? flashMsg : ""
  const cantoriaSyncMsg = syncTab === "cantorias" ? flashMsg : ""

  // ── Cantorias state ──────────────────────────────────────────────
  const [cantoriaDialogOpen, setCantoriaDialogOpen] = useState(false)
  const [cantoriaForm, setCantoriaForm] = useState(EMPTY_CANTORIA)
  const [cantoriaSaving, setCantoriaSaving] = useState(false)
  const [cantoriaFormError, setCantoriaFormError] = useState("")

  // ── Filtered & grouped rodas ─────────────────────────────────────
  const filteredRodas = useMemo(() => {
    const q = jogadorQuery.trim().toLowerCase()
    if (!q) return rodas
    return rodas.filter((r) => r.title.toLowerCase().includes(q))
  }, [rodas, jogadorQuery])

  const groupedRodas = useMemo(() => groupByMonth(filteredRodas), [filteredRodas])

  // ── YouTube sync handlers ────────────────────────────────────────
  const handleSync = () => {
    setSyncing(true)
    setSyncTab("rodas")
    router.post("/galera/rodas/sync", {}, { preserveScroll: true, onFinish: () => setSyncing(false) })
  }

  const handleSyncCantorias = () => {
    setCantoriaSyncing(true)
    setSyncTab("cantorias")
    router.post("/galera/cantorias/sync", {}, { preserveScroll: true, onFinish: () => setCantoriaSyncing(false) })
  }

  // ── Roda handlers ────────────────────────────────────────────────
  const handleSaveRoda = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRodaFormError("")
    setRodaSaving(true)
    router.post("/galera/rodas", rodaForm, {
      preserveScroll: true,
      onSuccess: () => {
        setRodaDialogOpen(false)
        setRodaForm(EMPTY_RODA)
      },
      onError: (errors) => setRodaFormError(Object.values(errors)[0] ?? "Error al guardar"),
      onFinish: () => setRodaSaving(false),
    })
  }

  const handleDeleteRoda = (id: string) => {
    if (!confirm("¿Eliminar esta roda?")) return
    router.delete(`/galera/rodas/${id}`, {
      preserveScroll: true,
      onError: () => alert("No se pudo eliminar la roda."),
    })
  }

  // ── Cantoria handlers ────────────────────────────────────────────
  const handleSaveCantoria = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCantoriaFormError("")
    setCantoriaSaving(true)
    router.post("/galera/cantorias", cantoriaForm, {
      preserveScroll: true,
      onSuccess: () => {
        setCantoriaDialogOpen(false)
        setCantoriaForm(EMPTY_CANTORIA)
      },
      onError: (errors) => setCantoriaFormError(Object.values(errors)[0] ?? "Error al guardar"),
      onFinish: () => setCantoriaSaving(false),
    })
  }

  const handleDeleteCantoria = (id: string) => {
    if (!confirm("¿Eliminar esta cantoria?")) return
    router.delete(`/galera/cantorias/${id}`, {
      preserveScroll: true,
      onError: () => alert("No se pudo eliminar la cantoria."),
    })
  }

  // ── Tab helper ────────────────────────────────────────────────────
  const setTab = (tab: "rodas" | "cantorias") => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.get(`/galera?${params.toString()}`, {}, { replace: true, preserveScroll: true, preserveState: true })
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Head title="Galera" />
      <Navigation />

      <main className="pt-24">
        {/* Hero */}
        <div className="bg-gradient-to-b from-secondary/40 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
              Galera
            </h1>
            <p className="text-muted-foreground text-lg">
              Rodas y cantorias de nuestra comunidad
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-background sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 -mb-px">
              <button
                onClick={() => setTab("rodas")}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "rodas"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Play className="w-4 h-4" />
                Rodas
              </button>
              <button
                onClick={() => setTab("cantorias")}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "cantorias"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Mic2 className="w-4 h-4" />
                Cantorias
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

          {/* ── TAB: RODAS ─────────────────────────────────────────── */}
          {activeTab === "rodas" && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                {/* Search */}
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={jogadorQuery}
                    onChange={(e) => setJogadorQuery(e.target.value)}
                    placeholder="Buscar jogador..."
                    className="pl-9 pr-8"
                  />
                  {jogadorQuery && (
                    <button
                      onClick={() => setJogadorQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {jogadorQuery && (
                    <span className="text-sm text-muted-foreground">
                      {filteredRodas.length} resultado{filteredRodas.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {isAdmin && (
                    <>
                      {/* Sync con YouTube */}
                      <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing}
                        className="gap-2 shrink-0"
                        title="Importar nuevos videos desde la playlist de YouTube"
                      >
                        {syncing
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <RefreshCw className="w-4 h-4" />}
                        {syncing ? "Sincronizando..." : "Sync YouTube"}
                      </Button>

                      <Button
                        onClick={() => { setRodaForm(EMPTY_RODA); setRodaFormError(""); setRodaDialogOpen(true) }}
                        className="gap-2 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar roda
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Sync result message */}
              {syncMsg && (
                <p className={`text-sm mb-4 px-3 py-2 rounded-lg ${
                  syncMsg.includes("Error") || syncMsg.includes("error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {syncMsg}
                </p>
              )}

              {/* States */}
              {rodasLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {!rodasLoading && rodasError && (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{rodasError}</p>
                  <Button variant="outline" onClick={fetchRodas}>Reintentar</Button>
                </div>
              )}
              {!rodasLoading && !rodasError && filteredRodas.length === 0 && (
                <div className="text-center py-16">
                  <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {rodas.length === 0
                      ? "Aún no hay rodas."
                      : `No hay rodas con "${jogadorQuery}".`}
                  </p>
                </div>
              )}

              {/* Grouped by month */}
              {!rodasLoading && !rodasError && filteredRodas.length > 0 && (
                <div className="space-y-12">
                  {groupedRodas.map(({ label, items }) => (
                    <section key={label}>
                      {/* Month header */}
                      <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-5 h-5 text-primary shrink-0" />
                        <h2 className="font-serif text-xl font-bold text-foreground">
                          {label}
                        </h2>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-sm text-muted-foreground shrink-0">
                          {items.length} {items.length === 1 ? "roda" : "rodas"}
                        </span>
                      </div>

                      {/* Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((roda) => (
                          <VideoCard
                            key={roda.id}
                            id={roda.id}
                            title={roda.title}
                            description={roda.description ?? ""}
                            videoUrl={roda.video_url}
                            location={roda.location ?? ""}
                            eventDate={roda.event_date ?? ""}
                            views={roda.views ?? 0}
                            onDelete={isAdmin ? () => handleDeleteRoda(roda.id) : undefined}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CANTORIAS ─────────────────────────────────────── */}
          {activeTab === "cantorias" && (
            <div>
              {/* Toolbar */}
              {isAdmin && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <Button
                      variant="outline"
                      onClick={handleSyncCantorias}
                      disabled={cantoriaSyncing}
                      className="gap-2 shrink-0"
                      title="Importar nuevos videos desde la playlist de cantorias en YouTube"
                    >
                      {cantoriaSyncing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                      {cantoriaSyncing ? "Sincronizando..." : "Sync YouTube"}
                    </Button>
                    <Button
                      onClick={() => { setCantoriaForm(EMPTY_CANTORIA); setCantoriaFormError(""); setCantoriaDialogOpen(true) }}
                      className="gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar cantoria
                    </Button>
                  </div>
                </div>
              )}
              {cantoriaSyncMsg && (
                <p className={`text-sm mb-4 px-3 py-2 rounded-lg ${
                  cantoriaSyncMsg.includes("Error") || cantoriaSyncMsg.includes("error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {cantoriaSyncMsg}
                </p>
              )}

              {/* States */}
              {cantoriasLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {!cantoriasLoading && cantoriasError && (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{cantoriasError}</p>
                  <Button variant="outline" onClick={fetchCantorias}>Reintentar</Button>
                </div>
              )}

              {!cantoriasLoading && !cantoriasError && cantorias.length === 0 && (
                <div className="text-center py-16">
                  <Mic2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Aún no hay cantorias registradas.
                  </p>
                  {isAdmin && (
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => { setCantoriaForm(EMPTY_CANTORIA); setCantoriaDialogOpen(true) }}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar la primera
                    </Button>
                  )}
                </div>
              )}

              {/* Cantorias list */}
              {!cantoriasLoading && !cantoriasError && cantorias.length > 0 && (
                <div className="space-y-4">
                  {cantorias.map((cantoria) => {
                    const date = cantoria.event_date
                      ? parseLocalDate(cantoria.event_date).toLocaleDateString("es-ES", {
                          day: "numeric", month: "long", year: "numeric",
                        })
                      : null

                    return (
                      <article key={cantoria.id} className="bg-card rounded-xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                          <Mic2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-bold text-foreground">{cantoria.title}</h3>
                          {cantoria.description && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {cantoria.description}
                            </p>
                          )}
                          {date && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {date}
                            </p>
                          )}
                          {cantoria.video_url && (
                            <a
                              href={cantoria.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Ver video
                            </a>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteCantoria(cantoria.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            aria-label="Eliminar cantoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Dialog: Agregar Roda ──────────────────────────────────── */}
      <Dialog open={rodaDialogOpen} onOpenChange={setRodaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Agregar Roda</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRoda} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="r-title">Título *</Label>
              <Input
                id="r-title"
                value={rodaForm.title}
                onChange={(e) => setRodaForm((f) => ({ ...f, title: e.target.value }))}
                required
                disabled={rodaSaving}
                placeholder="Ej: Roda verano — João / María"
              />
              <p className="text-xs text-muted-foreground">
                Incluye el nombre del jogador en el título para que sea buscable.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-video">URL del Video (YouTube / Vimeo) *</Label>
              <Input
                id="r-video"
                type="url"
                value={rodaForm.video_url}
                onChange={(e) => setRodaForm((f) => ({ ...f, video_url: e.target.value }))}
                required
                disabled={rodaSaving}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-desc">Descripción (opcional)</Label>
              <Textarea
                id="r-desc"
                value={rodaForm.description}
                onChange={(e) => setRodaForm((f) => ({ ...f, description: e.target.value }))}
                disabled={rodaSaving}
                rows={2}
                placeholder="Breve descripción del encuentro..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="r-location">Lugar</Label>
                <Input
                  id="r-location"
                  value={rodaForm.location}
                  onChange={(e) => setRodaForm((f) => ({ ...f, location: e.target.value }))}
                  disabled={rodaSaving}
                  placeholder="Ej: Parque Central"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-date">Fecha</Label>
                <Input
                  id="r-date"
                  type="date"
                  value={rodaForm.event_date}
                  onChange={(e) => setRodaForm((f) => ({ ...f, event_date: e.target.value }))}
                  disabled={rodaSaving}
                />
              </div>
            </div>

            {rodaFormError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                {rodaFormError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRodaDialogOpen(false)} disabled={rodaSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={rodaSaving}>
                {rodaSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Agregar roda"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Agregar Cantoria ──────────────────────────────── */}
      <Dialog open={cantoriaDialogOpen} onOpenChange={setCantoriaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Agregar Cantoria</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCantoria} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="c-title">Título *</Label>
              <Input
                id="c-title"
                value={cantoriaForm.title}
                onChange={(e) => setCantoriaForm((f) => ({ ...f, title: e.target.value }))}
                required
                disabled={cantoriaSaving}
                placeholder="Ej: Cantoria del grupo — Enero 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-video">URL del Video (opcional)</Label>
              <Input
                id="c-video"
                type="url"
                value={cantoriaForm.video_url}
                onChange={(e) => setCantoriaForm((f) => ({ ...f, video_url: e.target.value }))}
                disabled={cantoriaSaving}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-desc">Descripción (opcional)</Label>
              <Textarea
                id="c-desc"
                value={cantoriaForm.description}
                onChange={(e) => setCantoriaForm((f) => ({ ...f, description: e.target.value }))}
                disabled={cantoriaSaving}
                rows={3}
                placeholder="Notas sobre esta cantoria..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-date">Fecha (opcional)</Label>
              <Input
                id="c-date"
                type="date"
                value={cantoriaForm.event_date}
                onChange={(e) => setCantoriaForm((f) => ({ ...f, event_date: e.target.value }))}
                disabled={cantoriaSaving}
              />
            </div>

            {cantoriaFormError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                {cantoriaFormError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCantoriaDialogOpen(false)} disabled={cantoriaSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cantoriaSaving}>
                {cantoriaSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Agregar cantoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
