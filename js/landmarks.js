document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("landmark-grid");
  const search = document.getElementById("landmark-search");
  const noResults = document.getElementById("no-results");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let activeFilter = "All";
  let landmarks = [];

  const render = () => {
    const progress = getProgress();
    const term = search.value.trim().toLowerCase();
    const matches = landmarks.filter((landmark) => {
      const inCategory = activeFilter === "All" || landmark.category === activeFilter;
      const inSearch = !term || `${landmark.name} ${landmark.category} ${landmark.location}`.toLowerCase().includes(term);
      return inCategory && inSearch;
    });
    grid.innerHTML = matches.map((landmark) => landmarkCardHtml(landmark, isVisited(landmark.id, progress))).join("");
    noResults.classList.toggle("hidden", matches.length > 0);
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      render();
    });
  });

  search.addEventListener("input", render);

  try {
    landmarks = await getLandmarks();
    render();
  } catch (error) {
    showLoadError(grid);
  }
});
