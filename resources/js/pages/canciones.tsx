import { router } from "@inertiajs/react"
import { useState } from "react"
import { SectionLayout } from "@/components/section-layout"
import { SongCard } from "@/components/song-card"
import { Music, Filter, Plus, Loader2, Search, X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Song {
  id: string
  title: string
  type: string
  lyrics: string
  translation: string | null
  context: string | null
  video_url: string | null
  mestre: string | null
  tags: string[] | null   // aquí guardamos los ritmos
  nossa: boolean
  created_at: string
}

const songTypes = [
  { id: "all", label: "Todas" },
  { id: "ladainha", label: "Ladainhas" },
  { id: "corrido", label: "Corridos" },
  { id: "quadra", label: "Quadras" },
  { id: "chula", label: "Chulas" },
  { id: "samba", label: "Sambas" },
]

// Ritmos / toques del berimbau más comunes en capoeira
const RITMOS = [
  "Angola",
  "São Bento Grande",
  "São Bento Pequeno",
  "Iuna",
  "Banguela",
  "Idalina",
  "Cavalaria",
  "Amazonas",
  "Santa Maria",
  "Apanha Laranja",
]

const EMPTY_FORM = {
  title: "",
  type: "corrido",
  lyrics: "",
  translation: "",
  context: "",
  video_url: "",
  mestre: "",
  ritmos: [] as string[],
  nossa: false,
}

export default function CancionesPage({ songs }: { songs: Song[] }) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  // Las canciones llegan como props de Inertia (ya cargadas por el servidor):
  // no hay estado de "cargando" ni de error de carga como en el sitio Next.
  const loading = false
  const error = ""
  const fetchSongs = () => router.reload({ only: ["songs"] })
  const [selectedType, setSelectedType] = useState("all")
  const [onlyNossas, setOnlyNossas] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // ── Dialog helpers ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditingSong(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (song: Song) => {
    setEditingSong(song)
    setForm({
      title: song.title,
      type: song.type,
      lyrics: song.lyrics,
      translation: song.translation ?? "",
      context: song.context ?? "",
      video_url: song.video_url ?? "",
      mestre: song.mestre ?? "",
      ritmos: song.tags ?? [],
      nossa: song.nossa,
    })
    setFormError("")
    setDialogOpen(true)
  }

  // Toggle un ritmo en el array
  const toggleRitmo = (ritmo: string) => {
    setForm((f) => ({
      ...f,
      ritmos: f.ritmos.includes(ritmo)
        ? f.ritmos.filter((r) => r !== ritmo)
        : [...f.ritmos, ritmo],
    }))
  }

  // ── Save (create / update) ─────────────────────────────────────────
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")
    setSaving(true)

    // Los ritmos se guardan en la columna "tags".
    const { ritmos, ...rest } = form
    const payload = { ...rest, tags: ritmos.length > 0 ? ritmos : null }
    const options = {
      preserveScroll: true,
      onSuccess: () => setDialogOpen(false),
      onError: (errors: Record<string, string>) => setFormError(Object.values(errors)[0] ?? "Error al guardar"),
      onFinish: () => setSaving(false),
    }

    if (editingSong) {
      router.put(`/canciones/${editingSong.id}`, payload, options)
    } else {
      router.post("/canciones", payload, options)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta canción?")) return
    router.delete(`/canciones/${id}`, {
      preserveScroll: true,
      onError: () => alert("No se pudo eliminar la canción."),
    })
  }

  // ── Filter ────────────────────────────────────────────────────────
  const filteredSongs = songs.filter((s) => {
    const matchesType = selectedType === "all" || s.type === selectedType
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.lyrics.toLowerCase().includes(q)
    return matchesType && matchesSearch && (!onlyNossas || s.nossa)
  })

  return (
    <SectionLayout
      title="Sabiá cantou"
      description="Cancionero para que no pares de cantar en la roda"
    >
      {/* Song Types Info */}
      <div className="bg-card rounded-xl p-6 mb-8">
        <h2 className="font-serif font-bold text-foreground mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Tipos de Canciones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-foreground">Ladainha:</span>
            <span className="text-muted-foreground"> Canto inicial solista.</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Chula:</span>
            <span className="text-muted-foreground"> Respuesta coral a la ladainha.</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Corrido:</span>
            <span className="text-muted-foreground"> Cantos rápidos durante el juego.</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Quadra:</span>
            <span className="text-muted-foreground"> Estrofas de cuatro versos.</span>
          </div>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o letra..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button onClick={openAdd} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Nueva canción
        </Button>
      </div>

      {/* Filter by type */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {/* "Nossas" se combina con el tipo y la búsqueda — por eso es un
              toggle aparte y no una opción más de songTypes. */}
          <button
            onClick={() => setOnlyNossas((v) => !v)}
            aria-pressed={onlyNossas}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border",
              onlyNossas
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-primary/40 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", onlyNossas ? "fill-current" : "text-primary")} />
            Nossas
          </button>
          <div aria-hidden="true" className="w-px bg-border shrink-0 my-1" />
          {songTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {(searchQuery || onlyNossas) && (
          <span className="text-sm text-muted-foreground shrink-0 w-full sm:w-auto">
            {filteredSongs.length} resultado{filteredSongs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchSongs}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filteredSongs.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {songs.length === 0
              ? "Aún no hay canciones. ¡Agrega la primera!"
              : "No hay canciones que coincidan con los filtros."}
          </p>
        </div>
      )}

      {/* Songs List */}
      {!loading && !error && (
        <div className="space-y-6">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              id={song.id}
              title={song.title}
              type={song.type}
              lyrics={song.lyrics}
              translation={song.translation ?? ""}
              history={song.context ?? ""}
              videoUrl={song.video_url ?? ""}
              mestre={song.mestre ?? ""}
              ritmos={song.tags ?? []}
              nossa={song.nossa}
              onEdit={() => openEdit(song)}
              onDelete={isAdmin ? () => handleDelete(song.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingSong ? "Editar canción" : "Nueva canción"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 mt-2">
            {/* Título + Tipo */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  disabled={saving}
                  placeholder="Ej: Paranauê"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  disabled={saving}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ladainha">Ladainha</SelectItem>
                    <SelectItem value="corrido">Corrido</SelectItem>
                    <SelectItem value="quadra">Quadra</SelectItem>
                    <SelectItem value="chula">Chula</SelectItem>
                    <SelectItem value="samba">Samba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ritmo — multi-selección */}
            <div className="space-y-2">
              <Label>
                Ritmo{" "}
                <span className="text-muted-foreground font-normal text-xs">(puede elegir varios)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {RITMOS.map((ritmo) => {
                  const selected = form.ritmos.includes(ritmo)
                  return (
                    <button
                      key={ritmo}
                      type="button"
                      disabled={saving}
                      onClick={() => toggleRitmo(ritmo)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                      )}
                    >
                      {ritmo}
                    </button>
                  )
                })}
              </div>
              {form.ritmos.length > 0 && (
                <p className="text-xs text-primary">
                  Seleccionados: {form.ritmos.join(" · ")}
                </p>
              )}
            </div>

            {/* Mestre */}
            <div className="space-y-2">
              <Label htmlFor="mestre">Mestre / Autor (opcional)</Label>
              <Input
                id="mestre"
                value={form.mestre}
                onChange={(e) => setForm((f) => ({ ...f, mestre: e.target.value }))}
                disabled={saving}
                placeholder="Ej: Mestre Pastinha"
              />
            </div>

            {/* Nossa — al crear la marca cualquiera; al editar, solo admin
                (la API ignora el cambio si no es admin, esto solo lo refleja). */}
            {(() => {
              const locked = !!editingSong && !isAdmin
              return (
                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    id="nossa"
                    checked={form.nossa}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, nossa: v === true }))}
                    disabled={saving || locked}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="nossa" className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      Canción nossa
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {locked
                        ? "Solo un admin puede cambiar esta marca en una canción ya creada."
                        : "Del grupo o de algún integrante. Aparece en el filtro \"Nossas\"."}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Letra */}
            <div className="space-y-2">
              <Label htmlFor="lyrics">Letra *</Label>
              <Textarea
                id="lyrics"
                value={form.lyrics}
                onChange={(e) => setForm((f) => ({ ...f, lyrics: e.target.value }))}
                required
                disabled={saving}
                rows={5}
                placeholder="Letra en portugués..."
                className="font-mono text-sm"
              />
            </div>

            {/* Traducción */}
            <div className="space-y-2">
              <Label htmlFor="translation">Traducción (opcional)</Label>
              <Textarea
                id="translation"
                value={form.translation}
                onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                disabled={saving}
                rows={5}
                placeholder="Traducción al español..."
                className="font-mono text-sm"
              />
            </div>

            {/* Historia */}
            <div className="space-y-2">
              <Label htmlFor="context">Historia / Contexto (opcional)</Label>
              <Textarea
                id="context"
                value={form.context}
                onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                disabled={saving}
                rows={3}
                placeholder="Origen, historia o contexto de la canción..."
              />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label htmlFor="video_url">URL de video YouTube (opcional)</Label>
              <Input
                id="video_url"
                type="url"
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                disabled={saving}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
                ) : editingSong ? "Guardar cambios" : "Agregar canción"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SectionLayout>
  )
}
