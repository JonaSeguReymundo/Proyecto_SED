export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  PATHS: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/profile',          // ruta protegida GET
    adminArea: '/admin/area'      // opcional (solo admins)
  }
};

export const FIELDS = {
  login:   { user: 'username', pass: 'password' },
  registerFields: ['username', 'password', 'role']
};
