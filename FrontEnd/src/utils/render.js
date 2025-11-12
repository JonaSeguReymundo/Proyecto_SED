export async function renderHTMLInto(selector, pagePath) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await fetch(pagePath);
    const html = await response.text();
    container.innerHTML = html;
  } catch {
    container.innerHTML = `<p class="card">Error al cargar la página.</p>`;
  }
}
