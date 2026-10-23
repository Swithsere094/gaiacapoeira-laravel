/** Documento de política (con archivo adjunto opcional). */
export interface PoliticaDoc {
    id: string;
    title: string;
    content: string | null;
    category: string | null;
    file_url: string | null;
    file_name: string | null;
    created_at: string;
}
