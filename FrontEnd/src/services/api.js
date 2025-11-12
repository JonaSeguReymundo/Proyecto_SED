import { API } from '../config.js';
import { storage } from '../utils/storage.js';

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const url = `${API.BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = storage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const isJSON = res.headers.get('content-type')?.includes('application/json');
  const payload = isJSON ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = payload?.message || res.statusText;
    throw new Error(msg || 'Error de red');
  }

  return payload;
}

export const api = {
  get: (p, opt = {})    => request(p, { ...opt, method: 'GET' }),
  post: (p, b, opt={})  => request(p, { ...opt, method: 'POST', body: b }),
  put: (p, b, opt={})   => request(p, { ...opt, method: 'PUT', body: b }),
  del: (p, opt = {})    => request(p, { ...opt, method: 'DELETE' })
};
