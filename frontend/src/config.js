const env = import.meta.env;

export const API_URL = env.VITE_API_URL || 'http://localhost:4000/api';

export const AUTH_COVER_URL = env.VITE_AUTH_COVER_URL || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80';
