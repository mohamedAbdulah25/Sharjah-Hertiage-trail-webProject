document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("landmark-detail");
  let landmarks;
  try {
    landmarks = await getLandmarks();
  } catch (error) {
    showLoadError(container);
    return;
  }

  const id = new URLSearchParams(location.search).get("id") || landmarks[0].id;
  const index = landmarks.findIndex((l) => l.id === id);

  if (index === -1) {
    document.title = "Landmark not found | Sharjah Heritage Trail";
    container.innerHTML = `
      <section class="page-hero">
        <h1>Landmark not found</h1>
        <p>We couldn't find that landmark. It may have been removed.</p>
        <p style="margin-top:1.5rem"><a href="landmarks.html" class="btn btn-primary">Browse all landmarks</a></p>
      </section>`;
    return;
  }

  const landmark = landmarks[index];
  const prev = landmarks[(index - 1 + landmarks.length) % landmarks.length];
  const next = landmarks[(index + 1) % landmarks.length];
  const images = landmark.images.filter(Boolean);
  const captions = ["Main view", "Inside the landmark", "Up close"];
  const icon = CATEGORY_ICONS[landmark.category] || "✦";
  const name = escapeHtml(landmark.name);

  document.title = `${landmark.name} | Sharjah Heritage Trail`;

  container.innerHTML = `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><a href="index.html">Home</a></li>
        <li><a href="landmarks.html">Landmarks</a></li>
        <li aria-current="page">${name}</li>
      </ol>
    </nav>

    <header class="detail-header">
      <div>
        <span class="tag" data-category="${escapeHtml(landmark.category)}">${escapeHtml(landmark.category)}</span>
        <h1>${name}</h1>
      </div>
      <span class="status" id="detail-status"></span>
    </header>

    <div class="gallery${images.length === 1 ? " single" : ""}">
      ${images.slice(0, 3).map((src, i) => `
        <figure>
          <img src="${escapeHtml(src)}" alt="${name}, ${captions[i].toLowerCase()}">
          <figcaption>${images.length === 1 ? name : captions[i]}</figcaption>
        </figure>`).join("")}
    </div>

    <div class="detail-layout">
      <article class="prose clearfix">
        <h2>About this landmark</h2>
        ${images.length > 1 ? `
        <figure class="float-figure">
          <img src="${escapeHtml(images[1])}" alt="${name}">
          <figcaption>${name}</figcaption>
        </figure>` : ""}
        <p>${escapeHtml(landmark.description)}</p>

        ${landmark.audio ? `
        <h2>Audio guide</h2>
        <audio controls preload="none">
          <source src="${escapeHtml(landmark.audio)}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>` : ""}

        <section class="quiz" id="quiz" aria-labelledby="quiz-title">
          <div class="quiz-head">
            <div>
              <h2 id="quiz-title">Verify your visit</h2>
              <p>Answer all ${landmark.quiz.length} questions correctly using details you can see on site.</p>
            </div>
            <span class="xp-pill">+${landmark.xp} XP</span>
          </div>
          <form id="quiz-form" novalidate>
            ${landmark.quiz.map((q, qi) => `
            <fieldset data-question="${qi}">
              <legend>${qi + 1}. ${escapeHtml(q.question)}</legend>
              <div class="quiz-options">
                ${q.options.map((option, oi) => `
                <label class="quiz-option"><input type="radio" name="q${qi}" value="${oi}"> ${escapeHtml(option)}</label>`).join("")}
              </div>
            </fieldset>`).join("")}
            <p class="quiz-result pass hidden" id="quiz-pass" role="status"><span class="icon">🎉</span><span data-message></span></p>
            <p class="quiz-result fail hidden" id="quiz-fail" role="alert"><span class="icon">✖</span><span data-message></span></p>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="quiz-submit">Submit answers</button>
              <button type="button" class="btn btn-outline hidden" id="quiz-retry" style="color:#fff">Try again</button>
            </div>
          </form>
        </section>
      </article>

      <aside class="info-panel">
        <section class="panel">
          <h3>Visitor information</h3>
          <table class="info-table">
            <caption class="visually-hidden">Visitor information</caption>
            <tbody>
              <tr><th scope="row">Opening hours</th><td>${escapeHtml(landmark.open)} – ${escapeHtml(landmark.close)}</td></tr>
              <tr><th scope="row">Closed</th><td>${landmark.closedDays.length ? closedDaysText(landmark.closedDays) : "—"}</td></tr>
              <tr><th scope="row">Ticket price</th><td>${formatPrice(landmark.price)}</td></tr>
              <tr><th scope="row">Visit duration</th><td>${formatDuration(landmark.duration)}</td></tr>
              <tr><th scope="row">Location</th><td>${escapeHtml(landmark.location)}</td></tr>
            </tbody>
          </table>
          <p class="hint">Sample data. Check official hours before visiting.</p>
        </section>
        <section class="panel">
          <h3>Passport stamp</h3>
          <div class="stamp" id="detail-stamp"><span><span class="stamp-icon">${icon}</span>${name}<br><span data-stamp-label></span></span></div>
        </section>
        <a href="plan.html?add=${encodeURIComponent(landmark.id)}" class="btn btn-teal btn-block">+ Add to my trip</a>
      </aside>
    </div>

    <nav class="pager" aria-label="Landmark navigation">
      <a href="landmark.html?id=${encodeURIComponent(prev.id)}"><span>← Previous</span>${escapeHtml(prev.name)}</a>
      <a href="landmark.html?id=${encodeURIComponent(next.id)}"><span>Next →</span>${escapeHtml(next.name)}</a>
    </nav>`;

  const form = document.getElementById("quiz-form");
  const pass = document.getElementById("quiz-pass");
  const fail = document.getElementById("quiz-fail");
  const submit = document.getElementById("quiz-submit");
  const retry = document.getElementById("quiz-retry");
  const stamp = document.getElementById("detail-stamp");
  const status = document.getElementById("detail-status");

  const showVerified = (animate) => {
    status.className = "status visited";
    status.textContent = `✅ Visited · +${landmark.xp} XP earned`;
    stamp.classList.remove("locked");
    stamp.classList.add("unlocked");
    if (!animate) {
      stamp.style.animation = "none";
    }
    stamp.querySelector("[data-stamp-label]").textContent = "Verified";
    form.querySelectorAll("input").forEach((input) => (input.disabled = true));
    submit.classList.add("hidden");
    retry.classList.add("hidden");
    fail.classList.add("hidden");
    pass.querySelector("[data-message]").textContent = animate
      ? `Visit verified! +${landmark.xp} XP and a new passport stamp.`
      : "You've already verified this visit. The stamp is in your passport.";
    pass.classList.remove("hidden");
  };

  const showUnverified = () => {
    status.className = "status";
    status.textContent = "Not visited yet";
    stamp.classList.add("locked");
    stamp.querySelector("[data-stamp-label]").textContent = "Locked";
  };

  const clearMarks = () => {
    form.querySelectorAll(".quiz-option").forEach((option) => option.classList.remove("wrong", "correct"));
    fail.classList.add("hidden");
  };

  if (isVisited(landmark.id)) {
    showVerified(false);
  } else {
    showUnverified();
  }

  form.addEventListener("change", (event) => {
    event.target.closest(".quiz-option")?.classList.remove("wrong");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMarks();
    const answers = landmark.quiz.map((q, qi) => form.querySelector(`input[name="q${qi}"]:checked`));
    const unanswered = answers.filter((a) => !a).length;
    if (unanswered) {
      fail.querySelector("[data-message]").textContent = `Answer all questions first (${unanswered} left).`;
      fail.classList.remove("hidden");
      return;
    }
    let correct = 0;
    answers.forEach((answer, qi) => {
      if (Number(answer.value) === Number(landmark.quiz[qi].answer)) {
        correct += 1;
      } else {
        answer.closest(".quiz-option").classList.add("wrong");
      }
    });
    if (correct === landmark.quiz.length) {
      markVisited(landmark);
      checkBadges(landmarks);
      showVerified(true);
    } else {
      fail.querySelector("[data-message]").textContent = `${correct}/${landmark.quiz.length} correct. Take another look around and try again.`;
      fail.classList.remove("hidden");
      retry.classList.remove("hidden");
    }
  });

  retry.addEventListener("click", () => {
    form.reset();
    clearMarks();
    retry.classList.add("hidden");
    form.querySelector("input").focus();
  });
});
