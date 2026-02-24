// In production on Coolify, the frontend is served by the same server as the API.
// So we use a relative path "/api" - no need for a full URL.
// In development, we use the localhost dev server.
const envUrl = import.meta.env.VITE_API_URL;

let finalUrl;
if (envUrl) {
    // Explicitly set via environment variable
    finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
} else if (import.meta.env.PROD) {
    // Production build without VITE_API_URL: use relative path (same server)
    finalUrl = '/api';
} else {
    // Local development
    finalUrl = 'http://localhost:3000/api';
}

export const API_URL = finalUrl;

console.log('✅ API Configured:', API_URL);
