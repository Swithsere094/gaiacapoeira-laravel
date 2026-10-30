import { useForm } from '@inertiajs/react';
import { CalendarDays, Lock, MapPin, Wallet } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { PublicLayout } from '@/components/encuentros/public-layout';
import { FormError } from '@/components/form-error';
import { PanelTitle } from '@/components/headings';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/dates';
import { formatMoney, formatRange } from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { EncuentroPublico } from '@/types/encuentros';

type Cierre = 'cerrado' | 'antes' | 'despues' | 'cupo' | null;

/** Página pública de un encuentro, con el formulario de inscripción. */
export default function EncuentroPublicoPage({
    encuentro,
    cierre,
    tallas,
    metodos,
}: {
    encuentro: EncuentroPublico;
    cierre: Cierre;
    tallas: string[];
    metodos: string[];
}) {
    return (
        <PublicLayout title={encuentro.nombre}>
            {/* Portada */}
            <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
                {encuentro.portada && (
                    <img
                        src={encuentro.portada}
                        alt=""
                        className="mx-auto aspect-[3/1] w-full max-w-5xl object-cover"
                    />
                )}
                <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
                        {encuentro.nombre}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            {formatRange(
                                encuentro.starts_on,
                                encuentro.ends_on,
                            )}
                        </span>
                        {encuentro.lugar && (
                            <span className="inline-flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {encuentro.mapa_url ? (
                                    <a
                                        href={encuentro.mapa_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline-offset-4 hover:text-foreground hover:underline"
                                    >
                                        {encuentro.lugar}
                                    </a>
                                ) : (
                                    encuentro.lugar
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
                {encuentro.descripcion && (
                    <p className="text-lg leading-relaxed whitespace-pre-line text-foreground">
                        {encuentro.descripcion}
                    </p>
                )}

                <section className="space-y-3">
                    <PanelTitle>Opciones de inscripción</PanelTitle>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {encuentro.precios.map((p) => (
                            <li key={p.id} className="panel p-4">
                                <p className="font-medium text-foreground">
                                    {p.nombre}
                                </p>
                                {p.descripcion && (
                                    <p className="text-sm text-muted-foreground">
                                        {p.descripcion}
                                    </p>
                                )}
                                <p className="mt-1 font-serif text-xl font-bold text-primary">
                                    {formatMoney(p.valor)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>

                {encuentro.info_pago && (
                    <section className="space-y-2 panel p-5">
                        <PanelTitle icon={Wallet}>Datos de pago</PanelTitle>
                        <p className="whitespace-pre-line text-foreground">
                            {encuentro.info_pago}
                        </p>
                    </section>
                )}

                {cierre ? (
                    <Cerrado cierre={cierre} encuentro={encuentro} />
                ) : (
                    <InscripcionForm
                        encuentro={encuentro}
                        tallas={tallas}
                        metodos={metodos}
                    />
                )}
            </div>
        </PublicLayout>
    );
}

function Cerrado({
    cierre,
    encuentro,
}: {
    cierre: NonNullable<Cierre>;
    encuentro: EncuentroPublico;
}) {
    const mensaje =
        cierre === 'antes' && encuentro.inscripciones_desde
            ? `Las inscripciones abren el ${formatDate(encuentro.inscripciones_desde)}.`
            : cierre === 'cupo'
              ? 'Se llenó el cupo de este encuentro.'
              : 'Las inscripciones de este encuentro están cerradas.';

    return (
        <section className="flex items-start gap-3 panel p-5">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-foreground">{mensaje}</p>
        </section>
    );
}

function InscripcionForm({
    encuentro,
    tallas,
    metodos,
}: {
    encuentro: EncuentroPublico;
    tallas: string[];
    metodos: string[];
}) {
    const form = useForm({
        nombre: '',
        apelido: '',
        grupo: '',
        profesor: '',
        graduacion: '',
        ciudad: '',
        telefono: '',
        email: '',
        talla: '',
        emergencia_nombre: '',
        emergencia_telefono: '',
        precio_id:
            encuentro.precios.length === 1 ? encuentro.precios[0].id : '',
        consentimiento: false,
        // "Ya pagué" (opcional): el pago queda por revisar.
        ya_pague: false,
        pago_monto: '',
        pago_metodo: '',
        pago_nota: '',
        pago_comprobante: null as File | null,
        // Trampa para bots: oculto, una persona no lo llena.
        sitio_web: '',
    });
    const { data } = form;
    const elegido = encuentro.precios.find((p) => p.id === data.precio_id);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Con errores se queda donde está; la confirmación abre arriba.
        form.post(`${encuentro.base}/inscripcion`, {
            forceFormData: true,
            preserveScroll: (page) =>
                Object.keys(page.props.errors ?? {}).length > 0,
        });
    };

    const text = (
        name: keyof typeof data,
        label: string,
        opts: {
            required?: boolean;
            type?: string;
            placeholder?: string;
            max?: number;
            autoComplete?: string;
        } = {},
    ) => (
        <Field label={label} htmlFor={name} required={opts.required}>
            <Input
                id={name}
                type={opts.type ?? 'text'}
                value={data[name] as string}
                onChange={(e) => form.setData(name, e.target.value)}
                required={opts.required}
                maxLength={opts.max ?? 120}
                placeholder={opts.placeholder}
                autoComplete={opts.autoComplete}
                aria-invalid={form.errors[name] ? true : undefined}
            />
        </Field>
    );

    return (
        <section className="space-y-5 panel p-5 sm:p-6">
            <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                    Inscríbete
                </h2>
                {encuentro.inscripciones_hasta && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Inscripciones abiertas hasta el{' '}
                        {formatDate(encuentro.inscripciones_hasta)}.
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                    {text('nombre', 'Nombre completo', {
                        required: true,
                        autoComplete: 'name',
                    })}
                    {text('apelido', 'Apelido (opcional)', { max: 60 })}
                    {text('grupo', 'Grupo', { required: true })}
                    {text('profesor', 'Profesor (opcional)')}
                    {text('graduacion', 'Graduación (opcional)', {
                        max: 60,
                        placeholder: 'Ej.: corda azul',
                    })}
                    {text('ciudad', 'Ciudad', {
                        required: true,
                        max: 80,
                        autoComplete: 'address-level2',
                    })}
                    {text('telefono', 'Teléfono / WhatsApp', {
                        required: true,
                        type: 'tel',
                        max: 30,
                        autoComplete: 'tel',
                    })}
                    {text('email', 'Correo (opcional)', {
                        type: 'email',
                        max: 150,
                        autoComplete: 'email',
                    })}
                </div>

                <Field label="Talla de camiseta (opcional)" htmlFor="talla">
                    <select
                        id="talla"
                        value={data.talla}
                        onChange={(e) => form.setData('talla', e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground sm:w-48"
                    >
                        <option value="">No aplica</option>
                        {tallas.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    {text('emergencia_nombre', 'Contacto de emergencia', {
                        required: true,
                        placeholder: 'Nombre',
                    })}
                    {text('emergencia_telefono', 'Teléfono de emergencia', {
                        required: true,
                        type: 'tel',
                        max: 30,
                    })}
                </div>

                <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm font-medium">
                        Opción de inscripción *
                    </legend>
                    {encuentro.precios.map((p) => (
                        <label
                            key={p.id}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                data.precio_id === p.id
                                    ? 'border-primary/60 bg-primary/5'
                                    : 'border-border',
                            )}
                        >
                            <input
                                type="radio"
                                name="precio_id"
                                value={p.id}
                                checked={data.precio_id === p.id}
                                onChange={() => form.setData('precio_id', p.id)}
                                className="mt-1 h-4 w-4 accent-[var(--primary)]"
                            />
                            <span className="flex-1">
                                <span className="block font-medium text-foreground">
                                    {p.nombre}
                                </span>
                                {p.descripcion && (
                                    <span className="block text-sm text-muted-foreground">
                                        {p.descripcion}
                                    </span>
                                )}
                            </span>
                            <span className="font-medium text-foreground">
                                {formatMoney(p.valor)}
                            </span>
                        </label>
                    ))}
                </fieldset>

                <div className="space-y-3 rounded-lg border border-border p-3">
                    <label className="flex items-start gap-3 text-sm text-foreground">
                        <input
                            type="checkbox"
                            checked={data.ya_pague}
                            onChange={(e) =>
                                form.setData((d) => ({
                                    ...d,
                                    ya_pague: e.target.checked,
                                    // Propone el valor de la opción elegida.
                                    pago_monto:
                                        d.pago_monto ||
                                        (elegido
                                            ? elegido.valor.toString()
                                            : ''),
                                }))
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span>
                            Ya pagué (todo o una parte) y tengo el comprobante
                            <span className="block text-xs text-muted-foreground">
                                Si pagas después, podrás mandar el comprobante
                                desde el enlace de tu inscripción.
                            </span>
                        </span>
                    </label>
                    {data.ya_pague && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                                label="Cuánto pagaste ($)"
                                htmlFor="pago_monto"
                                required
                            >
                                <Input
                                    id="pago_monto"
                                    type="number"
                                    min={1}
                                    step={1000}
                                    value={data.pago_monto}
                                    onChange={(e) =>
                                        form.setData(
                                            'pago_monto',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Cómo pagaste (opcional)"
                                htmlFor="pago_metodo"
                            >
                                <select
                                    id="pago_metodo"
                                    value={data.pago_metodo}
                                    onChange={(e) =>
                                        form.setData(
                                            'pago_metodo',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                                >
                                    <option value="">—</option>
                                    {metodos.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <Field
                                    label="Comprobante (foto o PDF, máx. 10 MB)"
                                    htmlFor="pago_comprobante"
                                    required
                                >
                                    <input
                                        id="pago_comprobante"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) =>
                                            form.setData(
                                                'pago_comprobante',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}
                </div>

                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={data.consentimiento}
                        onChange={(e) =>
                            form.setData('consentimiento', e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span>
                        Autorizo a Gaia Capoeira – Areia no Mar a usar mis datos
                        personales solo para gestionar mi inscripción a este
                        encuentro (Ley 1581 de 2012). Puedo pedir a los
                        organizadores que los corrijan o los borren. *
                    </span>
                </label>

                {/* Trampa para bots: fuera de la vista y del teclado. */}
                <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                >
                    <label>
                        Sitio web
                        <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={data.sitio_web}
                            onChange={(e) =>
                                form.setData('sitio_web', e.target.value)
                            }
                        />
                    </label>
                </div>

                <FormError message={Object.values(form.errors)[0]} />

                <SubmitButton
                    processing={form.processing}
                    pendingLabel="Enviando…"
                    className="w-full sm:w-auto"
                >
                    Inscribirme
                </SubmitButton>
            </form>
        </section>
    );
}

function Field({
    label,
    htmlFor,
    required,
    children,
}: {
    label: string;
    htmlFor: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>
                {label}
                {required && ' *'}
            </Label>
            {children}
        </div>
    );
}
