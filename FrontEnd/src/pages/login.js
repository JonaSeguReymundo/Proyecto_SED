import { login } from '../services/authService.js';

export function init() {
  const form = document.getElementById('loginForm');
  const msg  = document.getElementById('loginMsg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;

    try {
      await login({ username, password });
      location.hash = '#/home';
    } catch (err) {
      msg.textContent = 'Error: ' + err.message;
      msg.style.color = 'crimson';
    }
  });
}

