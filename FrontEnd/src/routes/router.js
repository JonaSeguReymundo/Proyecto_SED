import { renderHTMLInto } from '../utils/render.js';
import { isAuthenticated } from '../services/authService.js';

const routes = {
  '/login':    { view: 'login' },
  '/register': { view: 'register' },
  '/home':     { view: 'home', protected: true }
};

function parseHash() {
  const h = location.hash || '#/login';
  return h.replace(/^#/, '');
}

async function loadRoute(path) {
  const route = routes[path] || routes['/login'];

  if (route.protected && !isAuthenticated()) {
    location.hash = '#/login';
    return;
  }

  await renderHTMLInto('#app', `/src/pages/${route.view}.html`);

  try {
    const mod = await import(`../pages/${route.view}.js`);
    if (typeof mod.init === 'function') mod.init();
  } catch (e) {
    console.error('Error al cargar script de la página', e);
  }
}

export function initRouter() {
  const go = () => loadRoute(parseHash());
  window.addEventListener('hashchange', go);
  go();
}
