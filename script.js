const el = (s) => document.querySelector(s);
const els = (s) => document.querySelectorAll(s);

const KEY = "glass-table-v1";
const WIDTHS_KEY = "glass-table-widths-v1";

const theadRow = el("#thead-row");
const tbody = el("#tbody");
const newRowInput = el("#new-row-input");
const relDataList = el("#rel-names");
const contextMenu = el("#context-menu");
const deleteRowItem = el("#delete-row-item");

let data = { headers: [], rows: [] };
let colWidths = {};
let currentRel = null;
let currentFilter = "not-done";

function blankData() {
  return { headers: ["done", "Kolonne 1", "Kolonne 2", "Kolonne 3", "Rel"], rows: [] };
}

// Debounce utilities
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
async function load() {
  try {
    const r = await fetch("/api/data");
    if (!r.ok) return blankData();
    const raw = await r.json();
    if (!raw || !raw.headers || !raw.rows) return blankData();
    return raw;
  } catch { return blankData(); }
}
async function save() {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
}
const saveDebounced = debounce(save, 300);

async function loadWidths() {
  try {
    const r = await fetch("/api/widths");
    if (!r.ok) return {};
    return (await r.json()) || {};
  } catch { return {}; }
}
async function saveWidths() {
  try {
    await fetch("/api/widths", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(colWidths),
    });
  } catch {}
}
const saveWidthsDebounced = debounce(saveWidths, 300);

function updateRelDataList() {
  const relIndex = data.headers.indexOf("Rel");
  if (relIndex === -1) return;
  const set = new Set();
  for (const row of data.rows) {
    const v = row[relIndex];
    if (v) set.add(String(v));
  }
  relDataList.innerHTML = Array.from(set).map((rel) => '<option value="' + rel.replace(/"/g, "&quot;") + '"></option>').join("");
}

function handleUrlParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const relName = urlParams.get("rel");
  if (relName) currentRel = relName;
}

function addRow(value = "") {
  const len = data.headers.length;
  const row = new Array(len).fill("");
  const doneIdx = data.headers.indexOf("done");
  if (doneIdx >= 0) row[doneIdx] = false;

  const firstVisibleIdx = data.headers.findIndex((h) => h !== "done");
  if (firstVisibleIdx >= 0) row[firstVisibleIdx] = value;

  if (currentRel) {
    const relIdx = data.headers.indexOf("Rel");
    if (relIdx >= 0) row[relIdx] = currentRel;
  }
  data.rows.push(row);
  saveDebounced();
  render();

  const lastTr = tbody.lastElementChild;
  if (lastTr) {
    const firstCell = lastTr.querySelector('td[data-col]');
    if (firstCell && firstCell instanceof HTMLElement) firstCell.focus();
  }
}

function makeResizable(th, headerIndex) {
  const resizer = document.createElement("div");
  resizer.className = "resizer";
  let startX = 0;
  let startWidth = 0;
  const onMove = (ev) => {
    const newW = Math.max(40, startWidth + ((ev.pageX ?? startX) - startX));
    th.style.width = newW + "px";
    colWidths[headerIndex] = newW;
    const tds = document.querySelectorAll('td[data-col="' + headerIndex + '"]');
    tds.forEach((td) => { td.style.width = newW + "px"; });
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    saveWidthsDebounced();
  };
  resizer.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startX = e.pageX ?? 0;
    startWidth = th.offsetWidth;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
  th.appendChild(resizer);
}

function hideContextMenu() {
  contextMenu.style.display = "none";
}

function render() {
  // HEAD
  theadRow.innerHTML = "";
  const thDone = document.createElement("th");
  thDone.textContent = "";
  theadRow.appendChild(thDone);

  data.headers.forEach((h, i) => {
    if (h === "done") return;
    const th = document.createElement("th");
    th.textContent = h;
    th.id = "col-header-" + i;
    if (colWidths[i]) th.style.width = colWidths[i] + "px";
    th.style.position = "relative";
    makeResizable(th, i);

    if (h !== "Rel") {
      th.contentEditable = "true";
      th.spellcheck = false;
      th.addEventListener("input", () => {
        data.headers[i] = th.textContent || "";
        saveDebounced();
      });
    } else {
      th.className = "rel-col";
    }
    theadRow.appendChild(th);
  });

  updateRelDataList();

  // BODY
  tbody.innerHTML = "";
  const doneIdx = data.headers.indexOf("done");
  const relIdx = data.headers.indexOf("Rel");
  
  let filteredRows = data.rows;

  if (currentRel && relIdx !== -1) {
     filteredRows = filteredRows.filter((row) => row[relIdx] === currentRel);
  }
  
  if (doneIdx !== -1) {
      if (currentFilter === "not-done") {
          filteredRows = filteredRows.filter(row => !row[doneIdx]);
      } else if (currentFilter === "done") {
          filteredRows = filteredRows.filter(row => row[doneIdx]);
      }
  }

  filteredRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-row-index", data.rows.indexOf(row));

    tr.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      contextMenu.style.display = "block";
      const menuWidth = 160;
      const menuHeight = 40;
      const x = Math.min(e.pageX, window.innerWidth - menuWidth - 8);
      const y = Math.min(e.pageY, window.innerHeight - menuHeight - 8);
      contextMenu.style.left = x + "px";
      contextMenu.style.top = y + "px";
      contextMenu.dataset.rowId = String(data.rows.indexOf(row));
    });

    const tdDone = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "cbx";
    if (doneIdx !== -1) {
        cb.checked = !!row[doneIdx];
    }
    cb.addEventListener("change", () => {
      if (doneIdx !== -1) {
          row[doneIdx] = cb.checked;
          saveDebounced();
          render(); 
      }
    });
    
    tdDone.appendChild(cb);
    tr.appendChild(tdDone);

    row.forEach((cell, cIdx) => {
      if (data.headers[cIdx] === "done") return;
      const td = document.createElement("td");
      td.setAttribute("data-col", String(cIdx));
      if (colWidths[cIdx]) td.style.width = colWidths[cIdx] + "px";

      const headerName = data.headers[cIdx];
      
      if (headerName === "Rel") {
          td.classList.add("rel-chip-container");
          td.innerHTML = `
            <span class="rel-chip">
              <span class="rel-chip-text">${cell == null ? "" : String(cell)}</span>
            </span>
          `;
      } else {
          td.textContent = cell == null ? "" : String(cell);
      }

      td.contentEditable = "true";
      td.spellcheck = false;

      td.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addRow();
        } else if (e.key === "Tab") {
          const nextEl = td.nextElementSibling;
          if (nextEl && nextEl instanceof HTMLElement) {
            e.preventDefault();
            nextEl.focus();
          } else {
            newRowInput.focus();
          }
        }
      });

      td.addEventListener("input", () => {
        const idx = data.rows.indexOf(row);
        if (idx !== -1) {
          if (headerName === "Rel") {
              const val = td.innerText.trim();
              const chipSpan = td.querySelector('.rel-chip-text');
              if (chipSpan) chipSpan.textContent = val;
              data.rows[idx][cIdx] = val;
          } else {
              data.rows[idx][cIdx] = td.textContent || "";
          }
          saveDebounced();
          if (headerName === "Rel") updateRelDataList();
        }
      });

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function initEvents() {
  el("#add-row").addEventListener("click", () => {
    addRow(newRowInput.value);
    newRowInput.value = "";
  });
  newRowInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRow(newRowInput.value);
      newRowInput.value = "";
    }
  });
  
  // Lukk context-meny ved klikk utenfor eller Escape
  window.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) hideContextMenu();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideContextMenu();
  });

  deleteRowItem.addEventListener("click", () => {
    const rowId = contextMenu.dataset.rowId;
    if (rowId) {
      const idx = parseInt(rowId, 10);
      if (idx !== -1) {
        data.rows.splice(idx, 1);
        saveDebounced();
        render();
      }
    }
    hideContextMenu();
  });

  els(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      els(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });
}

(async () => {
  colWidths = await loadWidths();
  data = await load();
  handleUrlParameter();
  initEvents();
  render();
})();