// Development Mode Configuration Flag
// Set ENABLED to true to activate the Dev Panel in game, or pass ?dev=true in browser URL.

export const DEV_CONFIG = {
    ENABLED: true
};

export function isDevModeActive() {
    if (typeof window !== 'undefined') {
        if (window.DEV_MODE !== undefined) return Boolean(window.DEV_MODE);
        if (window.location && window.location.search && window.location.search.includes('dev=true')) return true;
        if (window.location && window.location.search && window.location.search.includes('dev=false')) return false;
    }
    return Boolean(DEV_CONFIG.ENABLED);
}
