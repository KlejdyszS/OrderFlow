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
 * Uses a more seamless replacement strategy than full app.innerHTML reset.
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

            // ── Capture all scroll positions ──
            const scrolls: Map<string, number> = new Map();
            const scrollableElements = Array.from(app.querySelectorAll('*')).filter(el => {
                const style = window.getComputedStyle(el);
                return style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                    style.overflowX === 'auto' || style.overflowX === 'scroll';
            }) as HTMLElement[];

            scrollableElements.forEach((el, idx) => {
                // We use a generated unique selector or path if ID is missing
                const key = el.id ? `#${el.id}` : `[data-scroll-idx="${idx}"]`;
                if (!el.id) el.setAttribute('data-scroll-idx', idx.toString());
                scrolls.set(key, el.scrollTop);
            });
            const windowScrollY = window.scrollY;
            const windowScrollX = window.scrollX;

            Promise.resolve(r.handler(params)).then(screen => {
                if (currentScreen) {
                    currentScreen.replaceWith(screen);
                } else {
                    app.innerHTML = '';
                    app.appendChild(screen);
                }
                currentScreen = screen;

                // ── Restore scroll positions ──
                scrolls.forEach((val, key) => {
                    const el = screen.querySelector(key) || document.querySelector(key);
                    if (el) el.scrollTop = val;
                });
                window.scrollTo(windowScrollX, windowScrollY);
            }).catch(console.error);
            return;
        }
    }
}
