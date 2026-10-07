import type { Auth } from '@/types';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash: {
                success?: string | null;
                error?: string | null;
                tempPassword?: string | null;
            };
            [key: string]: unknown;
        };
    }
}
