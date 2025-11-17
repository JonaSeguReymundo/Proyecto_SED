// src/pages/home.js
import { api } from "../services/api.js";
import { logout } from "../services/authService.js";

/* UTILIDADES */
const $  = (id)  => document.getElementById(id);
const q  = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

/* ESTADO EN MEMORIA */
let carsCache = [];
let bookingsCache = [];
let isAdminGlobal = false;
let activeCarForReservation = null;
let editingBookingId = null;

/* =============================== */
/* ============ INIT ============= */
/* =============================== */

// El router llama a init() después de inyectar el HTML
export function init() {
  initHome();
}

async function initHome() {
  setCurrentDate();
  setupTabs();
  setupLogout();
  setupNewCarForm();
  setupReservationModal();

  try {
    // PERFIL
    const profile = await api.get("/profile");
    applyProfile(profile);

    const role = profile.user?.role;
    const isAdmin = role === "admin" || role === "superadmin";
    isAdminGlobal = isAdmin;

    // CARGA INICIAL DE DATOS
    carsCache     = await loadCars();
    bookingsCache = await loadBookings(isAdmin);
    const logs    = isAdmin ? await loadLogs() : [];
    const adminArea = isAdmin ? await loadAdminArea() : null;

    // RENDER DASHBOARD
    renderDashboard(carsCache, bookingsCache, logs);

    // AUTOS (tarjetas)
    renderCarsCards(carsCache, isAdmin);

    // RESERVAS (tarjetas)
    renderBookingsCards(bookingsCache, carsCache, isAdmin);

    // LOGS
    if (isAdmin) renderLogsTable(logs);

    // ADMIN
    if (isAdmin) renderAdminInfo(profile, adminArea);

    $("homeMsg").textContent = "Datos cargados correctamente.";
  } catch (e) {
    console.error(e);
    $("homeMsg").textContent = "Error al cargar datos del sistema.";
  }
}

/* =============================== */
/* ========= FORMATOS ============ */
/* =============================== */

function setCurrentDate() {
  const now = new Date();
  const el = $("currentDate");
  if (!el) return;
  el.textContent = now.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-ES");
}

function toInputDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

/* =============================== */
/* ========= PERFIL ============== */
/* =============================== */

function applyProfile(profile) {
  const user = profile.user;
  $("welcomeTitle").textContent    = `Bienvenido, ${user.username}`;
  $("welcomeSubtitle").textContent = `Rol: ${user.role}`;

  const initials = user.username
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  $("userAvatar").textContent = initials;

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  qa(".admin-only").forEach((el) => (el.style.display = isAdmin ? "" : "none"));
}

/* =============================== */
/* ========== TABS =============== */
/* =============================== */

function setupTabs() {
  qa(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      qa(".tab-button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      qa(".tab-content").forEach((c) =>
        c.classList.toggle("active", c.id === `tab-${tab}`)
      );
    });
  });
}

/* =============================== */
/* ========= CARGAR DATOS ======== */
/* =============================== */

async function loadCars() {
  try {
    return await api.get("/cars");
  } catch {
    return [];
  }
}

async function loadBookings(isAdmin) {
  try {
    if (isAdmin) return await api.get("/bookings/all");
    return await api.get("/bookings");
  } catch {
    return [];
  }
}

async function loadLogs() {
  try {
    return await api.get("/logs");
  } catch {
    return [];
  }
}

async function loadAdminArea() {
  try {
    return await api.get("/admin/area");
  } catch {
    return null;
  }
}

/* =============================== */
/* ===== DASHBOARD + JOIN ======== */
/* =============================== */

function renderDashboard(cars, bookings, logs) {
  const totalCarsEl      = $("metricTotalCars");
  const totalBookingsEl  = $("metricTotalBookings");
  const totalLogsEl      = $("metricTotalLogs");

  if (totalCarsEl)     totalCarsEl.textContent = cars.length;
  if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;
  if (totalLogsEl)     totalLogsEl.textContent = logs.length;

  // JOIN bookings + cars (solo las últimas 5)
  const tbody = q("#dashboardBookingsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  bookings.slice(0, 5).forEach((b) => {
    const car = cars.find((c) => c._id === b.carId);
    const carName = car ? `${car.brand} ${car.model}` : b.carId;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${carName}</td>
      <td>${formatDate(b.startDate)}</td>
      <td>${formatDate(b.endDate)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Autos destacados
  const ul = $("dashboardCarsList");
  if (!ul) return;
  ul.innerHTML = "";

  cars.slice(0, 5).forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${c.brand} ${c.model} · ${c.type} · $${c.pricePerDay}/día`;
    ul.appendChild(li);
  });
}

/* =============================== */
/* ========== AUTOS ============== */
/* =============================== */

function renderCarsCards(cars, isAdmin) {
  const container = $("carsCardsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!cars.length) {
    container.innerHTML = `<p class="empty-text">No hay autos registrados.</p>`;
    return;
  }

  cars.forEach((car) => {
    const card = document.createElement("article");
    card.className = "car-card";

    const availableText = car.available ? "Disponible" : "No disponible";
    const availableClass = car.available ? "status-available" : "status-unavailable";

    card.innerHTML = `
      <div class="car-card-main">
        <div>
          <h3>${car.brand} ${car.model}</h3>
          <p class="car-subtitle">${car.type}</p>
          <p class="car-price">$${car.pricePerDay} / día</p>
        </div>
      </div>
      <div class="car-card-actions">
        <span class="status-pill ${availableClass}">${availableText}</span>
        <div class="car-card-buttons">
          <button 
            class="btn btn-primary btn-reserve-car" 
            data-id="${car._id}"
          >
            Reservar
          </button>
          ${
            isAdmin
              ? `<button class="btn btn-secondary btn-delete-car" data-id="${car._id}">
                   Eliminar
                 </button>`
              : ""
          }
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Delegación de eventos para botones de reservar / eliminar
  container.onclick = async (e) => {
    const reserveBtn = e.target.closest(".btn-reserve-car");
    const deleteBtn  = e.target.closest(".btn-delete-car");

    // Reservar
    if (reserveBtn) {
      console.log("Click en Reservar");
      const id = reserveBtn.dataset.id;
      const car = carsCache.find((c) => c._id === id);
      console.log("Auto seleccionado:", car);
      if (!car) return;
      
      if (!car.available) {
      alert("Este auto no está disponible para reservar.");
      return;
      }

      openReservationModal({ mode: "create", car });
      return;
    }

    // Eliminar auto (solo admins)
    if (deleteBtn) {
      if (!confirm("¿Eliminar auto?")) return;
      const id = deleteBtn.dataset.id;
      await api.delete(`/cars/${id}`);
      carsCache = await loadCars();
      renderCarsCards(carsCache, isAdminGlobal);
      // recargamos también dashboard
      renderDashboard(carsCache, bookingsCache, []);
    }
  };
}

/* FORMULARIO NUEVO AUTO (ADMIN) */

function setupNewCarForm() {
  const btnToggle = $("btnToggleNewCar");
  const form      = $("newCarForm");
  const btnCancel = $("btnCancelNewCar");

  if (!btnToggle || !form || !btnCancel) return;

  btnToggle.onclick = () => form.classList.toggle("hidden");
  btnCancel.onclick = () => form.classList.add("hidden");

  form.onsubmit = async (e) => {
    e.preventDefault();

    const brand       = $("carBrand").value.trim();
    const model       = $("carModel").value.trim();
    const type        = $("carType").value.trim();
    const pricePerDay = Number($("carPrice").value);

    if (!brand || !model || !type || !pricePerDay) {
      alert("Completa todos los campos del auto.");
      return;
    }

    await api.post("/cars", { brand, model, type, pricePerDay });

    form.reset();
    form.classList.add("hidden");

    carsCache = await loadCars();
    renderCarsCards(carsCache, isAdminGlobal);
    renderDashboard(carsCache, bookingsCache, []);
  };
}

/* =============================== */
/* ========== RESERVAS =========== */
/* =============================== */

function renderBookingsCards(bookings, cars, isAdmin) {
  const container = $("bookingsCardsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!bookings.length) {
    container.innerHTML = `<p class="empty-text">No tienes reservas registradas.</p>`;
    return;
  }

  bookings.forEach((b) => {
    const car = cars.find((c) => c._id === b.carId);
    const carName = car ? `${car.brand} ${car.model}` : b.carId;

    const card = document.createElement("article");
    card.className = "booking-card";

    card.innerHTML = `
      <div class="booking-main">
        <h3>${carName}</h3>
        <p class="booking-id">ID: ${b._id}</p>
        <p class="booking-dates">
          Desde: <strong>${formatDate(b.startDate)}</strong> · 
          Hasta: <strong>${formatDate(b.endDate)}</strong>
        </p>
        <p class="booking-total">Total: $${b.totalPrice}</p>
      </div>
      <div class="booking-actions">
        <button class="btn btn-secondary btn-edit-booking" data-id="${b._id}">
          Modificar
        </button>
        <button class="btn btn-outline btn-cancel-booking" data-id="${b._id}">
          Cancelar
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  container.onclick = async (e) => {
    const editBtn   = e.target.closest(".btn-edit-booking");
    const cancelBtn = e.target.closest(".btn-cancel-booking");

    // Modificar reserva
    if (editBtn) {
      const id = editBtn.dataset.id;
      const booking = bookingsCache.find((b) => b._id === id);
      if (!booking) return;

      const car = carsCache.find((c) => c._id === booking.carId);
      openReservationModal({ mode: "edit", car, booking });
      return;
    }

    // Cancelar reserva
    if (cancelBtn) {
      const id = cancelBtn.dataset.id;
      if (!confirm("¿Cancelar esta reserva?")) return;

      await api.delete(`/bookings/${id}`);

      // recargar reservas y autos
      bookingsCache = await loadBookings(isAdminGlobal);
      carsCache     = await loadCars();
      renderBookingsCards(bookingsCache, carsCache, isAdminGlobal);
      renderCarsCards(carsCache, isAdminGlobal);
      renderDashboard(carsCache, bookingsCache, []);
    }
  };
}

/* =============================== */
/* ===== MODAL DE RESERVAS ======= */
/* =============================== */

function setupReservationModal() {
  const modal        = $("reservationModal");
  const btnClose     = $("btnCloseReservation");
  const form         = $("reservationForm");
  const startInput   = $("resStartDate");
  const endInput     = $("resEndDate");

  if (!modal || !btnClose || !form) return;

  btnClose.onclick = () => closeReservationModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeCarForReservation) return;

    const startDate = startInput.value;
    const endDate   = endInput.value;
    const errorEl   = $("reservationError");
    errorEl.textContent = "";

    if (!startDate || !endDate) {
      errorEl.textContent = "Debes seleccionar ambas fechas.";
      return;
    }

    const days = diffDays(startDate, endDate);
    if (days <= 0) {
      errorEl.textContent = "El rango de fechas no es válido.";
      return;
    }

    // Validar que no se sobreponga con otras reservas de este auto
    if (hasOverlappingBooking(activeCarForReservation._id, startDate, endDate, editingBookingId)) {
      errorEl.textContent = "El auto ya tiene una reserva en ese rango de fechas.";
      return;
    }

    try {
      if (editingBookingId) {
        // Actualizar reserva existente
        await api.put(`/bookings/${editingBookingId}`, { startDate, endDate });
      } else {
        // Nueva reserva
        await api.post("/bookings", {
          carId: activeCarForReservation._id,
          startDate,
          endDate,
        });
      }

      // Recargar datos
      bookingsCache = await loadBookings(isAdminGlobal);
      carsCache     = await loadCars();

      renderBookingsCards(bookingsCache, carsCache, isAdminGlobal);
      renderCarsCards(carsCache, isAdminGlobal);
      renderDashboard(carsCache, bookingsCache, []);

      closeReservationModal();
    } catch (err) {
      console.error(err);
      errorEl.textContent = err.message || "Error al guardar la reserva.";
    }
  };

  const updatePrice = () => {
    const priceEl = $("resTotalPrice");
    const errorEl = $("reservationError");
    errorEl.textContent = "";

    if (!activeCarForReservation) {
      priceEl.textContent = "$0.00";
      return;
    }

    const startDate = startInput.value;
    const endDate   = endInput.value;
    if (!startDate || !endDate) {
      priceEl.textContent = "$0.00";
      return;
    }

    const days = diffDays(startDate, endDate);
    if (days <= 0) {
      priceEl.textContent = "$0.00";
      return;
    }

    const total = days * activeCarForReservation.pricePerDay;
    priceEl.textContent = `$${total.toFixed(2)}`;
  };

  startInput.onchange = updatePrice;
  endInput.onchange   = updatePrice;
}

function openReservationModal({ mode, car, booking }) {
  const modal      = $("reservationModal");
  const titleEl    = $("reservationModalTitle");
  const carNameEl  = $("resCarName");
  const carIdEl    = $("resCarId");
  const bookingIdEl= $("resBookingId");
  const startInput = $("resStartDate");
  const endInput   = $("resEndDate");
  const priceEl    = $("resTotalPrice");
  const errorEl    = $("reservationError");

  activeCarForReservation = car || carsCache.find((c) => c._id === booking?.carId) || null;
  editingBookingId = mode === "edit" && booking ? booking._id : null;

  if (!activeCarForReservation) return;

  titleEl.textContent = mode === "edit" ? "Modificar reserva" : "Nueva reserva";
  carNameEl.value     = `${activeCarForReservation.brand} ${activeCarForReservation.model}`;
  carIdEl.value       = activeCarForReservation._id;
  bookingIdEl.value   = editingBookingId || "";

  if (booking) {
    startInput.value = toInputDate(booking.startDate);
    endInput.value   = toInputDate(booking.endDate);
  } else {
    startInput.value = "";
    endInput.value   = "";
  }

  priceEl.textContent = "$0.00";
  errorEl.textContent = "";

  modal.classList.remove("hidden");
  modal.classList.add("open");
}

function closeReservationModal() {
  const modal = $("reservationModal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.add("hidden");
  activeCarForReservation = null;
  editingBookingId = null;
}

/* =============================== */
/* ============ LOGS ============= */
/* =============================== */

function renderLogsTable(logs) {
  const tbody = $("logsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  logs.forEach((log) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.username}</td>
      <td>${log.action}</td>
      <td>${log.method}</td>
      <td>${log.endpoint}</td>
      <td>${formatDate(log.timestamp)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =============================== */
/* =========== ADMIN ============= */
/* =============================== */

function renderAdminInfo(profile, adminArea) {
  const p = $("profileJson");
  const a = $("adminAreaJson");
  if (p) p.textContent = JSON.stringify(profile, null, 2);
  if (a) a.textContent = JSON.stringify(adminArea, null, 2);
}

/* =============================== */
/* =========== LOGOUT ============ */
/* =============================== */

function setupLogout() {
  const btn = $("btnLogout");
  if (!btn) return;

  btn.onclick = () => {
    logout();
    window.location.hash = "#/login";
  };
}

/* =============================== */
/* ========== HELPERS ============ */
/* =============================== */

function diffDays(startStr, endStr) {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  const ms    = end.getTime() - start.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function hasOverlappingBooking(carId, startStr, endStr, ignoreId = null) {
  const start = new Date(startStr).getTime();
  const end   = new Date(endStr).getTime();

  return bookingsCache.some((b) => {
    if (b.carId !== carId) return false;
    if (ignoreId && b._id === ignoreId) return false;

    const bStart = new Date(b.startDate).getTime();
    const bEnd   = new Date(b.endDate).getTime();

    // Se solapan si: start <= bEnd && end >= bStart
    return start <= bEnd && end >= bStart;
  });
}
