// Backend location. Set VITE_API_URL (e.g. https://scan2dine-api.onrender.com) in production.
// In local development it falls back to the backend on port 5000 of the same host.
const origin = (
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`
).replace(/\/+$/, '');

export const API_URL = `${origin}/api`;
export const SOCKET_URL = origin;
