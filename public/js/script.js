// Sist redigert: 2025-09-22 / Fil: script.js
console.log('Sist redigert: 2025-09-22 / Fil: script.js');

import { el, els } from "./utils/dom.js";
import { debounce } from "./utils/debounce.js";
import { data, colWidths, currentRel, currentFilter, blankData, load, save, loadWidths, saveWidths } from "./data/data.js";
import { updateRelDataList, handleUrlParameter, hideContextMenu } from "./ui/ui.js";

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
