import { router, useForm } from '@inertiajs/react';
import { ImageIcon, Lock, Plus, Ticket, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
    InvitadosEditor,
    invitadoPayload,
    toInvitadoForm,
} from '@/components/encuentros/invitados-editor';
import {
    ProgramaEditor,
    toActividadForm,
} from '@/components/encuentros/programa-editor';
import { TraduccionesEditor } from '@/components/encuentros/traducciones-editor';
import { FormActions } from '@/components/form-actions';
import { FormError } from '@/components/form-error';
import { PanelTitle } from '@/components/headings';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { diasDelEncuentro, slugDelNombre } from '@/lib/encuentros';
import type { Encuentro, Traducciones } from '@/types/encuentros';

interface PrecioForm {
    id: string | null;
    nombre: string;
    descripcion: string;
    valor: string;
    traducciones: Traducciones;
}

const NUEVO_PRECIO: PrecioForm = {
    id: null,
    nombre: '',
    descripcion: '',
    valor: '',
    traducciones: null,
};

/** Crear o editar un encuentro (permiso `encuentros.gestionar`). */
export default function EncuentroFormPage({
    encuentro,
    dominio,
}: {
    encuentro: Encuentro | null;
    dominio: string;
}) {
    const slugLocked = encuentro !== null && encuentro.subdominio !== 'ninguno';
    const form = useForm({
        nombre: encuentro?.nombre ?? '',
        starts_on: encuentro?.starts_on ?? '',
        ends_on: encuentro?.ends_on ?? '',
        lugar: encuentro?.lugar ?? '',
        direccion: encuentro?.direccion ?? '',
        mapa_url: encuentro?.mapa_url ?? '',
        descripcion: encuentro?.descripcion ?? '',
        info_pago: encuentro?.info_pago ?? '',
        mensaje_final: encuentro?.mensaje_final ?? '',
        cupo: encuentro?.cupo?.toString() ?? '',
        inscripciones_desde: encuentro?.inscripciones_desde ?? '',
        inscripciones_hasta: encuentro?.inscripciones_hasta ?? '',
        precios: (encuentro?.precios ?? []).map<PrecioForm>((p) => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion ?? '',
            valor: p.valor.toString(),
            traducciones: p.traducciones,
        })),
        actividades: (encuentro?.actividades ?? []).map(toActividadForm),
        invitados: (encuentro?.invitados ?? []).map(toInvitadoForm),
        traducciones: encuentro?.traducciones ?? null,
        portada: null as File | null,
        quitar_portada: 0,
    });
    const { data } = form;
    const [preview, setPreview] = useState<string | null>(
        encuentro?.portada_url ?? null,
    );

    const setPrecio = (i: number, field: keyof PrecioForm, value: string) =>
        form.setData(
            'precios',
            data.precios.map((p, idx) =>
                idx === i ? { ...p, [field]: value } : p,
            ),
        );

    const onPortada = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        form.setData((d) => ({ ...d, portada: file, quitar_portada: 0 }));
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const quitarPortada = () => {
        form.setData((d) => ({ ...d, portada: null, quitar_portada: 1 }));
        setPreview(null);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Con archivo, PHP no interpreta un PUT real: va como POST + _method.
        form.transform((d) => ({
            ...d,
            invitados: d.invitados.map(invitadoPayload),
            ...(encuentro ? { _method: 'put' } : {}),
        }));
        if (encuentro) {
            form.post(`/encuentros/${encuentro.id}`, { forceFormData: true });
        } else {
            form.post('/encuentros', { forceFormData: true });
        }
    };

    const titulo = encuentro ? 'Editar encuentro' : 'Nuevo encuentro';
    const formError = Object.values(form.errors)[0];

    return (
        <PageLayout
            title={titulo}
            width="medium"
            header={
                <PageHeader
                    icon={Ticket}
                    title={titulo}
                    description={
                        encuentro
                            ? encuentro.nombre
                            : 'Se crea como borrador: nadie lo ve hasta que lo publiques'
                    }
                />
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Datos */}
                <section className="space-y-4 panel p-5">
                    <PanelTitle>Datos del encuentro</PanelTitle>
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                            id="nombre"
                            value={data.nombre}
                            onChange={(e) =>
                                form.setData('nombre', e.target.value)
                            }
                            required
                            maxLength={120}
                            placeholder="Ej.: Batizado 2027"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="starts_on">Empieza *</Label>
                            <Input
                                id="starts_on"
                                type="date"
                                value={data.starts_on}
                                onChange={(e) =>
                                    form.setData('starts_on', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ends_on">Termina (opcional)</Label>
                            <Input
                                id="ends_on"
                                type="date"
                                value={data.ends_on}
                                min={data.starts_on || undefined}
                                onChange={(e) =>
                                    form.setData('ends_on', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="lugar">Lugar (opcional)</Label>
                            <Input
                                id="lugar"
                                value={data.lugar}
                                onChange={(e) =>
                                    form.setData('lugar', e.target.value)
                                }
                                maxLength={200}
                                placeholder="Ej.: Coliseo de Rionegro"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mapa_url">
                                Enlace al mapa (opcional)
                            </Label>
                            <Input
                                id="mapa_url"
                                type="url"
                                value={data.mapa_url}
                                onChange={(e) =>
                                    form.setData('mapa_url', e.target.value)
                                }
                                maxLength={500}
                                placeholder="https://maps.app.goo.gl/…"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="direccion">
                            Dirección para el mapa (opcional)
                        </Label>
                        <Input
                            id="direccion"
                            value={data.direccion}
                            onChange={(e) =>
                                form.setData('direccion', e.target.value)
                            }
                            maxLength={200}
                            placeholder="Ej.: Calle 50 # 40-20, Rionegro, Antioquia"
                        />
                        <p className="text-xs text-muted-foreground">
                            Con dirección, la página muestra un mapa de Google
                            (se carga solo si la persona lo pide).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">
                            Descripción (opcional)
                        </Label>
                        <Textarea
                            id="descripcion"
                            value={data.descripcion}
                            onChange={(e) =>
                                form.setData('descripcion', e.target.value)
                            }
                            rows={6}
                            maxLength={5000}
                            placeholder="Qué es el encuentro, a quién está dirigido, qué traer…"
                        />
                    </div>
                </section>

                {/* Dirección */}
                <section className="space-y-3 panel p-5">
                    <PanelTitle>Dirección de la página</PanelTitle>
                    <p className="flex flex-wrap items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-sm">
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-mono break-all text-foreground">
                            {slugLocked
                                ? encuentro.slug
                                : slugDelNombre(data.nombre) || '…'}
                            .{dominio}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {slugLocked
                            ? 'Ya está creada y no se puede cambiar.'
                            : 'Se arma sola a partir del nombre, sin tildes ni caracteres especiales. Si ya existe, se le agrega un número. Se crea al publicar por primera vez y después no cambia.'}
                    </p>
                </section>

                {/* Inscripciones */}
                <section className="space-y-4 panel p-5">
                    <PanelTitle>Inscripciones</PanelTitle>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="inscripciones_desde">
                                Abren (opcional)
                            </Label>
                            <Input
                                id="inscripciones_desde"
                                type="date"
                                value={data.inscripciones_desde}
                                onChange={(e) =>
                                    form.setData(
                                        'inscripciones_desde',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inscripciones_hasta">
                                Cierran (opcional)
                            </Label>
                            <Input
                                id="inscripciones_hasta"
                                type="date"
                                value={data.inscripciones_hasta}
                                min={data.inscripciones_desde || undefined}
                                onChange={(e) =>
                                    form.setData(
                                        'inscripciones_hasta',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cupo">Cupo (opcional)</Label>
                            <Input
                                id="cupo"
                                type="number"
                                min={1}
                                value={data.cupo}
                                onChange={(e) =>
                                    form.setData('cupo', e.target.value)
                                }
                                placeholder="Sin tope"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Sin fechas, las inscripciones están abiertas mientras el
                        encuentro esté publicado. Las fechas cuentan en hora de
                        Colombia.
                    </p>
                </section>

                {/* Precios */}
                <section className="space-y-4 panel p-5">
                    <div>
                        <PanelTitle>Opciones de inscripción *</PanelTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Quien se inscribe elige una. Ej.: "Anticipado — 3
                            días con camiseta", "Solo sábado", "Grupo de 5 (por
                            persona)".
                        </p>
                    </div>
                    {data.precios.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay opciones. Hace falta al menos una
                            para publicar.
                        </p>
                    )}
                    {data.precios.map((p, i) => (
                        <div
                            key={p.id ?? `nuevo-${i}`}
                            className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_9rem_auto]"
                        >
                            <div className="space-y-2">
                                <Input
                                    aria-label={`Nombre de la opción ${i + 1}`}
                                    value={p.nombre}
                                    onChange={(e) =>
                                        setPrecio(i, 'nombre', e.target.value)
                                    }
                                    required
                                    maxLength={120}
                                    placeholder="Nombre de la opción"
                                />
                                <Input
                                    aria-label={`Detalle de la opción ${i + 1}`}
                                    value={p.descripcion}
                                    onChange={(e) =>
                                        setPrecio(
                                            i,
                                            'descripcion',
                                            e.target.value,
                                        )
                                    }
                                    maxLength={200}
                                    placeholder="Detalle (opcional)"
                                />
                            </div>
                            <Input
                                aria-label={`Valor de la opción ${i + 1} en pesos`}
                                type="number"
                                min={0}
                                step={1}
                                value={p.valor}
                                onChange={(e) =>
                                    setPrecio(i, 'valor', e.target.value)
                                }
                                required
                                placeholder="Valor ($)"
                            />
                            <IconButton
                                icon={Trash2}
                                label={`Quitar la opción ${i + 1}`}
                                tone="destructive"
                                onClick={() =>
                                    form.setData(
                                        'precios',
                                        data.precios.filter(
                                            (_, idx) => idx !== i,
                                        ),
                                    )
                                }
                                className="self-start"
                            />
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                            form.setData('precios', [
                                ...data.precios,
                                { ...NUEVO_PRECIO },
                            ])
                        }
                    >
                        <Plus className="h-4 w-4" />
                        Agregar opción
                    </Button>
                </section>

                <ProgramaEditor
                    actividades={data.actividades}
                    dias={diasDelEncuentro(
                        data.starts_on,
                        data.ends_on || null,
                    )}
                    onChange={(actividades) =>
                        form.setData('actividades', actividades)
                    }
                />

                <InvitadosEditor
                    invitados={data.invitados}
                    onChange={(invitados) =>
                        form.setData('invitados', invitados)
                    }
                />

                <TraduccionesEditor
                    encuentro={data}
                    precios={data.precios}
                    actividades={data.actividades}
                    invitados={data.invitados}
                    onEncuentro={(t) => form.setData('traducciones', t)}
                    onPrecios={(p) => form.setData('precios', p)}
                    onActividades={(a) => form.setData('actividades', a)}
                    onInvitados={(i) => form.setData('invitados', i)}
                />

                {/* Pago */}
                <section className="space-y-3 panel p-5">
                    <PanelTitle>Datos de pago (opcional)</PanelTitle>
                    <Textarea
                        id="info_pago"
                        aria-label="Datos de pago"
                        value={data.info_pago}
                        onChange={(e) =>
                            form.setData('info_pago', e.target.value)
                        }
                        rows={4}
                        maxLength={2000}
                        placeholder="Cuenta o Nequi para transferir y a quién mandarle el comprobante…"
                    />
                    <p className="text-xs text-muted-foreground">
                        Se muestra en la página y en la confirmación de cada
                        inscripción.
                    </p>
                </section>

                {/* Después del encuentro */}
                <section className="space-y-3 panel p-5">
                    <PanelTitle>Mensaje de cierre (opcional)</PanelTitle>
                    <Textarea
                        id="mensaje_final"
                        aria-label="Mensaje de cierre"
                        value={data.mensaje_final}
                        onChange={(e) =>
                            form.setData('mensaje_final', e.target.value)
                        }
                        rows={3}
                        maxLength={3000}
                        placeholder="Ej.: ¡Gracias por venir! Aquí quedan las fotos del batizado."
                    />
                    <p className="text-xs text-muted-foreground">
                        Se muestra cuando termines el encuentro y la página
                        quede como recuerdo.
                    </p>
                </section>

                {/* Portada */}
                <section className="space-y-3 panel p-5">
                    <PanelTitle>Imagen de portada (opcional)</PanelTitle>
                    {preview ? (
                        <div className="relative overflow-hidden rounded-lg border border-border">
                            <img
                                src={preview}
                                alt="Portada del encuentro"
                                className="aspect-[3/1] w-full object-cover"
                            />
                            <IconButton
                                icon={X}
                                label="Quitar la portada"
                                tone="destructive"
                                onClick={quitarPortada}
                                className="absolute top-2 right-2 bg-background/80"
                            />
                        </div>
                    ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary">
                            <ImageIcon className="h-6 w-6" />
                            Elegir imagen (JPG, PNG o WEBP, máx. 5 MB)
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="sr-only"
                                onChange={onPortada}
                            />
                        </label>
                    )}
                </section>

                <FormError message={formError} />

                <FormActions
                    onCancel={() =>
                        router.visit(
                            encuentro
                                ? `/encuentros/${encuentro.id}`
                                : '/encuentros',
                        )
                    }
                    processing={form.processing}
                >
                    {encuentro ? 'Guardar cambios' : 'Crear encuentro'}
                </FormActions>
            </form>
        </PageLayout>
    );
}
