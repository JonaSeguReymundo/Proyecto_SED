import { API, FIELDS } from '../config.js';
import { api } from './api.js';
import { storage } from '../utils/storage.js';

export async function login({ username, password }) {
  const body = {};
  body[FIELDS.login.user] = username;
  body[FIELDS.login.pass] = password;

  const data = await api.post(API.PATHS.login, body);
  if (!data?.token) throw new Error('No se recibió token del servidor.');

  storage.setToken(data.token);
  if (data.user) storage.setUser(data.user);

  return data;
}

export async function register(payload) {
  const body = {};
  for (const k of FIELDS.registerFields) body[k] = payload[k];
  const data = await api.post(API.PATHS.register, body);
  return data;
}

export function logout() {
  storage.clearAll();
}

export async function fetchProfile() {
  return api.get(API.PATHS.profile, { auth: true });
}

export async function fetchAdminArea() {
  return api.get(API.PATHS.adminArea, { auth: true });
}

export function isAuthenticated() {
  return Boolean(storage.getToken());
}
