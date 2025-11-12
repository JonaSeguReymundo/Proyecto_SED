import { register } from '../services/authService.js';

export function init() {
  const form = document.getElementById('registerForm');
  const msg  = document.getElementById('registerMsg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const payload = {
      username: document.getElementById('username')?.value.trim(),
      password: document.getElementById('password')?.value,
      role: document.getElementById('role')?.value
    };

    try {
      const res = await register(payload);
      msg.textContent = res?.message || 'Registro exitoso. Ahora inicia sesión.';
      msg.style.color = 'green';
    } catch (err) {
      msg.textContent = 'Error: ' + err.message;
      msg.style.color = 'crimson';
    }
  });
}
