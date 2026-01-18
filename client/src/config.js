const envUrl = import.meta.env.VITE_API_URL;
// Ajoute automatiquement "/api" s'il manque
const finalUrl = envUrl
    ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`)
    : 'http://localhost:3000/api';

export const API_URL = finalUrl;

console.log('✅ API Configured:', API_URL);
