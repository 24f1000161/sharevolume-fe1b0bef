// Simple utilities
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function updateUI(entityName, maxVal, maxFy, minVal, minFy) {
  // Update document title and header
  if (entityName) {
    document.title = entityName + " - Shares Outstanding";
    const h1 = document.getElementById("share-entity-name");
    if (h1) h1.textContent = entityName;
    const sourceInfo = document.getElementById("source-info");
    if (sourceInfo) sourceInfo.textContent = "Data for " + entityName;
  }

  // Update max/min elements
  const maxValueEl = document.getElementById("share-max-value");
  const maxFyEl = document.getElementById("share-max-fy");
  const minValueEl = document.getElementById("share-min-value");
  const minFyEl = document.getElementById("share-min-fy");

  if (maxValueEl) maxValueEl.textContent = (typeof maxVal === "number" ? maxVal.toLocaleString() : "-");
  if (maxFyEl) maxFyEl.textContent = maxFy ?? "-";

  if (minValueEl) minValueEl.textContent = (typeof minVal === "number" ? minVal.toLocaleString() : "-");
  if (minFyEl) minFyEl.textContent = minFy ?? "-";

  // Enable download button when data is available
  const dlBtn = document.getElementById("download-data");
  if (dlBtn) dlBtn.disabled = !(typeof maxVal === "number" && typeof minVal === "number");
}

async function fetchFromSekProxy(ciK) {
  // Use a proxy to fetch JSON (CORS-friendly)
  const proxyUrl = `https://r.jina.ai/http://data.sec.gov/api/xbrl/companyconcept/CIK${ciK}/dei/EntityCommonStockSharesOutstanding.json`;
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error("Proxy fetch failed");
    const data = await resp.json();
    return data;
  } catch (e) {
    // Fallback to attempting direct fetch (may fail due to CORS)
    try {
      const direct = await fetch(`https://data.sec.gov/api/xbrl/companyconcept/CIK${ciK}/dei/EntityCommonStockSharesOutstanding.json`, {
        headers: {
          "User-Agent": "GitHubPagesApp/1.0 (contact@example.com)"
        }
      });
      if (!direct.ok) throw new Error("Direct fetch failed");
      return await direct.json();
    } catch (e2) {
      console.warn("SEC fetch failed:", e2);
      throw e2;
    }
  }
}

function computeFromData(data) {
  // Expect data.entityName and data.units.shares[] with {val, fy}
  const entityName = data?.entityName || "";
  const shares = data?.units?.shares || [];

  let maxVal = -Infinity;
  let maxFy = null;
  let minVal = Infinity;
  let minFy = null;

  for (let entry of shares) {
    const fyStr = String(entry?.fy ?? "");
    const valRaw = entry?.val;
    if (fyStr === "" || valRaw === undefined || valRaw === null) continue;

    const fyNum = parseInt(fyStr, 10);
    const valNum = Number(valRaw);
    if (!Number.isFinite(valNum) || fyNum <= 2020) continue; // strictly > 2020

    if (valNum > maxVal) {
      maxVal = valNum;
      maxFy = fyStr;
    }
    if (valNum < minVal) {
      minVal = valNum;
      minFy = fyStr;
    }
  }

  if (!isFinite(maxVal) || !isFinite(minVal)) {
    // No valid data
    return null;
  }

  return {
    entityName,
    max: { val: maxVal, fy: maxFy },
    min: { val: minVal, fy: minFy }
  };
}

async function loadFromDataJson() {
  try {
    const resp = await fetch("data.json");
    if (!resp.ok) throw new Error("data.json not found");
    const json = await resp.json();
    return json;
  } catch (e) {
    console.warn("Failed to load data.json:", e);
    return null;
  }
}

async function main() {
  // Initial load from data.json
  let initialData = await loadFromDataJson();

  // If there is a CIK query parameter, fetch updated data from SEC (via proxy) and update UI
  const cikParam = getQueryParam("CIK");
  if (cikParam && /^\d{10}$/.test(cikParam)) {
    try {
      const secd = await fetchFromSekProxy(cikParam);
      const computed = computeFromData(secd);
      if (computed) {
        updateUI(computed.entityName, computed.max.val, computed.max.fy, computed.min.val, computed.min.fy);
        // Update with the new data
        const dataForDownload = {
          entityName: computed.entityName,
          max: computed.max,
          min: computed.min
        };
        enableDownload(dataForDownload);
        // Also update the title and header
        document.title = computed.entityName + " - Shares Outstanding";
        const header = document.getElementById("share-entity-name");
        if (header) header.textContent = computed.entityName;
        const sourceInfo = document.getElementById("source-info");
        if (sourceInfo) sourceInfo.textContent = "Data for " + computed.entityName;
        // Reflect the entity name for the initial section
        if (initialData && initialData.entityName) {
          // override
        }
        return;
      }
    } catch (err) {
      console.warn("Using fallback data due to SEC fetch failure:", err);
    }
  }

  // If no CIK override or failed fetch, use the local data.json
  if (initialData) {
    const entityName = initialData.entityName || "Unknown Entity";
    const maxVal = initialData.max?.val ?? null;
    const maxFy = initialData.max?.fy ?? null;
    const minVal = initialData.min?.val ?? null;
    const minFy = initialData.min?.fy ?? null;
    updateUI(entityName, maxVal, maxFy, minVal, minFy);
    // Prepare downloadable content
    const dataForDownload = {
      entityName: entityName,
      max: { val: maxVal, fy: maxFy },
      min: { val: minVal, fy: minFy }
    };
    enableDownload(dataForDownload);
  }

  // Finally, if no data found, show a helpful message
  const header = document.getElementById("share-entity-name");
  if (header) header.textContent = "American Electric Power";
  const sourceInfo = document.getElementById("source-info");
  if (sourceInfo) sourceInfo.textContent = "Using local data.json as source.";
  updateUI("American Electric Power", initialData?.max?.val ?? 0, initialData?.max?.fy ?? "", initialData?.min?.val ?? 0, initialData?.min?.fy ?? "");
  enableDownload({
    entityName: "American Electric Power",
    max: initialData?.max ?? { val: 0, fy: "" },
    min: initialData?.min ?? { val: 0, fy: "" }
  });
}

function enableDownload(payload) {
  const btn = document.getElementById("download-data");
  const status = document.getElementById("status");
  if (!btn) return;
  btn.disabled = false;
  btn.onclick = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    if (status) status.textContent = "Downloaded data.json";
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Start the app
  main();
});
</SCRIPT>