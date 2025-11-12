import { logout, fetchProfile, fetchAdminArea } from '../services/authService.js';
import { storage } from '../utils/storage.js';

export function init() {
  const btnLogout = document.getElementById('btnLogout');
  const welcome   = document.getElementById('welcome');
  const profile   = document.getElementById('profile');
  const adminArea = document.getElementById('adminArea');
  const msg       = document.getElementById('homeMsg');

  btnLogout?.addEventListener('click', () => {
    logout();
    location.hash = '#/login';
  });

  const user = storage.getUser();
  if (user?.username) welcome.textContent = `Bienvenido, ${user.username}`;

  // Perfil protegido
  fetchProfile()
    .then((data) => {
      profile.textContent = JSON.stringify(data, null, 2);
    })
    .catch((e) => {
      msg.textContent = 'Error al obtener perfil: ' + e.message;
      msg.style.color = 'crimson';
    });

  // Área admin (solo si aplica)
  fetchAdminArea()
    .then((data) => {
      adminArea.textContent = JSON.stringify(data, null, 2);
    })
    .catch(() => {
      adminArea.textContent = 'No tienes permisos de admin.';
    });
}
