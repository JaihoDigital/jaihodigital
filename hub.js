const grid = document.getElementById("appGrid");
const modal = document.getElementById("modal");

let allItems = [];
let activeFilter = "all";

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    allItems = [...data.products, ...data.resources];
    render(allItems);
  });

function render(items) {
  grid.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.dataset.cat = item.category;
    card.dataset.name = item.name.toLowerCase();

    card.innerHTML = `
      <div class="icon-box"><i class="fas ${item.icon}"></i></div>
      <div class="meta">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
    `;

    card.onclick = () => openModal(item);
    grid.appendChild(card);
  });
}

function openModal(item) {
  modal.classList.remove("hidden");
  document.getElementById("modalTitle").textContent = item.name;
  document.getElementById("modalDesc").textContent = item.fullDescription;
  document.getElementById("modalStatus").textContent = item.status || "—";
  document.getElementById("modalLink").href = item.link;

  const list = document.getElementById("modalList");
  list.innerHTML = "";

  (item.features || item.topics || []).forEach(v => {
    const li = document.createElement("li");
    li.textContent = v;
    list.appendChild(li);
  });
}

document.getElementById("closeModal").onclick = () =>
  modal.classList.add("hidden");

/* Filters */
document.querySelectorAll(".nav-item[data-filter]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    applyFilters();
  };
});

document.getElementById("searchInput").oninput = applyFilters;

function applyFilters() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allItems.filter(item => {
    const matchCat = activeFilter === "all" || item.category === activeFilter;
    const matchText = item.name.toLowerCase().includes(q);
    return matchCat && matchText;
  });
  render(filtered);
}
