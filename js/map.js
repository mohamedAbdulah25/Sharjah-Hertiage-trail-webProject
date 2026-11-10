document.addEventListener("DOMContentLoaded", async () => {
  const map = document.getElementById("map");
  const list = document.querySelector(".map-list");
  let landmarks;
  try {
    landmarks = await getLandmarks();
  } catch (error) {
    showLoadError(list);
    return;
  }
  const progress = getProgress();
  const mapImage = map.querySelector("img").outerHTML;

  map.innerHTML = mapImage + landmarks.map((l, i) => {
    const visited = isVisited(l.id, progress);
    return `
      <a href="#popup-${escapeHtml(l.id)}" class="pin${visited ? " visited" : ""}" style="--x: ${Number(l.mapX)}%; --y: ${Number(l.mapY)}%" data-landmark-id="${escapeHtml(l.id)}" aria-label="${escapeHtml(l.name)}"><span>${i + 1}</span></a>`;
  }).join("") + landmarks.map((l) => {
    const visited = isVisited(l.id, progress);
    return `
      <div class="map-popup" id="popup-${escapeHtml(l.id)}" role="dialog" aria-label="${escapeHtml(l.name)}">
        <a href="#map" class="popup-close" aria-label="Close">✕</a>
        <img src="${escapeHtml(l.images[0])}" alt="${escapeHtml(l.name)}">
        <div class="popup-body">
          <span class="tag" data-category="${escapeHtml(l.category)}">${escapeHtml(l.category)}</span>
          <h3>${escapeHtml(l.name)}</h3>
          <p>${escapeHtml(l.short || l.description.slice(0, 110) + "…")}</p>
          <span class="status${visited ? " visited" : ""}">${visited ? "✅ Visited" : "Not visited yet"}</span>
          <a href="landmark.html?id=${encodeURIComponent(l.id)}" class="btn btn-primary btn-sm">View landmark</a>
        </div>
      </div>`;
  }).join("");

  list.innerHTML = landmarks.map((l, i) => `
    <li><a href="#popup-${escapeHtml(l.id)}"><span>${i + 1}. ${escapeHtml(l.name)}</span><span>${isVisited(l.id, progress) ? "✅" : "○"}</span></a></li>`).join("");

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && location.hash.startsWith("#popup-")) {
      location.hash = "map";
    }
  });
});
