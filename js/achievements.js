document.addEventListener("DOMContentLoaded", async () => {
  const profile = document.querySelector(".profile");
  const ladder = document.querySelector(".level-ladder");
  const passport = document.getElementById("passport");
  const badgeGrid = document.getElementById("badge-grid");
  const badgeCount = badgeGrid.closest(".container").querySelector(".section-head p");
  const editButton = document.getElementById("edit-name");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("explorer-name");
  const cancelName = document.getElementById("cancel-name");
  const resetButton = document.getElementById("reset-progress");

  let landmarks;
  try {
    landmarks = await getLandmarks();
  } catch (error) {
    showLoadError(passport);
    return;
  }

  const render = () => {
    checkBadges(landmarks);
    const progress = getProgress();
    const level = renderLevelInfo(profile, progress, landmarks.length);

    profile.querySelector(".xp-meta span").textContent = level.next
      ? `${level.next.xp - progress.xp} XP to ${level.next.name}`
      : "Maximum level reached";

    ladder.innerHTML = LEVELS.map((l, i) => `
      <li class="${i === level.index ? "current" : i < level.index ? "reached" : ""}"><strong>${l.name}</strong>${l.xp} XP</li>`).join("");

    passport.innerHTML = landmarks.map((l) => {
      const visited = isVisited(l.id, progress);
      return `
        <a class="passport-item" href="landmark.html?id=${encodeURIComponent(l.id)}" data-landmark-id="${escapeHtml(l.id)}" style="color:inherit;text-decoration:none">
          <div class="stamp ${visited ? "unlocked" : "locked"}"><span><span class="stamp-icon">${CATEGORY_ICONS[l.category] || "✦"}</span>${escapeHtml(l.name)}</span></div>
          <p>${escapeHtml(l.name)}</p>
        </a>`;
    }).join("");

    badgeGrid.innerHTML = BADGES.map((b) => {
      const unlocked = progress.badges.includes(b.id);
      const fresh = progress.newBadges.includes(b.id);
      return `
        <article class="badge ${unlocked ? "unlocked" : "locked"}${fresh ? " just-unlocked" : ""}" data-badge="${b.id}">
          <div class="badge-icon" aria-hidden="true">${b.icon}</div>
          <h3>${b.name}</h3>
          <p class="badge-desc">${b.description}</p>
          <p class="badge-hint">🔒 ${b.hint}</p>
        </article>`;
    }).join("");

    badgeCount.textContent = `${progress.badges.length} of ${BADGES.length} unlocked`;

    if (progress.newBadges.length) {
      progress.newBadges = [];
      saveProgress(progress);
    }
  };

  const closeNameForm = () => {
    nameForm.classList.add("hidden");
    editButton.classList.remove("hidden");
    setFieldError(nameInput, "");
  };

  editButton.addEventListener("click", () => {
    nameInput.value = getProgress().name;
    nameForm.classList.remove("hidden");
    editButton.classList.add("hidden");
    nameInput.focus();
    nameInput.select();
  });

  cancelName.addEventListener("click", closeNameForm);

  nameInput.addEventListener("input", () => setFieldError(nameInput, ""));

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = nameInput.value.trim().replace(/\s+/g, " ");
    if (!/^[A-Za-z ]{3,20}$/.test(value)) {
      setFieldError(nameInput, "Use 3–20 letters and spaces.");
      return;
    }
    const progress = getProgress();
    progress.name = value;
    saveProgress(progress);
    closeNameForm();
    render();
    showToast("Explorer name updated.", "✎");
  });

  resetButton.addEventListener("click", async () => {
    const confirmed = await confirmModal({
      title: "Reset all progress?",
      message: "This clears your XP, stamps, badges and saved plans. It can't be undone.",
      confirmText: "Reset"
    });
    if (confirmed) {
      resetProgress();
      render();
      showToast("Progress reset. Your journey starts again!", "↺");
    }
  });

  render();
});
