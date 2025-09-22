// --- render ---
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
		// makeResizable må defineres i denne filen eller importeres
		if (typeof makeResizable === "function") makeResizable(th, i);

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

	updateRelDataList(relDataList);

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
				if (cb.checked) {
					const tr = cb.closest('tr');
					if (tr) {
						tr.classList.add('row-checked-anim');
						setTimeout(() => {
							render();
						}, 500);
					} else {
						render();
					}
				} else {
					render();
				}
			}
		});
		tdDone.appendChild(cb);
		tr.appendChild(tdDone);
		let relColIdx = -1;
		row.forEach((cell, cIdx) => {
			if (data.headers[cIdx] === "done") return;
			const td = document.createElement("td");
			td.setAttribute("data-col", String(cIdx));
			if (colWidths[cIdx]) td.style.width = colWidths[cIdx] + "px";
			const headerName = data.headers[cIdx];
			if (headerName === "Rel") relColIdx = cIdx;
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
					if (headerName === "Rel") updateRelDataList(relDataList);
				}
			});
			tr.appendChild(td);
		});
		// Slett-knapp etter Rel
		const tdDelete = document.createElement("td");
		tdDelete.className = "delete-col-cell";
		const delBtn = document.createElement("button");
		delBtn.className = "delete-row-btn";
		delBtn.textContent = "Slett";
		delBtn.addEventListener("click", () => {
			const idx = data.rows.indexOf(row);
			if (idx !== -1) {
				data.rows.splice(idx, 1);
				saveDebounced();
				render();
			}
		});
		tdDelete.appendChild(delBtn);
		tr.appendChild(tdDelete);
		tbody.appendChild(tr);
	});
}

// --- initEvents ---
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
	window.addEventListener("click", (e) => {
		if (!contextMenu.contains(e.target)) hideContextMenu(contextMenu);
	});
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") hideContextMenu(contextMenu);
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
		hideContextMenu(contextMenu);
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
// Sist redigert: 2025-09-22 / Fil: script.js
console.log('Sist redigert: 2025-09-22 / Fil: script.js');

import { el, els } from "./utils/dom.js";
import { debounce } from "./utils/debounce.js";
import { blankData, load, save, loadWidths, saveWidths } from "./data/data.js";
import { updateRelDataList, handleUrlParameter, hideContextMenu } from "./ui/ui.js";

let data = { headers: [], rows: [] };
let colWidths = {};
let currentRel = null;
let currentFilter = "not-done";

(async () => {
	colWidths = await loadWidths();
	data = await load();
	if (!data.headers || !Array.isArray(data.headers) || data.headers.length === 0) {
		data.headers = ["done", "Kolonne 1", "Kolonne 2", "Kolonne 3", "Rel"];
	}
	handleUrlParameter();
	initEvents();
	render();
})();
