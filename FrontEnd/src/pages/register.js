import { register } from '../services/authService.js';
import "../styles/register.css";


export function init() {
  const form = document.getElementById('registerForm');
  const msg  = document.getElementById('registerMsg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (password !== confirmPassword) {
      msg.textContent = 'Las contraseñas no coinciden.';
      msg.style.color = 'crimson';
      return;
    }

    // Política de contraseñas seguras
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      msg.textContent = 'La contraseña no cumple con los requisitos de seguridad.';
      msg.style.color = 'crimson';
      return;
    }

    const payload = {
      username: document.getElementById('username')?.value.trim(),
      password: password,
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
