import { data, currentRel } from "../data/data.js";

export function updateRelDataList(relDataList) {
  const relIndex = data.headers.indexOf("Rel");
  if (relIndex === -1) return;
  const set = new Set();
  for (const row of data.rows) {
    const v = row[relIndex];
    if (v) set.add(String(v));
  }
  relDataList.innerHTML = Array.from(set).map((rel) => '<option value="' + rel.replace(/"/g, "&quot;") + '"></option>').join("");
}

export function handleUrlParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const relName = urlParams.get("rel");
  if (relName) currentRel = relName;
}

export function hideContextMenu(contextMenu) {
  contextMenu.style.display = "none";
}
