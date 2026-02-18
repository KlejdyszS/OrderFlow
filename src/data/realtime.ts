// ═══════════════════════════════════════════════════════
//  OrderFlow — Supabase Realtime Subscriptions
//  Live cross-PC updates without page refresh
// ═══════════════════════════════════════════════════════

import { supabase } from '../supabase';
import { refreshCurrentScreen, getActiveRoute } from '../router';
import { showToast } from '../components/toast';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let suppressUntil = 0;

/**
 * Temporarily suppress realtime refreshes for the specified duration (ms).
 * Useful when we perform a local optimistic update and don't want the 
 * immediate DB change event to trigger a redundant re-render.
 */
export function suppressRefresh(duration = 1000) {
    suppressUntil = Date.now() + duration;
}

/**
 * Debounced screen refresh — batches rapid DB changes (e.g. multiple variants updated)
 * into a single re-render after 300ms of quiet.
 * Skips refresh on the Create Order screen to avoid losing form input.
 */
function handleChange(table: string) {
    const activeRoute = getActiveRoute();

    // Don't refresh if user is filling out the create form
    if (activeRoute === 'create') return;

    // Skip if suppression is active (local update just happened)
    if (Date.now() < suppressUntil) {
        console.log(`[Realtime] Suppression active — skipping refresh for "${table}"`);
        return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        console.log(`[Realtime] Change on "${table}" — refreshing screen`);
        // We only show toast if it's likely a remote change (not our own)
        // Adjust threshold if needed
        refreshCurrentScreen();
        showToast('Dane zaktualizowane', 'info');
    }, 600); // 600ms debounce to allow more complex transactions to finish
}

/**
 * Start listening to Supabase Realtime changes on key tables.
 * Call once on app init.
 */
export function startRealtime(): void {
    const channel = supabase
        .channel('orderflow-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => handleChange('orders'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_variants' }, () => handleChange('order_variants'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_logs' }, () => handleChange('order_logs'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stages' }, () => handleChange('stages'))
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Connected — listening for changes');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('[Realtime] Channel error — will retry automatically');
            }
        });

    // Store reference for potential cleanup
    (window as any).__orderflow_channel = channel;
}
