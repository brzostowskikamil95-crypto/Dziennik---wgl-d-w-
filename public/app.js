const STORAGE_KEY = "sp_journal_entries_v1";

let entries = [];

const titleInput = document.getElementById("entry-title");
const contentInput = document.getElementById("entry-content");
const tagsInput = document.getElementById("entry-tags");
const energyInput = document.getElementById("entry-energy");
const energyValue = document.getElementById("energy-value");
const addBtn = document.getElementById("add-entry-btn");

const statCount = document.getElementById("stat-count");
const statEnergy = document.getElementById("stat-energy");

const filterSearch = document.getElementById("filter-search");
const filterTag = document.getElementById("filter-tag");
const clearFiltersBtn = document.getElementById("clear-filters");

const entriesList = document.getElementById("entries-list");
const emptyState = document.getElementById("empty-state");

// Init

document.addEventListener("DOMContentLoaded", () => {
  loadEntries();
  renderEntries();
  updateStats();
  registerServiceWorker();
});

energyInput.addEventListener("input", () => {
  energyValue.textContent = `${energyInput.value}/10`;
});

addBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const tagsRaw = tagsInput.value.trim();
  const energy = parseInt(energyInput.value, 10);

  if (!title && !content) {
    alert("Dodaj chociaż tytuł lub treść wglądu.");
    return;
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const entry = {
    id: Date.now(),
    title,
    content,
    tags,
    energy,
    createdAt: new Date().toISOString()
  };

  entries.unshift(entry);
  saveEntries();
  renderEntries();
  updateStats();
  clearForm();
});

filterSearch.addEventListener("input", renderEntries);
filterTag.addEventListener("input", renderEntries);

clearFiltersBtn.addEventListener("click", () => {
  filterSearch.value = "";
  filterTag.value = "";
  renderEntries();
});

// Helpers

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    entries = JSON.parse(raw);
  } catch (e) {
    console.error("Błąd odczytu localStorage", e);
    entries = [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function clearForm() {
  titleInput.value = "";
  contentInput.value = "";
  tagsInput.value = "";
  energyInput.value = 5;
  energyValue.textContent = "5/10";
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderEntries() {
  const search = filterSearch.value.trim().toLowerCase();
  const tagFilter = filterTag.value.trim().toLowerCase();

  const filtered = entries.filter(e => {
    let ok = true;

    if (search) {
      const text = (e.title + " " + e.content).toLowerCase();
      ok = ok && text.includes(search);
    }

    if (tagFilter) {
      ok =
        ok &&
        e.tags &&
        e.tags.some(t => t.includes(tagFilter));
    }

    return ok;
  });

  entriesList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  for (const e of filtered) {
    const div = document.createElement("div");
    div.className = "entry";

    const header = document.createElement("div");
    header.className = "entry-header";

    const title = document.createElement("div");
    title.className = "entry-title";
    title.textContent = e.title || "Bez tytułu";

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.innerHTML = `
      <span class="entry-energy">${e.energy}/10</span>
      <span>${formatDate(e.createdAt)}</span>
    `;

    header.appendChild(title);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.className = "entry-body";
    body.textContent = e.content || "—";

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "entry-tags";

    if (e.tags && e.tags.length) {
      for (const t of e.tags) {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "tag-pill";
        pill.textContent = t;
        pill.addEventListener("click", () => {
          filterTag.value = t;
          renderEntries();
        });
        tagsWrap.appendChild(pill);
      }
    }

    div.appendChild(header);
    div.appendChild(body);
    if (e.tags && e.tags.length) div.appendChild(tagsWrap);

    entriesList.appendChild(div);
  }
}

function updateStats() {
  statCount.textContent = entries.length;

  if (!entries.length) {
    statEnergy.textContent = "–";
    return;
  }

  const avg =
    entries.reduce((sum, e) => sum + (e.energy || 0), 0) / entries.length;
  statEnergy.textContent = avg.toFixed(1);
}

// PWA

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch(err => console.error("SW error", err));
  }
}