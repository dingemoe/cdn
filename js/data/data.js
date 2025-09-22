// Data handling: load, save, blankData, etc.
export let data = { headers: [], rows: [] };
export let colWidths = {};
export let currentRel = null;
export let currentFilter = "not-done";

export function blankData() {
  return { headers: ["done", "Kolonne 1", "Kolonne 2", "Kolonne 3", "Rel"], rows: [] };
}

export async function load() {
  try {
    const r = await fetch("/api/data");
    if (!r.ok) return blankData();
    const raw = await r.json();
    if (!raw || !raw.headers || !raw.rows) return blankData();
    return raw;
  } catch { return blankData(); }
}

export async function save() {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
}

export async function loadWidths() {
  try {
    const r = await fetch("/api/widths");
    if (!r.ok) return {};
    return (await r.json()) || {};
  } catch { return {}; }
}

export async function saveWidths() {
  try {
    await fetch("/api/widths", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(colWidths),
    });
  } catch {}
}
