const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast("Couldn't save. Your browser storage may be full or blocked.", "⚠");
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  }
};

const session = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {}
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {}
  }
};

/* Landmark data */

let builtInCache = null;

async function getBuiltInLandmarks() {
  if (!builtInCache) {
    builtInCache = fetch("data/landmarks.json").then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load landmarks");
      }
      return response.json();
    });
  }
  return builtInCache;
}

function getCustomLandmarks() {
  const custom = storage.get(STORAGE_KEYS.custom, []);
  return Array.isArray(custom) ? custom : [];
}

function saveCustomLandmarks(list) {
  return storage.set(STORAGE_KEYS.custom, list);
}

async function getLandmarks() {
  const builtIn = await getBuiltInLandmarks();
  const custom = getCustomLandmarks();
  const merged = builtIn.map((landmark) => custom.find((item) => item.id === landmark.id) || landmark);
  custom.forEach((item) => {
    if (!builtIn.some((landmark) => landmark.id === item.id)) {
      merged.push(item);
    }
  });
  return merged;
}

function showLoadError(container) {
  if (!container) {
    return;
  }
  container.innerHTML = `<p class="alert alert-error">Couldn't load the landmark data. If you opened this file directly, run the site through a local server (see README).</p>`;
}

/* Accounts */

function getUsers() {
  const users = storage.get(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function getCurrentUser() {
  const email = storage.get(STORAGE_KEYS.currentUser, null);
  return email ? getUsers().find((user) => user.email === email) || null : null;
}

function isAdmin() {
  return session.get(STORAGE_KEYS.admin) === "true";
}

async function hashPassword(password) {
  const text = `sht:${password}`;
  if (window.crypto && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return `fallback-${hash}`;
}

async function registerUser(name, email, password) {
  const users = getUsers();
  const user = { name, email: email.toLowerCase(), passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
  users.push(user);
  storage.set(STORAGE_KEYS.users, users);
  const guest = getProgress();
  storage.set(`${STORAGE_KEYS.progress}:${user.email}`, { ...guest, name });
  storage.remove(STORAGE_KEYS.progress);
  storage.set(STORAGE_KEYS.currentUser, user.email);
  updateHeader();
  return user;
}

async function loginUser(email, password) {
  const user = getUsers().find((u) => u.email === email.toLowerCase());
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    return null;
  }
  storage.set(STORAGE_KEYS.currentUser, user.email);
  updateHeader();
  return user;
}

function logoutUser() {
  storage.remove(STORAGE_KEYS.currentUser);
  updateHeader();
}

/* Progress */

function progressKey() {
  const user = getCurrentUser();
  return user ? `${STORAGE_KEYS.progress}:${user.email}` : STORAGE_KEYS.progress;
}

function defaultProgress() {
  const user = getCurrentUser();
  return { name: user ? user.name : "Explorer", xp: 0, visited: [], badges: [], newBadges: [], plans: [] };
}

function getProgress() {
  return { ...defaultProgress(), ...storage.get(progressKey(), {}) };
}

function saveProgress(progress) {
  storage.set(progressKey(), progress);
  updateHeader();
}

function resetProgress() {
  storage.remove(progressKey());
  updateHeader();
}

function isVisited(id, progress = getProgress()) {
  return progress.visited.includes(id);
}

function getLevel(xp) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (xp >= level.xp) {
      index = i;
    }
  });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const percent = next ? Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100) : 100;
  return { index, current, next, percent };
}

function markVisited(landmark) {
  const progress = getProgress();
  if (progress.visited.includes(landmark.id)) {
    return false;
  }
  const before = getLevel(progress.xp).index;
  progress.visited.push(landmark.id);
  progress.xp += Number(landmark.xp) || 0;
  saveProgress(progress);
  showToast(`+${landmark.xp} XP — ${landmark.name} verified!`, "⭐");
  const after = getLevel(progress.xp);
  if (after.index > before) {
    showToast(`Level up! You're now a ${after.current.name}.`, "🎉");
  }
  return true;
}

function badgeEarned(id, progress, landmarks) {
  const visited = progress.visited.filter((v) => landmarks.some((l) => l.id === v));
  const museums = landmarks.filter((l) => l.category === "Museum");
  switch (id) {
    case "first-steps":
      return visited.length >= 1;
    case "museum-lover":
      return museums.length > 0 && museums.every((l) => visited.includes(l.id));
    case "halfway-there":
      return visited.length >= 3;
    case "trip-planner":
      return progress.plans.length >= 1;
    case "mission-complete":
      return progress.plans.some((plan) => plan.stops.length > 0 && plan.stops.every((stop) => visited.includes(stop)));
    case "heritage-guardian":
      return landmarks.length > 0 && landmarks.every((l) => visited.includes(l.id));
    default:
      return false;
  }
}

function checkBadges(landmarks) {
  const progress = getProgress();
  const unlocked = BADGES.filter((badge) => !progress.badges.includes(badge.id) && badgeEarned(badge.id, progress, landmarks));
  if (unlocked.length) {
    unlocked.forEach((badge) => {
      progress.badges.push(badge.id);
      progress.newBadges.push(badge.id);
      showToast(`Badge unlocked: ${badge.name}`, badge.icon);
    });
    saveProgress(progress);
  }
  return unlocked;
}

/* UI helpers */

function showToast(message, icon = "✦") {
  const container = document.getElementById("toasts");
  if (!container) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span aria-hidden="true">${icon}</span><span></span>`;
  toast.lastElementChild.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function confirmModal({ title, message, confirmText = "Confirm", danger = true }) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="modal-box">
        <h3></h3>
        <p></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-cancel>Cancel</button>
          <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm></button>
        </div>
      </div>`;
    modal.querySelector("h3").textContent = title;
    modal.querySelector("p").textContent = message;
    modal.querySelector("[data-confirm]").textContent = confirmText;
    const close = (result) => {
      document.removeEventListener("keydown", onKey);
      modal.remove();
      resolve(result);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.matches("[data-cancel]")) {
        close(false);
      } else if (event.target.matches("[data-confirm]")) {
        close(true);
      }
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(modal);
    modal.querySelector("[data-confirm]").focus();
  });
}

function setFieldError(input, message) {
  const field = input.closest(".field");
  if (field) {
    field.classList.toggle("error", Boolean(message));
    const error = field.querySelector(":scope > .field-error");
    if (error && message) {
      error.textContent = message;
    }
  }
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function toMinutes(time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) {
    return `${rest}m`;
  }
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatPrice(price) {
  return Number(price) === 0 ? "Free" : `${price} AED`;
}

function formatDate(value) {
  if (!value) {
    return "Choose a date";
  }
  const date = new Date(`${value}T00:00:00`);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${DAY_NAMES[date.getDay()].slice(0, 3)}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function closedDaysText(days) {
  return days && days.length ? days.map((d) => DAY_NAMES[d]).join(", ") : "Open daily";
}

function landmarkCardHtml(landmark, visited) {
  return `
    <article class="landmark-card${visited ? " visited" : ""}" data-landmark-id="${escapeHtml(landmark.id)}" data-category="${escapeHtml(landmark.category)}">
      <div class="card-media">
        <span class="tag" data-category="${escapeHtml(landmark.category)}">${escapeHtml(landmark.category)}</span>
        <img src="${escapeHtml(landmark.images[0])}" alt="${escapeHtml(landmark.name)}" loading="lazy">
      </div>
      <div class="card-body">
        <h3><a href="landmark.html?id=${encodeURIComponent(landmark.id)}">${escapeHtml(landmark.name)}</a></h3>
        <p class="card-meta"><span>⏱ ${formatDuration(landmark.duration)}</span><span>💰 ${formatPrice(landmark.price)}</span></p>
        <p>${escapeHtml(landmark.short || landmark.description.slice(0, 110) + "…")}</p>
        <div class="card-footer">
          <span class="status${visited ? " visited" : ""}">${visited ? "✅ Visited" : "Not visited yet"}</span>
          <span class="card-xp">+${landmark.xp} XP</span>
        </div>
      </div>
    </article>`;
}

function renderLevelInfo(scope, progress, totalLandmarks) {
  const level = getLevel(progress.xp);
  scope.querySelectorAll("[data-xp]").forEach((el) => (el.textContent = progress.xp));
  scope.querySelectorAll("[data-level]").forEach((el) => (el.textContent = level.current.name));
  scope.querySelectorAll("[data-explorer-name]").forEach((el) => (el.textContent = progress.name));
  scope.querySelectorAll("[data-next-level]").forEach((el) => (el.textContent = level.next ? level.next.name : "Max level"));
  scope.querySelectorAll("[data-next-xp]").forEach((el) => (el.textContent = level.next ? level.next.xp : progress.xp));
  scope.querySelectorAll(".xp-bar").forEach((bar) => {
    bar.setAttribute("aria-valuenow", level.percent);
    bar.querySelector(".xp-bar-fill").style.setProperty("--progress", `${level.percent}%`);
  });
  if (totalLandmarks !== undefined) {
    scope.querySelectorAll("[data-stamps]").forEach((el) => {
      el.textContent = el.textContent.includes("stamps") ? `${progress.visited.length}/${totalLandmarks} stamps` : `${progress.visited.length}/${totalLandmarks}`;
    });
  }
  return level;
}

function updateHeader() {
  const progress = getProgress();
  document.querySelectorAll("#header-xp [data-xp]").forEach((el) => (el.textContent = progress.xp));
  const loginLink = document.querySelector('.main-nav a[href="login.html"]');
  if (loginLink) {
    const user = getCurrentUser();
    loginLink.textContent = user ? `👤 ${user.name.split(" ")[0]}` : "Login";
  }
}

function initNav() {
  const toggle = document.getElementById("nav-toggle");
  const label = document.querySelector(".nav-toggle-label");
  if (!toggle || !label) {
    return;
  }
  const sync = () => label.setAttribute("aria-label", toggle.checked ? "Close menu" : "Open menu");
  toggle.addEventListener("change", sync);
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.checked = false;
      sync();
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.checked) {
      toggle.checked = false;
      sync();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  updateHeader();
});
