document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("plan-form");
  const pickGrid = document.getElementById("pick-grid");
  const search = document.getElementById("plan-search");
  const filterButtons = form.querySelectorAll(".filter-btn");
  const landmarksError = document.getElementById("landmarks-error");
  const groupError = document.getElementById("group-error");
  const steps = document.querySelectorAll(".stepper li");
  const itinerary = document.getElementById("itinerary");
  const saveButton = document.getElementById("save-plan");
  const printButton = document.getElementById("print-plan");
  const confirmButton = document.getElementById("confirm-plan");
  const confirmation = document.getElementById("confirmation");
  const plansGrid = document.getElementById("plans-grid");

  const inputs = {
    date: document.getElementById("trip-date"),
    time: document.getElementById("trip-time"),
    adults: document.getElementById("adults"),
    students: document.getElementById("students"),
    name: document.getElementById("plan-name"),
    email: document.getElementById("plan-email"),
    phone: document.getElementById("plan-phone")
  };

  let landmarks;
  try {
    landmarks = await getLandmarks();
  } catch (error) {
    showLoadError(pickGrid);
    return;
  }

  const byId = (id) => landmarks.find((l) => l.id === id);
  let selected = [];
  let activeFilter = "All";
  let currentRef = null;
  const touched = new Set();

  inputs.date.min = todayString();
  inputs.date.value = "";
  inputs.time.value = "09:00";
  inputs.adults.value = 1;
  inputs.students.value = 0;

  /* Validation */

  const rules = {
    landmarks: () => (selected.length ? "" : "Choose at least one landmark."),
    date: () => {
      const v = inputs.date.value;
      if (!v) return "Choose a date for your trip.";
      if (v < todayString()) return "This date is in the past. Choose today or a later date.";
      return "";
    },
    time: () => {
      const v = inputs.time.value;
      if (!v) return "Choose a start time.";
      if (v < "08:00" || v > "18:00") return "Start between 08:00 and 18:00.";
      return "";
    },
    group: () => {
      const adults = Number(inputs.adults.value);
      const students = Number(inputs.students.value);
      if (![adults, students].every((n) => Number.isInteger(n) && n >= 0)) return "Enter whole numbers only.";
      if (adults + students < 1) return "Add at least 1 person.";
      if (adults + students > 20) return "Groups are limited to 20 people.";
      return "";
    },
    name: () => {
      const v = inputs.name.value.trim();
      if (!v) return "Enter your full name.";
      if (!/^[A-Za-z ]{3,}$/.test(v)) return "Use at least 3 letters (letters and spaces only).";
      return "";
    },
    email: () => {
      const v = inputs.email.value.trim();
      if (!v) return "Enter your email.";
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return "Enter a valid email address, e.g. name@example.com.";
      return "";
    },
    phone: () => {
      const v = inputs.phone.value.trim();
      if (!v) return "Enter your mobile number.";
      if (!/^05\d{8}$/.test(v)) return "Use the UAE format 05XXXXXXXX (10 digits).";
      return "";
    }
  };

  const showError = (key) => {
    const message = touched.has(key) ? rules[key]() : "";
    if (key === "landmarks") {
      landmarksError.textContent = message;
      landmarksError.style.display = message ? "block" : "";
    } else if (key === "group") {
      groupError.textContent = message;
      groupError.style.display = message ? "block" : "";
      [inputs.adults, inputs.students].forEach((input) => input.setAttribute("aria-invalid", message ? "true" : "false"));
    } else {
      setFieldError(inputs[key], message);
    }
  };

  const valid = (keys) => keys.every((key) => !rules[key]());
  const tripKeys = ["landmarks", "date", "time", "group"];
  const detailKeys = ["name", "email", "phone"];

  const updateStepper = () => {
    const done = [valid(["landmarks"]), valid(["date", "time", "group"]), valid(detailKeys)];
    const active = done.indexOf(false);
    steps.forEach((step, i) => {
      step.classList.toggle("done", done[i]);
      step.classList.toggle("active", i === active);
    });
    saveButton.disabled = !valid(tripKeys);
    confirmButton.disabled = !valid([...tripKeys, ...detailKeys]);
    confirmButton.title = confirmButton.disabled ? "Complete all three steps to confirm" : "";
  };

  /* Landmark picker */

  const renderPicks = () => {
    const progress = getProgress();
    const term = search.value.trim().toLowerCase();
    const matches = landmarks.filter((l) => (activeFilter === "All" || l.category === activeFilter) && (!term || l.name.toLowerCase().includes(term)));
    pickGrid.innerHTML = matches.length
      ? matches.map((l) => {
          const isSelected = selected.includes(l.id);
          return `
            <article class="pick-card${isSelected ? " selected" : ""}" data-landmark-id="${escapeHtml(l.id)}">
              ${isVisited(l.id, progress) ? '<span class="visited-tag">✅ Visited</span>' : ""}
              <img src="${escapeHtml(l.images[0])}" alt="${escapeHtml(l.name)}" loading="lazy">
              <div class="pick-body">
                <h4>${escapeHtml(l.name)}</h4>
                <p class="card-meta"><span>⏱ ${formatDuration(l.duration)}</span><span>💰 ${formatPrice(l.price)}</span></p>
                <button type="button" class="btn btn-sm ${isSelected ? "btn-outline" : "btn-teal"}" data-toggle="${escapeHtml(l.id)}">${isSelected ? "Remove" : "+ Add"}</button>
              </div>
            </article>`;
        }).join("")
      : '<p class="empty-state" style="grid-column:1/-1">No landmarks match your search.</p>';
  };

  const toggleLandmark = (id) => {
    selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    touched.add("landmarks");
    refresh();
  };

  pickGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle]");
    if (button) {
      toggleLandmark(button.dataset.toggle);
    }
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderPicks();
    });
  });

  search.addEventListener("input", renderPicks);

  /* Itinerary */

  const buildItinerary = () => {
    const day = inputs.date.value ? new Date(`${inputs.date.value}T00:00:00`).getDay() : null;
    let clock = toMinutes(inputs.time.value || "09:00");
    return selected.map(byId).filter(Boolean).map((l) => {
      const start = clock;
      const end = start + Number(l.duration);
      clock = end + TRAVEL_MINUTES;
      const warnings = [];
      if (day !== null && l.closedDays.includes(day)) warnings.push(`Closed on ${DAY_NAMES[day]}s`);
      if (start < toMinutes(l.open)) warnings.push(`Opens at ${l.open}`);
      if (end > toMinutes(l.close)) warnings.push(`Ends after closing time (${l.close})`);
      return { landmark: l, start, end, warnings };
    });
  };

  const renderSummary = () => {
    const stops = buildItinerary();
    const progress = getProgress();
    const adults = Math.max(0, Number(inputs.adults.value) || 0);
    const students = Math.max(0, Number(inputs.students.value) || 0);

    document.querySelector("[data-trip-date]").textContent = formatDate(inputs.date.value);
    document.querySelector("[data-trip-start]").textContent = inputs.time.value || "--:--";

    itinerary.innerHTML = stops.length
      ? stops.map(({ landmark: l, start, end, warnings }, i) => `
          <li draggable="true" data-index="${i}">
            <span class="stop-name">${escapeHtml(l.name)}</span>
            <span class="stop-time">${toTime(start)} – ${toTime(end)}</span>
            <span class="stop-actions">
              <button type="button" class="icon-btn" data-move="-1" aria-label="Move ${escapeHtml(l.name)} up"${i === 0 ? " disabled" : ""}>▲</button>
              <button type="button" class="icon-btn" data-move="1" aria-label="Move ${escapeHtml(l.name)} down"${i === stops.length - 1 ? " disabled" : ""}>▼</button>
              <button type="button" class="icon-btn" data-remove aria-label="Remove ${escapeHtml(l.name)}">✕</button>
            </span>
            ${warnings.map((w) => `<span class="stop-warning">⚠ ${escapeHtml(w)}</span>`).join("")}
          </li>`).join("")
      : '<p class="hint">Add landmarks from step 1 to build your itinerary.</p>';

    const totalMinutes = stops.length ? stops[stops.length - 1].end - stops[0].start : 0;
    const cost = stops.reduce((sum, s) => sum + Number(s.landmark.price) * adults + Number(s.landmark.price) * STUDENT_DISCOUNT * students, 0);
    const xp = stops.reduce((sum, s) => sum + (isVisited(s.landmark.id, progress) ? 0 : Number(s.landmark.xp)), 0);

    document.querySelector("[data-total-time]").textContent = totalMinutes ? formatDuration(totalMinutes) : "—";
    document.querySelector("[data-total-cost]").textContent = cost === 0 ? "Free" : `${Number.isInteger(cost) ? cost : cost.toFixed(2)} AED`;
    document.querySelector("[data-total-xp]").textContent = `+${xp}`;
  };

  const move = (from, to) => {
    if (to < 0 || to >= selected.length || from === to) return;
    const [item] = selected.splice(from, 1);
    selected.splice(to, 0, item);
    refresh();
  };

  itinerary.addEventListener("click", (event) => {
    const li = event.target.closest("li");
    if (!li) return;
    const index = Number(li.dataset.index);
    if (event.target.closest("[data-move]")) {
      move(index, index + Number(event.target.closest("[data-move]").dataset.move));
    } else if (event.target.closest("[data-remove]")) {
      toggleLandmark(selected[index]);
    }
  });

  let dragIndex = null;
  itinerary.addEventListener("dragstart", (event) => {
    const li = event.target.closest("li");
    dragIndex = Number(li.dataset.index);
    li.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(dragIndex));
  });
  itinerary.addEventListener("dragover", (event) => {
    const li = event.target.closest("li");
    if (!li) return;
    event.preventDefault();
    itinerary.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    li.classList.add("drag-over");
  });
  itinerary.addEventListener("drop", (event) => {
    const li = event.target.closest("li");
    if (!li || dragIndex === null) return;
    event.preventDefault();
    move(dragIndex, Number(li.dataset.index));
  });
  itinerary.addEventListener("dragend", () => {
    dragIndex = null;
    itinerary.querySelectorAll(".dragging, .drag-over").forEach((el) => el.classList.remove("dragging", "drag-over"));
  });

  /* Inputs */

  form.querySelectorAll(".counter button").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const value = Math.min(20, Math.max(0, (Number(input.value) || 0) + Number(button.dataset.step)));
      input.value = value;
      touched.add("group");
      refresh();
    });
  });

  const keyFor = (input) => (input === inputs.adults || input === inputs.students ? "group" : Object.keys(inputs).find((k) => inputs[k] === input));

  Object.values(inputs).forEach((input) => {
    input.addEventListener("input", () => {
      if (touched.has(keyFor(input))) showError(keyFor(input));
      refresh(false);
    });
    input.addEventListener("blur", () => {
      touched.add(keyFor(input));
      showError(keyFor(input));
    });
  });

  const refresh = (rerenderPicks = true) => {
    if (rerenderPicks) renderPicks();
    renderSummary();
    ["landmarks", "group"].forEach(showError);
    updateStepper();
    confirmation.classList.add("hidden");
  };

  /* Saving plans */

  const newRef = (plans) => {
    let ref;
    do {
      ref = `SHJ-${Math.floor(10000 + Math.random() * 90000)}`;
    } while (plans.some((p) => p.ref === ref));
    return ref;
  };

  const savePlan = (confirmed) => {
    const keys = confirmed ? [...tripKeys, ...detailKeys] : tripKeys;
    keys.forEach((key) => {
      touched.add(key);
      showError(key);
    });
    if (!valid(keys)) {
      const firstError = form.querySelector('.field.error input, [aria-invalid="true"]');
      (firstError || pickGrid).scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Please fix the highlighted fields.", "⚠");
      return null;
    }
    const progress = getProgress();
    const existing = progress.plans.find((p) => p.ref === currentRef);
    const plan = {
      ref: existing ? existing.ref : newRef(progress.plans),
      date: inputs.date.value,
      time: inputs.time.value,
      adults: Number(inputs.adults.value),
      students: Number(inputs.students.value),
      stops: [...selected],
      name: inputs.name.value.trim(),
      email: inputs.email.value.trim(),
      phone: inputs.phone.value.trim(),
      confirmed: confirmed || Boolean(existing && existing.confirmed),
      savedAt: new Date().toISOString()
    };
    progress.plans = existing ? progress.plans.map((p) => (p.ref === plan.ref ? plan : p)) : [plan, ...progress.plans];
    saveProgress(progress);
    currentRef = plan.ref;
    checkBadges(landmarks);
    renderPlans();
    return plan;
  };

  saveButton.addEventListener("click", () => {
    const plan = savePlan(false);
    if (plan) showToast(`Plan ${plan.ref} saved.`, "💾");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const plan = savePlan(true);
    if (plan) {
      confirmation.querySelector("[data-ref]").textContent = plan.ref;
      confirmation.classList.remove("hidden");
      confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  printButton.addEventListener("click", () => window.print());

  /* My plans */

  const renderPlans = () => {
    const progress = getProgress();
    plansGrid.innerHTML = progress.plans.length
      ? progress.plans.map((plan) => {
          const stops = plan.stops.map(byId).filter(Boolean);
          const visitedCount = stops.filter((l) => isVisited(l.id, progress)).length;
          const people = plan.adults + plan.students;
          return `
            <article class="plan-card" data-ref="${escapeHtml(plan.ref)}">
              <header>
                <span class="plan-ref">${escapeHtml(plan.ref)}</span>
                <span class="tag">${visitedCount}/${stops.length} visited</span>
              </header>
              <p><strong>${formatDate(plan.date)}</strong> · ${escapeHtml(plan.time)} · ${people} ${people === 1 ? "person" : "people"}</p>
              <p class="hint">${plan.confirmed ? "✔ Confirmed" : "Draft"}</p>
              <ol>
                ${stops.map((l) => `<li>${escapeHtml(l.name)}${isVisited(l.id, progress) ? " ✅" : ""}</li>`).join("")}
              </ol>
              <div class="plan-actions">
                <button type="button" class="btn btn-teal btn-sm" data-open>Open</button>
                <button type="button" class="btn btn-danger btn-sm" data-delete>Delete</button>
              </div>
            </article>`;
        }).join("")
      : '<p class="empty-state" style="grid-column:1/-1">No saved plans yet. Build a trip above and press Save Plan.</p>';
  };

  plansGrid.addEventListener("click", async (event) => {
    const card = event.target.closest(".plan-card");
    if (!card) return;
    const progress = getProgress();
    const plan = progress.plans.find((p) => p.ref === card.dataset.ref);
    if (event.target.closest("[data-open]")) {
      selected = plan.stops.filter(byId);
      inputs.date.value = plan.date;
      inputs.time.value = plan.time;
      inputs.adults.value = plan.adults;
      inputs.students.value = plan.students;
      inputs.name.value = plan.name;
      inputs.email.value = plan.email;
      inputs.phone.value = plan.phone;
      currentRef = plan.ref;
      Object.keys(rules).forEach((key) => touched.add(key));
      refresh();
      ["date", "time", "name", "email", "phone"].forEach(showError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`Editing plan ${plan.ref}.`, "📝");
    } else if (event.target.closest("[data-delete]")) {
      const ok = await confirmModal({ title: `Delete plan ${plan.ref}?`, message: "This saved plan will be removed.", confirmText: "Delete" });
      if (!ok) return;
      progress.plans = progress.plans.filter((p) => p.ref !== plan.ref);
      saveProgress(progress);
      if (currentRef === plan.ref) currentRef = null;
      renderPlans();
      showToast("Plan deleted.", "🗑");
    }
  });

  /* Start */

  const addId = new URLSearchParams(location.search).get("add");
  if (addId && byId(addId)) {
    selected.push(addId);
    showToast(`${byId(addId).name} added to your trip.`, "＋");
  }

  refresh();
  renderPlans();
});
