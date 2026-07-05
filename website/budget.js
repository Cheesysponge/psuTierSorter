// Mobile Menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerButton = document.querySelector('.hamburger-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburgerButton || !mobileMenu) return;
  hamburgerButton.addEventListener('click', () => mobileMenu.classList.toggle('active'));
});

let noCacheURL = `psu_stored.csv?t=${Date.now()}`;
let currencySymbol = "$";

const cleanTierGroups = {
  A: new Set(["A-", "A", "A+"]),
  B: new Set(["B-", "B", "B+"]),
  C: new Set(["C-", "C", "C+"])
};

const tierRank = {
  "C-": 1, "C": 2, "C+": 3,
  "B-": 4, "B": 5, "B+": 6,
  "A-": 7, "A": 8, "A+": 9
};

function parsePrice(value) {
  const price = parseFloat(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(price) ? price : NaN;
}

function getTierGroup(tierValue) {
  const tier = String(tierValue || '').trim().toUpperCase();
  if (!tier || tier.includes('*')) return null;

  for (const [group, tiers] of Object.entries(cleanTierGroups)) {
    if (tiers.has(tier)) return group;
  }

  return null;
}

function rowClassForGroup(group) {
  if (group === 'A') return 'tier-A';
  if (group === 'B') return 'tier-B';
  if (group === 'C') return 'tier-C';
  return '';
}

function isBetterBudgetPick(candidate, current) {
  if (!current) return true;

  const candidateWatt = Number(candidate['Wattage']);
  const currentWatt = Number(current['Wattage']);
  if (candidateWatt !== currentWatt) return candidateWatt > currentWatt;

  const candidatePrice = parsePrice(candidate['Price']);
  const currentPrice = parsePrice(current['Price']);
  if (candidatePrice !== currentPrice) return candidatePrice < currentPrice;

  const candidateTier = tierRank[String(candidate['Tier'] || '').trim().toUpperCase()] || 0;
  const currentTier = tierRank[String(current['Tier'] || '').trim().toUpperCase()] || 0;
  return candidateTier > currentTier;
}

function isCheaperPick(candidate, current) {
  if (!current) return true;

  const candidatePrice = parsePrice(candidate['Price']);
  const currentPrice = parsePrice(current['Price']);
  if (candidatePrice !== currentPrice) return candidatePrice < currentPrice;

  const candidateWatt = Number(candidate['Wattage']);
  const currentWatt = Number(current['Wattage']);
  if (candidateWatt !== currentWatt) return candidateWatt > currentWatt;

  const candidateTier = tierRank[String(candidate['Tier'] || '').trim().toUpperCase()] || 0;
  const currentTier = tierRank[String(current['Tier'] || '').trim().toUpperCase()] || 0;
  return candidateTier > currentTier;
}

function loadAndFilter() {
  const budget = parsePrice(document.getElementById('budgetInput').value);
  const modularOnly = document.getElementById('modularToggle').checked;
  const sfxOnly = document.getElementById('sfxToggle').checked;
  const whitesOnly = document.getElementById('whiteToggle').checked;

  fetch(noCacheURL)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load CSV');
      return response.text();
    })
    .then(csvText => {
      const parsed = Papa.parse(csvText.trim(), { header: true });
      const data = parsed.data;
      const bestByGroup = { A: null, B: null, C: null };
      const cheapestByGroup = { A: null, B: null, C: null };

      data.forEach(row => {
        const group = getTierGroup(row['Tier']);
        const price = parsePrice(row['Price']);
        const watt = Number(row['Wattage']);
        const modularField = (row['modularity'] || '').toLowerCase();
        const isModular = modularField.includes('full') || modularField.includes('semi');
        const isSFX = (row['size'] || '').includes('SFX');
        const isWhite = (row['color'] || '').includes('White');

        const passesFixedFilters =
          group &&
          Number.isFinite(price) &&
          Number.isFinite(watt) &&
          price > 0 &&
          (!modularOnly || isModular) &&
          (!sfxOnly || isSFX) &&
          (!whitesOnly || isWhite);

        if (!passesFixedFilters) {
          return;
        }

        if (isCheaperPick(row, cheapestByGroup[group])) {
          cheapestByGroup[group] = row;
        }

        if (!Number.isFinite(budget) || price > budget) return;

        if (isBetterBudgetPick(row, bestByGroup[group])) {
          bestByGroup[group] = row;
        }
      });

      createTableFromData(bestByGroup, cheapestByGroup, budget);
    })
    .catch(err => {
      document.getElementById('tableContainer').textContent = 'Error loading CSV: ' + err.message;
      console.error(err);
    });
}

function createTableFromData(bestByGroup, cheapestByGroup, budget) {
  const container = document.getElementById('tableContainer');
  const importantToggle = document.getElementById('importantToggle').checked;
  container.innerHTML = '';

  const groups = ["A", "B", "C"];
  const table = document.createElement('table');
  let columns = [
    { key: 'Budget Tier', label: 'Tier Group' },
    { key: 'Tier', label: 'Matched Tier' },
    { key: 'located Name', label: 'Name' },
    { key: 'Price', label: 'Price' },
    { key: 'Wattage', label: 'Wattage' },
    { key: 'Efficiency', label: '80+ Rating' },
    { key: 'modularity', label: 'Modularity' },
    { key: 'atxver', label: 'ATX ver.' }
  ];

  if (importantToggle) {
    columns = [
      { key: 'Budget Tier', label: 'Tier Group' },
      { key: 'Tier', label: 'Matched Tier' },
      { key: 'located Name', label: 'Name' },
      { key: 'Image URL', label: 'Image' },
      { key: 'Price', label: 'Price' },
      { key: 'Wattage', label: 'Wattage' },
      { key: 'Efficiency', label: '80+ Rating' },
      { key: 'size', label: 'Size' },
      { key: 'modularity', label: 'Modularity' },
      { key: 'color', label: 'Color' },
      { key: 'Matched Tier Model', label: 'Matched Tierlist Model' },
      { key: 'Matched Tier Model Info', label: 'Notes Based on Matched Model' },
      { key: 'atxver', label: 'ATX Ver' }
    ];
  }

  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  groups.forEach(group => {
    const row = bestByGroup[group];
    const tr = document.createElement('tr');
    tr.className = rowClassForGroup(group);

    columns.forEach(col => {
      const td = document.createElement('td');

      if (col.key === 'Budget Tier') {
        td.textContent = group;
      } else if (!row) {
        if (col.key === 'located Name') {
          const cheapest = cheapestByGroup[group];
          const cheapestPrice = cheapest ? parsePrice(cheapest['Price']) : NaN;
          td.textContent = Number.isFinite(cheapestPrice)
            ? `No match under budget. Cheapest clean ${group} is ${currencySymbol}${cheapestPrice.toFixed(2)}.`
            : `No clean ${group} match with these filters.`;
        } else if (col.key === 'Price' && Number.isFinite(budget)) {
          td.textContent = `>${currencySymbol}${budget.toFixed(2)}`;
        } else {
          td.textContent = '';
        }
      } else if (col.key === 'Image URL' && row[col.key]) {
        const img = document.createElement('img');
        let url = row[col.key].trim();
        if (url.startsWith('//')) url = 'https:' + url;
        img.src = url;
        img.alt = row['located Name'] || 'Image';
        td.appendChild(img);
      } else if (col.key === 'located Name') {
        const link = (row['Product URL'] || '').trim();
        const modelText = (row['Matched Tier Model Info'] || '').toString().trim();
        if (modelText) {
          td.classList.add('tier-cell');
          td.dataset.model = modelText;
          td.setAttribute('aria-label', `Matched model: ${modelText}`);
          td.setAttribute('tabindex', '0');
        }
        if (link) {
          const a = document.createElement('a');
          a.href = link;
          a.textContent = row[col.key];
          a.target = '_blank';
          td.appendChild(a);
        } else {
          td.textContent = row[col.key] || '';
        }
      } else if (col.key === 'Price') {
        const price = parsePrice(row[col.key]);
        td.textContent = Number.isFinite(price) ? `${currencySymbol}${price.toFixed(2)}` : '';
      } else {
        td.textContent = row[col.key] || '';
      }

      if (row && col.key === 'Tier') {
        const modelText = (row['Matched Tier Model'] || '').toString().trim();
        if (modelText) {
          td.classList.add('tier-cell');
          td.dataset.model = modelText;
          td.setAttribute('aria-label', `Matched model: ${modelText}`);
          td.setAttribute('tabindex', '0');
        }
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  container.appendChild(table);
}

function getSelectedOption() {
  const dropdown = document.getElementById("myDropdown");
  const selectedValue = dropdown.value;
  const selectedText = dropdown.options[dropdown.selectedIndex].text;
  const match = selectedText.match(/\(([^)]+)\)/);
  currencySymbol = match ? match[1].split(' ')[0] : '$';

  if (currencySymbol === 'Euro') currencySymbol = '\u20ac';
  if (currencySymbol === 'GBP') currencySymbol = '\u00a3';

  const budgetCurrency = document.getElementById('budgetCurrency');
  if (budgetCurrency) budgetCurrency.textContent = currencySymbol;

  if (selectedValue === "usa") {
    noCacheURL = `psu_stored.csv?t=${Date.now()}`;
  } else {
    noCacheURL = `${selectedValue}.psu_stored.csv?t=${Date.now()}`;
  }
  loadAndFilter();
}

window.addEventListener('DOMContentLoaded', () => {
  const bind = (id, ev) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, loadAndFilter);
  };

  bind('budgetInput', 'input');
  bind('modularToggle', 'change');
  bind('sfxToggle', 'change');
  bind('whiteToggle', 'change');
  bind('importantToggle', 'change');
  getSelectedOption();
});
