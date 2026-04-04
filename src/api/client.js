// =====================================================
// Arbitraje Pro — API Client
// Centraliza todas las llamadas al backend Express
// =====================================================

const BASE = 'https://arbitrajepro-production.up.railway.app';

export async function api(endpoint, body = null, method = null) {
  const resolvedMethod = method || (body ? 'POST' : 'GET');

  const opts = {
    method: resolvedMethod,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${endpoint}`, opts);
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error del servidor');
  }

  return data;
}