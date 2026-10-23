/** Canción de Sabiá cantou. */
export interface Song {
    id: string;
    title: string;
    type: string;
    lyrics: string;
    translation: string | null;
    context: string | null;
    video_url: string | null;
    mestre: string | null;
    /** Los ritmos (la columna heredada se llama `tags`). */
    tags: string[] | null;
    nossa: boolean;
    created_at: string;
}
