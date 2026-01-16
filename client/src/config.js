const apiUrl = import.meta.env.VITE_API_URL;
console.log('DEBUG CONFIG - VITE_API_URL:', apiUrl);
console.log('DEBUG CONFIG - MODE:', import.meta.env.MODE);

export const API_URL = apiUrl || 'http://localhost:3000/api';
console.log('DEBUG CONFIG - FINAL API_URL:', API_URL);
