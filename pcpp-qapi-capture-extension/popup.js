const STORAGE_KEY = "pcppQapiCaptures";

function getCaptures() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
      resolve(result[STORAGE_KEY].slice().sort((a, b) => a.page - b.page));
    });
  });
}

function setCaptures(captures) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: captures }, resolve);
  });
}

function combinedPayload(captures) {
  const pages = captures.slice().sort((a, b) => a.page - b.page);
  const firstPayload = pages[0] && pages[0].payload ? pages[0].payload : {};
  const combined = {
    qid: firstPayload.qid || 1,
    html: "",
    data: {},
    count: firstPayload.count || 0,
    compatibility: firstPayload.compatibility !== false,
    breadcrumbs: firstPayload.breadcrumbs || [],
    paging_row: pages.length ? pages[pages.length - 1].payload.paging_row || "" : "",
    lowest_price: firstPayload.lowest_price || null,
    success: true
  };

  for (const capture of pages) {
    const payload = capture.payload || {};
    combined.html += payload.html || "";
    if (payload.data && typeof payload.data === "object") {
      Object.assign(combined.data, payload.data);
    }
    if (typeof payload.count === "number") combined.count = payload.count;
    if (payload.lowest_price && (!combined.lowest_price || payload.lowest_price < combined.lowest_price)) {
      combined.lowest_price = payload.lowest_price;
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    pageCount: pages.length,
    pages,
    combined
  };
}

function cellText(row, selector) {
  const cell = row.querySelector(selector);
  if (!cell) return "";
  const clone = cell.cloneNode(true);
  const label = clone.querySelector(".specLabel");
  if (label) label.remove();
  return clone.textContent.replace(/\s+/g, " ").trim();
}

function parsePrice(text, fallbackCents) {
  if (Number.isFinite(fallbackCents) && fallbackCents > 0) return (fallbackCents / 100).toFixed(2);
  const match = text.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
  return match ? match[1].replace(/,/g, "") : "";
}

function absoluteImageUrl(src) {
  if (!src) return "";
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}

function csvRowsFromCombined(combined) {
  const doc = new DOMParser().parseFromString(`<table><tbody>${combined.html || ""}</tbody></table>`, "text/html");
  const rows = [];
  for (const row of doc.querySelectorAll("tr.tr__product")) {
    const productId = row.getAttribute("data-pb-id") || "";
    const qapiItem = combined.data && combined.data[productId] ? combined.data[productId] : {};
    const nameNode = row.querySelector(".td__nameWrapper p") || row.querySelector(".td__nameWrapper");
    const imgNode = row.querySelector("img[src]");
    rows.push({
      name: nameNode ? nameNode.textContent.replace(/\s+/g, " ").trim() : "",
      wattage: (cellText(row, ".td__spec--3").match(/(\d+)\s*W/) || [null, ""])[1],
      efficiency: cellText(row, ".td__spec--2"),
      price: parsePrice(cellText(row, ".td__price"), qapiItem.price),
      size: cellText(row, ".td__spec--1"),
      image: absoluteImageUrl(qapiItem.img || (imgNode ? imgNode.getAttribute("src") : "")),
      modularity: cellText(row, ".td__spec--4"),
      color: cellText(row, ".td__spec--5")
    });
  }
  return rows;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  const fields = ["name", "wattage", "efficiency", "price", "size", "image", "modularity", "color"];
  const lines = [fields.join(",")];
  for (const row of rows) {
    lines.push(fields.map((field) => csvEscape(row[field])).join(","));
  }
  return lines.join("\r\n");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function render() {
  const captures = await getCaptures();
  const totalRows = captures.reduce((sum, capture) => sum + (capture.productIds || []).length, 0);
  const latestCount = captures.length ? captures[captures.length - 1].count : null;

  document.querySelector("#summary").innerHTML = captures.length
    ? `<strong>${captures.length}</strong> page(s), <strong>${totalRows}</strong> captured rows<br><span class="muted">Latest reported total: ${latestCount ?? "unknown"}</span>`
    : `<span class="muted">Open PCPartPicker PSU pages manually. Captures appear here.</span>`;

  const list = document.querySelector("#pages");
  list.textContent = "";
  for (const capture of captures) {
    const item = document.createElement("li");
    item.innerHTML = `Page ${capture.page}: ${(capture.productIds || []).length} rows <span class="muted">${capture.capturedAt || ""}</span>`;
    list.appendChild(item);
  }
}

document.querySelector("#refresh").addEventListener("click", render);

document.querySelector("#export-json").addEventListener("click", async () => {
  const captures = await getCaptures();
  download("pcpp-qapi-combined.json", JSON.stringify(combinedPayload(captures), null, 2), "application/json");
});

document.querySelector("#export-csv").addEventListener("click", async () => {
  const captures = await getCaptures();
  const exported = combinedPayload(captures);
  download("psus_located.csv", toCsv(csvRowsFromCombined(exported.combined)), "text/csv");
});

document.querySelector("#clear").addEventListener("click", async () => {
  await setCaptures([]);
  await render();
});

render();
