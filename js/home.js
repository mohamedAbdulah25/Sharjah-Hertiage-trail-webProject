document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featured-grid");
  const card = document.getElementById("progress-card");
  try {
    const landmarks = await getLandmarks();
    const progress = getProgress();
    renderLevelInfo(card, progress, landmarks.length);
    const featured = [...landmarks].sort((a, b) => isVisited(a.id, progress) - isVisited(b.id, progress)).slice(0, 3);
    grid.innerHTML = featured.map((landmark) => landmarkCardHtml(landmark, isVisited(landmark.id, progress))).join("");
  } catch (error) {
    showLoadError(grid);
  }
});
