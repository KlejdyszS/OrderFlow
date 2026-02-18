// ═══════════════════════════════════════════════════════
//  OrderFlow — Hash-based SPA Router
// ═══════════════════════════════════════════════════════

type RouteHandler = (params: Record<string, string>) => HTMLElement | Promise<HTMLElement>;

interface Route {
    pattern: RegExp;
    paramNames: string[];
    handler: RouteHandler;
}

const routes: Route[] = [];
let currentScreen: HTMLElement | null = null;

export function route(path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const pattern = path.replace(/:(\w+)/g, (_: string, name: string) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    routes.push({ pattern: new RegExp(`^${pattern}$`), paramNames, handler });
}

export function navigate(path: string): void {
    window.location.hash = path;
}

export function getCurrentPath(): string {
    return window.location.hash.slice(1) || '/dashboard';
}

export function getActiveRoute(): string {
    const path = getCurrentPath();
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/pipeline')) return 'pipeline';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/create')) return 'create';
    if (path.startsWith('/order')) return 'order';
    return 'dashboard';
}

async function resolveRoute(): Promise<void> {
    const path = getCurrentPath();
    for (const r of routes) {
        const match = path.match(r.pattern);
        if (match) {
            const params: Record<string, string> = {};
            r.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });

            const app = document.getElementById('app');
            if (!app) return;

            // Optional: add loading overlay here if it takes too long
            const screen = await r.handler(params);

            if (currentScreen) {
                currentScreen.style.animation = 'none';
            }
            app.innerHTML = '';
            app.appendChild(screen);
            currentScreen = screen;
            window.scrollTo(0, 0);
            return;
        }
    }
    // fallback to dashboard
    navigate('/dashboard');
}

export function startRouter(): void {
    window.addEventListener('hashchange', () => {
        resolveRoute().catch(console.error);
    });
    resolveRoute().catch(console.error);
}

/**
 * Re-render the current screen without changing the URL or scrolling.
 * Used by Supabase Realtime to refresh the view when remote changes arrive.
 */
export function refreshCurrentScreen(): void {
    const path = getCurrentPath();
    for (const r of routes) {
        const match = path.match(r.pattern);
        if (match) {
            const params: Record<string, string> = {};
            r.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });

            const app = document.getElementById('app');
            if (!app) return;

            const scrollY = window.scrollY;
            Promise.resolve(r.handler(params)).then(screen => {
                app.innerHTML = '';
                app.appendChild(screen);
                currentScreen = screen;
                window.scrollTo(0, scrollY); // preserve scroll position
            }).catch(console.error);
            return;
        }
    }
}
