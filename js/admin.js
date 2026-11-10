document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const loginSection = loginForm.closest("section");
  const userInput = document.getElementById("admin-user");
  const passInput = document.getElementById("admin-pass");
  const togglePass = document.getElementById("toggle-pass");
  const loginError = document.getElementById("login-error");
  const dashboard = document.getElementById("dashboard");
  const table = document.getElementById("admin-table");
  const form = document.getElementById("landmark-form");
  const formTitle = document.getElementById("form-title");
  const submitButton = form.querySelector('button[type="submit"]');
  const success = document.getElementById("admin-success");
  const previewPin = document.getElementById("preview-pin");
  const importInput = document.getElementById("import-json");

  const f = (id) => document.getElementById(id);
  const fields = {
    name: f("lm-name"),
    id: f("lm-id"),
    category: f("lm-category"),
    location: f("lm-location"),
    description: f("lm-description"),
    duration: f("lm-duration"),
    price: f("lm-price"),
    open: f("lm-open"),
    close: f("lm-close"),
    xp: f("lm-xp"),
    img1: f("lm-img1"),
    img2: f("lm-img2"),
    img3: f("lm-img3"),
    audio: f("lm-audio"),
    mapX: f("lm-x"),
    mapY: f("lm-y")
  };
  const questions = [1, 2, 3].map((n) => ({
    box: f(`q${n}-text`).closest(".qb-question"),
    text: f(`q${n}-text`),
    options: [0, 1, 2].map((k) => form.querySelector(`[name="q${n}-opt${k}"]`)),
    radios: [...form.querySelectorAll(`[name="q${n}-correct"]`)]
  }));
  questions.forEach((q) => {
    const error = document.createElement("p");
    error.className = "field-error";
    q.box.appendChild(error);
    q.error = error;
  });

  let builtIn = [];
  let editingId = null;
  let idEdited = false;

  try {
    builtIn = await getBuiltInLandmarks();
  } catch (error) {
    showLoadError(table.closest(".table-wrap"));
  }

  /* Login */

  const isLoggedIn = () => session.get(STORAGE_KEYS.admin) === "true";

  const showView = () => {
    const loggedIn = isLoggedIn();
    loginSection.classList.toggle("hidden", loggedIn);
    dashboard.classList.toggle("hidden", !loggedIn);
    document.title = `${loggedIn ? "Admin Dashboard" : "Login"} | Sharjah Heritage Trail`;
    updateHeader();
    if (loggedIn) renderTable();
  };

  togglePass.addEventListener("click", () => {
    const show = passInput.type === "password";
    passInput.type = show ? "text" : "password";
    togglePass.textContent = show ? "Hide" : "Show";
    togglePass.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  [userInput, passInput].forEach((input) => {
    input.addEventListener("input", () => {
      setFieldError(input, "");
      loginError.classList.add("hidden");
    });
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const okUser = setFieldError(userInput, userInput.value.trim() ? "" : "Enter your username.");
    const okPass = setFieldError(passInput, passInput.value ? "" : "Enter your password.");
    if (!okUser || !okPass) return;
    if (userInput.value.trim() === ADMIN_USERNAME && passInput.value === ADMIN_PASSWORD) {
      session.set(STORAGE_KEYS.admin, "true");
      loginForm.reset();
      showView();
      showToast("Welcome back, admin.", "🔓");
    } else {
      loginError.classList.remove("hidden");
      passInput.value = "";
      passInput.focus();
    }
  });

  f("logout").addEventListener("click", () => {
    session.remove(STORAGE_KEYS.admin);
    resetForm();
    showView();
    showToast("Logged out.", "🔒");
  });

  /* Table */

  const sourceOf = (id) => {
    const isBuiltIn = builtIn.some((l) => l.id === id);
    const isCustom = getCustomLandmarks().some((l) => l.id === id);
    if (isBuiltIn && isCustom) return "edited";
    return isBuiltIn ? "builtin" : "custom";
  };

  const renderTable = async () => {
    const landmarks = await getLandmarks();
    const counts = { builtin: 0, edited: 0, custom: 0 };
    table.innerHTML = landmarks.map((l) => {
      const source = sourceOf(l.id);
      counts[source] += 1;
      const label = { builtin: "Built-in", edited: "Built-in (edited)", custom: "Custom" }[source];
      return `
        <tr data-landmark-id="${escapeHtml(l.id)}">
          <td><strong>${escapeHtml(l.name)}</strong><br><span class="hint">${escapeHtml(l.id)}</span></td>
          <td><span class="tag" data-category="${escapeHtml(l.category)}">${escapeHtml(l.category)}</span></td>
          <td>${formatPrice(l.price)}</td>
          <td>${formatDuration(l.duration)}</td>
          <td><span class="source-tag ${source === "custom" ? "custom" : "builtin"}">${label}</span></td>
          <td>
            <button type="button" class="btn btn-outline btn-sm" data-edit>Edit</button>
            ${source === "custom" ? '<button type="button" class="btn btn-danger btn-sm" data-delete>Delete</button>' : ""}
            ${source === "edited" ? '<button type="button" class="btn btn-outline btn-sm" data-restore>Restore</button>' : ""}
          </td>
        </tr>`;
    }).join("");
    document.querySelector("[data-stat-total]").textContent = landmarks.length;
    document.querySelector("[data-stat-builtin]").textContent = counts.builtin + counts.edited;
    document.querySelector("[data-stat-custom]").textContent = counts.custom;
  };

  table.addEventListener("click", async (event) => {
    const row = event.target.closest("tr");
    if (!row) return;
    const id = row.dataset.landmarkId;
    const landmarks = await getLandmarks();
    const landmark = landmarks.find((l) => l.id === id);
    if (event.target.closest("[data-edit]")) {
      loadIntoForm(landmark);
    } else if (event.target.closest("[data-delete]")) {
      const ok = await confirmModal({ title: `Delete ${landmark.name}?`, message: "It will be removed from every page in this browser, along with its quiz.", confirmText: "Delete" });
      if (!ok) return;
      saveCustomLandmarks(getCustomLandmarks().filter((l) => l.id !== id));
      if (editingId === id) resetForm();
      renderTable();
      showToast(`${landmark.name} deleted.`, "🗑");
    } else if (event.target.closest("[data-restore]")) {
      const ok = await confirmModal({ title: `Restore ${landmark.name}?`, message: "Your edits will be discarded and the original version restored.", confirmText: "Restore", danger: false });
      if (!ok) return;
      saveCustomLandmarks(getCustomLandmarks().filter((l) => l.id !== id));
      if (editingId === id) resetForm();
      renderTable();
      showToast(`${landmark.name} restored.`, "↺");
    }
  });

  /* Form */

  const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const imagePattern = /^(https?:\/\/\S+|[\w\-./]+\.(svg|png|jpe?g|webp|gif|avif))$/i;
  const audioPattern = /^(https?:\/\/\S+|[\w\-./]+\.(mp3|ogg|wav|m4a))$/i;
  const num = (input) => Number(input.value);
  const isInt = (input) => input.value !== "" && Number.isInteger(num(input));

  const rules = {
    name: () => (fields.name.value.trim().length < 3 ? "Enter a name (at least 3 characters)." : ""),
    id: async () => {
      const v = fields.id.value.trim();
      if (!v) return "Enter an ID.";
      if (!/^[a-z0-9-]+$/.test(v)) return "Use lowercase letters, numbers and hyphens only.";
      if (!editingId && (await getLandmarks()).some((l) => l.id === v)) return "This ID is already used by another landmark.";
      return "";
    },
    category: () => (CATEGORIES.includes(fields.category.value) ? "" : "Choose a category."),
    location: () => (fields.location.value.trim() ? "" : "Enter the location."),
    description: () => (fields.description.value.trim().length < 30 ? "Write at least 30 characters." : ""),
    duration: () => (!isInt(fields.duration) || num(fields.duration) < 10 || num(fields.duration) > 480 ? "Enter a whole number from 10 to 480 minutes." : ""),
    price: () => (fields.price.value === "" || num(fields.price) < 0 ? "Enter a price of 0 or more." : ""),
    open: () => (fields.open.value ? "" : "Enter an opening time."),
    close: () => (!fields.close.value ? "Enter a closing time." : fields.open.value && fields.close.value <= fields.open.value ? "Closing time must be after opening time." : ""),
    xp: () => (!isInt(fields.xp) || num(fields.xp) < 10 || num(fields.xp) > 500 ? "Enter a whole number from 10 to 500." : ""),
    img1: () => (!imagePattern.test(fields.img1.value.trim()) ? "Enter an image URL (https://...) or path ending in .jpg, .png, .svg or .webp." : ""),
    img2: () => (fields.img2.value.trim() && !imagePattern.test(fields.img2.value.trim()) ? "Enter a valid image URL or path." : ""),
    img3: () => (fields.img3.value.trim() && !imagePattern.test(fields.img3.value.trim()) ? "Enter a valid image URL or path." : ""),
    audio: () => (fields.audio.value.trim() && !audioPattern.test(fields.audio.value.trim()) ? "Enter an audio URL or path ending in .mp3, .ogg, .wav or .m4a." : ""),
    mapX: () => (fields.mapX.value === "" || num(fields.mapX) < 0 || num(fields.mapX) > 100 ? "Enter a number from 0 to 100." : ""),
    mapY: () => (fields.mapY.value === "" || num(fields.mapY) < 0 || num(fields.mapY) > 100 ? "Enter a number from 0 to 100." : "")
  };

  const validateField = async (key) => setFieldError(fields[key], await rules[key]());

  const validateQuestion = (q) => {
    const textOk = setFieldError(q.text, q.text.value.trim().length < 5 ? "Enter the question (at least 5 characters)." : "");
    let message = "";
    q.options.forEach((option) => option.setAttribute("aria-invalid", option.value.trim() ? "false" : "true"));
    if (q.options.some((option) => !option.value.trim())) message = "Fill in all 3 options.";
    else if (new Set(q.options.map((o) => o.value.trim().toLowerCase())).size < 3) message = "Each option must be different.";
    else if (!q.radios.some((r) => r.checked)) message = "Select the correct answer.";
    q.error.textContent = message;
    q.error.style.display = message ? "block" : "";
    return textOk && !message;
  };

  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("blur", () => validateField(key));
    fields[key].addEventListener("input", () => {
      success.classList.add("hidden");
      if (fields[key].closest(".field").classList.contains("error")) validateField(key);
    });
  });

  questions.forEach((q) => {
    [q.text, ...q.options, ...q.radios].forEach((input) => {
      input.addEventListener("change", () => {
        if (q.error.style.display || q.box.querySelector(".field.error")) validateQuestion(q);
      });
    });
  });

  fields.name.addEventListener("input", () => {
    if (!editingId && !idEdited) fields.id.value = slugify(fields.name.value);
  });
  fields.id.addEventListener("input", () => (idEdited = true));

  const updatePreview = () => {
    const x = Math.min(100, Math.max(0, num(fields.mapX) || 0));
    const y = Math.min(100, Math.max(0, num(fields.mapY) || 0));
    previewPin.style.setProperty("--x", `${x}%`);
    previewPin.style.setProperty("--y", `${y}%`);
  };
  [fields.mapX, fields.mapY].forEach((input) => input.addEventListener("input", updatePreview));

  const resetForm = () => {
    form.reset();
    editingId = null;
    idEdited = false;
    fields.id.readOnly = false;
    formTitle.textContent = "Add a landmark";
    submitButton.textContent = "Save landmark";
    Object.values(fields).forEach((input) => setFieldError(input, ""));
    questions.forEach((q) => {
      setFieldError(q.text, "");
      q.options.forEach((o) => o.setAttribute("aria-invalid", "false"));
      q.error.style.display = "";
    });
    updatePreview();
  };

  const loadIntoForm = (l) => {
    resetForm();
    editingId = l.id;
    fields.id.readOnly = true;
    formTitle.textContent = `Edit: ${l.name}`;
    submitButton.textContent = "Update landmark";
    fields.name.value = l.name;
    fields.id.value = l.id;
    fields.category.value = l.category;
    fields.location.value = l.location;
    fields.description.value = l.description;
    fields.duration.value = l.duration;
    fields.price.value = l.price;
    fields.open.value = l.open;
    fields.close.value = l.close;
    fields.xp.value = l.xp;
    fields.img1.value = l.images[0] || "";
    fields.img2.value = l.images[1] || "";
    fields.img3.value = l.images[2] || "";
    fields.audio.value = l.audio || "";
    fields.mapX.value = l.mapX;
    fields.mapY.value = l.mapY;
    form.querySelectorAll('[name="closedDays"]').forEach((box) => (box.checked = l.closedDays.includes(Number(box.value))));
    questions.forEach((q, i) => {
      const data = l.quiz[i] || { question: "", options: ["", "", ""], answer: -1 };
      q.text.value = data.question;
      q.options.forEach((o, k) => (o.value = data.options[k] || ""));
      q.radios.forEach((r) => (r.checked = Number(r.value) === Number(data.answer)));
    });
    updatePreview();
    form.scrollIntoView({ behavior: "smooth" });
  };

  form.addEventListener("reset", () => setTimeout(() => {
    if (editingId) resetForm();
  }));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    success.classList.add("hidden");
    const results = await Promise.all(Object.keys(fields).map(validateField));
    const quizResults = questions.map(validateQuestion);
    if ([...results, ...quizResults].includes(false)) {
      const first = form.querySelector('.field.error input, .field.error select, .field.error textarea, [aria-invalid="true"]');
      if (first) first.focus();
      showToast("Please fix the highlighted fields.", "⚠");
      return;
    }
    const description = fields.description.value.trim();
    const firstSentence = description.split(/(?<=[.!?])\s/)[0];
    const landmark = {
      id: fields.id.value.trim(),
      name: fields.name.value.trim(),
      category: fields.category.value,
      short: firstSentence.length <= 140 ? firstSentence : `${description.slice(0, 120).trim()}…`,
      description,
      location: fields.location.value.trim(),
      duration: num(fields.duration),
      price: num(fields.price),
      open: fields.open.value,
      close: fields.close.value,
      closedDays: [...form.querySelectorAll('[name="closedDays"]:checked')].map((box) => Number(box.value)),
      images: [fields.img1, fields.img2, fields.img3].map((i) => i.value.trim()).filter(Boolean),
      audio: fields.audio.value.trim(),
      xp: num(fields.xp),
      mapX: num(fields.mapX),
      mapY: num(fields.mapY),
      quiz: questions.map((q) => ({
        question: q.text.value.trim(),
        options: q.options.map((o) => o.value.trim()),
        answer: Number(q.radios.find((r) => r.checked).value)
      }))
    };
    const custom = getCustomLandmarks().filter((l) => l.id !== landmark.id);
    custom.push(landmark);
    if (!saveCustomLandmarks(custom)) return;
    const wasEditing = Boolean(editingId);
    resetForm();
    await renderTable();
    success.textContent = `${landmark.name} ${wasEditing ? "updated" : "added"}. It now appears across the site in this browser. Use Export JSON to publish it for everyone.`;
    success.classList.remove("hidden");
    showToast(`${landmark.name} saved.`, "✔");
  });

  /* Export and import */

  f("export-json").addEventListener("click", async () => {
    const landmarks = await getLandmarks();
    const blob = new Blob([JSON.stringify(landmarks, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "landmarks.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("landmarks.json downloaded.", "⬇");
  });

  const validImport = (item) =>
    item &&
    typeof item.id === "string" && /^[a-z0-9-]+$/.test(item.id) &&
    typeof item.name === "string" && item.name.trim() &&
    CATEGORIES.includes(item.category) &&
    typeof item.description === "string" &&
    Number.isFinite(item.duration) && Number.isFinite(item.price) && Number.isFinite(item.xp) &&
    Array.isArray(item.images) && item.images.length > 0 &&
    Array.isArray(item.closedDays) &&
    Array.isArray(item.quiz) && item.quiz.length > 0 &&
    item.quiz.every((q) => typeof q.question === "string" && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);

  importInput.addEventListener("change", () => {
    const file = importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data) || !data.length || !data.every(validImport)) throw new Error("invalid");
        if (new Set(data.map((d) => d.id)).size !== data.length) throw new Error("duplicate");
        const ok = await confirmModal({ title: "Import landmarks?", message: `This will load ${data.length} landmarks and replace your current custom landmarks and edits.`, confirmText: "Import", danger: false });
        if (!ok) return;
        const changed = data.filter((item) => {
          const original = builtIn.find((l) => l.id === item.id);
          return !original || JSON.stringify(original) !== JSON.stringify(item);
        });
        saveCustomLandmarks(changed);
        resetForm();
        renderTable();
        showToast(`Imported ${data.length} landmarks.`, "⬆");
      } catch (error) {
        showToast("That file isn't a valid landmarks.json.", "⚠");
      } finally {
        importInput.value = "";
      }
    };
    reader.readAsText(file);
  });

  showView();
});
