import { useState } from 'react';
import { SectionLayout } from '@/components/section-layout';
import {
    BookOpen,
    Volume2,
    CheckCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
    {
        id: '1',
        title: 'Saludos y Expresiones Básicas',
        level: 'Básico',
        description: 'Aprende las expresiones más comunes usadas en la roda',
        vocabulary: [
            {
                portuguese: 'Axé',
                spanish: 'Energía positiva / Saludo',
                pronunciation: 'a-shé',
            },
            {
                portuguese: 'Boa tarde',
                spanish: 'Buenas tardes',
                pronunciation: 'bó-a tar-dji',
            },
            {
                portuguese: 'Obrigado / Obrigada',
                spanish: 'Gracias (masc/fem)',
                pronunciation: 'o-bri-gá-do',
            },
            {
                portuguese: 'Como vai?',
                spanish: '¿Cómo estás?',
                pronunciation: 'kó-mo vái',
            },
            {
                portuguese: 'Tudo bem',
                spanish: 'Todo bien',
                pronunciation: 'tú-do bein',
            },
            {
                portuguese: 'Mestre',
                spanish: 'Maestro',
                pronunciation: 'més-tre',
            },
            {
                portuguese: 'Aluno',
                spanish: 'Alumno',
                pronunciation: 'a-lú-no',
            },
        ],
    },
    {
        id: '2',
        title: 'Comandos en la Roda',
        level: 'Básico',
        description: 'Frases importantes que escucharás durante el juego',
        vocabulary: [
            { portuguese: 'Joga!', spanish: '¡Juega!', pronunciation: 'jó-ga' },
            {
                portuguese: 'Compra o jogo',
                spanish: 'Compra el juego (entra)',
                pronunciation: 'kóm-pra o jó-go',
            },
            {
                portuguese: 'Iê!',
                spanish: 'Llamada de atención',
                pronunciation: 'i-é',
            },
            {
                portuguese: 'Volta ao mundo',
                spanish: 'Vuelta al mundo',
                pronunciation: 'vól-ta ao mún-do',
            },
            {
                portuguese: 'Mais devagar',
                spanish: 'Más despacio',
                pronunciation: 'máis de-va-gár',
            },
            {
                portuguese: 'Cuidado',
                spanish: 'Cuidado',
                pronunciation: 'kui-dá-do',
            },
        ],
    },
    {
        id: '3',
        title: 'Instrumentos Musicales',
        level: 'Básico',
        description: 'Nombres de los instrumentos tradicionales',
        vocabulary: [
            {
                portuguese: 'Berimbau',
                spanish: 'Berimbau (instrumento principal)',
                pronunciation: 'be-rim-báu',
            },
            {
                portuguese: 'Pandeiro',
                spanish: 'Pandero',
                pronunciation: 'pan-déi-ro',
            },
            {
                portuguese: 'Atabaque',
                spanish: 'Atabaque (tambor)',
                pronunciation: 'a-ta-bá-ke',
            },
            {
                portuguese: 'Agogô',
                spanish: 'Agogó (campanas)',
                pronunciation: 'a-go-gó',
            },
            {
                portuguese: 'Reco-reco',
                spanish: 'Güiro',
                pronunciation: 'ré-ko ré-ko',
            },
            {
                portuguese: 'Caxixi',
                spanish: 'Caxixi (maraca)',
                pronunciation: 'ka-shi-shí',
            },
        ],
    },
    {
        id: '4',
        title: 'Partes del Cuerpo',
        level: 'Intermedio',
        description: 'Vocabulario esencial para entender las técnicas',
        vocabulary: [
            {
                portuguese: 'Cabeça',
                spanish: 'Cabeza',
                pronunciation: 'ka-bé-sa',
            },
            { portuguese: 'Mão', spanish: 'Mano', pronunciation: 'máun' },
            { portuguese: 'Perna', spanish: 'Pierna', pronunciation: 'pér-na' },
            { portuguese: 'Pé', spanish: 'Pie', pronunciation: 'pé' },
            {
                portuguese: 'Joelho',
                spanish: 'Rodilla',
                pronunciation: 'jo-é-lho',
            },
            {
                portuguese: 'Cotovelo',
                spanish: 'Codo',
                pronunciation: 'ko-to-vé-lo',
            },
            {
                portuguese: 'Quadril',
                spanish: 'Cadera',
                pronunciation: 'kua-dríl',
            },
        ],
    },
    {
        id: '5',
        title: 'Nombres de Movimientos',
        level: 'Intermedio',
        description: 'Significado de los nombres de las técnicas',
        vocabulary: [
            {
                portuguese: 'Ginga',
                spanish: 'Balanceo / Vaivén',
                pronunciation: 'jín-ga',
            },
            {
                portuguese: 'Meia lua',
                spanish: 'Media luna',
                pronunciation: 'méi-a lú-a',
            },
            {
                portuguese: 'Armada',
                spanish: 'Armada (flota naval)',
                pronunciation: 'ar-má-da',
            },
            { portuguese: 'Queda', spanish: 'Caída', pronunciation: 'ké-da' },
            {
                portuguese: 'Esquiva',
                spanish: 'Esquiva',
                pronunciation: 'es-kí-va',
            },
            {
                portuguese: 'Rasteira',
                spanish: 'Barrido (de rastro)',
                pronunciation: 'ras-téi-ra',
            },
            {
                portuguese: 'Macaco',
                spanish: 'Mono',
                pronunciation: 'ma-ká-ko',
            },
        ],
    },
    {
        id: '6',
        title: 'Frases de las Canciones',
        level: 'Avanzado',
        description: 'Expresiones comunes en las ladainhas y corridos',
        vocabulary: [
            {
                portuguese: 'Camará',
                spanish: 'Camarada / Compañero',
                pronunciation: 'ka-ma-rá',
            },
            {
                portuguese: 'Paraná',
                spanish: 'Referencia al río o región',
                pronunciation: 'pa-ra-ná',
            },
            {
                portuguese: 'Ê, maior é Deus',
                spanish: 'Eh, más grande es Dios',
                pronunciation: 'é, mai-ór é déus',
            },
            {
                portuguese: 'Vou me embora',
                spanish: 'Me voy',
                pronunciation: 'vou me em-bó-ra',
            },
            {
                portuguese: 'Valha-me Deus',
                spanish: 'Válgame Dios',
                pronunciation: 'vá-lha-me déus',
            },
            {
                portuguese: 'Dona Maria',
                spanish: 'Señora María',
                pronunciation: 'dó-na ma-rí-a',
            },
        ],
    },
];

const levelColors = {
    Básico: 'bg-accent text-accent-foreground',
    Intermedio: 'bg-chart-4 text-primary-foreground',
    Avanzado: 'bg-chart-3 text-primary-foreground',
};

export default function PortuguesPage() {
    const [expandedLesson, setExpandedLesson] = useState<string | null>('1');
    const [completedWords, setCompletedWords] = useState<Set<string>>(
        new Set(),
    );

    const toggleWord = (wordId: string) => {
        const newCompleted = new Set(completedWords);
        if (newCompleted.has(wordId)) {
            newCompleted.delete(wordId);
        } else {
            newCompleted.add(wordId);
        }
        setCompletedWords(newCompleted);
    };

    const totalWords = lessons.reduce(
        (acc, lesson) => acc + lesson.vocabulary.length,
        0,
    );
    const progress = Math.round((completedWords.size / totalWords) * 100);

    return (
        <SectionLayout
            title="Aprende Portugués"
            description="Sistema de aprendizaje del idioma portugués enfocado en el vocabulario y expresiones de la capoeira."
        >
            {/* Progress */}
            <div className="mb-8 rounded-xl bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="font-medium text-foreground">
                            Tu Progreso
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                        {progress}%
                    </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                    {completedWords.size} de {totalWords} palabras aprendidas
                </p>
            </div>

            {/* Lessons */}
            <div className="space-y-4">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="overflow-hidden rounded-xl bg-card"
                    >
                        {/* Lesson Header */}
                        <button
                            onClick={() =>
                                setExpandedLesson(
                                    expandedLesson === lesson.id
                                        ? null
                                        : lesson.id,
                                )
                            }
                            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-secondary/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                                    {lesson.id}
                                </div>
                                <div>
                                    <h2 className="font-serif text-lg font-bold text-card-foreground">
                                        {lesson.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {lesson.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-medium',
                                        levelColors[
                                            lesson.level as keyof typeof levelColors
                                        ],
                                    )}
                                >
                                    {lesson.level}
                                </span>
                                {expandedLesson === lesson.id ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {/* Vocabulary List */}
                        {expandedLesson === lesson.id && (
                            <div className="border-t border-border">
                                <div className="space-y-3 p-6">
                                    {lesson.vocabulary.map((word, index) => {
                                        const wordId = `${lesson.id}-${index}`;
                                        const isCompleted =
                                            completedWords.has(wordId);
                                        return (
                                            <div
                                                key={index}
                                                className={cn(
                                                    'flex items-center gap-4 rounded-lg p-4 transition-colors',
                                                    isCompleted
                                                        ? 'bg-accent/20'
                                                        : 'bg-secondary/50',
                                                )}
                                            >
                                                <button
                                                    onClick={() =>
                                                        toggleWord(wordId)
                                                    }
                                                    aria-label={
                                                        isCompleted
                                                            ? `Marcar "${word.portuguese}" como no aprendida`
                                                            : `Marcar "${word.portuguese}" como aprendida`
                                                    }
                                                    aria-pressed={isCompleted}
                                                    className={cn(
                                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                                        isCompleted
                                                            ? 'border-accent bg-accent text-accent-foreground'
                                                            : 'border-muted-foreground hover:border-primary',
                                                    )}
                                                >
                                                    {isCompleted && (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-baseline gap-2">
                                                        <span className="font-serif font-bold text-foreground">
                                                            {word.portuguese}
                                                        </span>
                                                        <span className="text-sm text-primary">
                                                            [
                                                            {word.pronunciation}
                                                            ]
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {word.spanish}
                                                    </p>
                                                </div>
                                                <button
                                                    className="shrink-0 rounded-full p-2 transition-colors hover:bg-secondary"
                                                    aria-label="Escuchar pronunciación"
                                                >
                                                    <Volume2 className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </SectionLayout>
    );
}
