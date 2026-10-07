/** Usuario con sesión. Misma forma que `AppUser` del sitio original. */
export interface AppUser {
    id: string;
    username: string;
    name: string;
    email: string | null;
    role: 'admin' | 'member';
    apodo: string | null;
    avatar: string | null;
}

export interface Auth {
    user: AppUser | null;
}
