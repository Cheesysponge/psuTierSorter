

// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
  const faqContainer = document.querySelector('.faq-content');

  faqContainer.addEventListener('click', (e) => {
    const groupHeader = e.target.closest('.faq-group-header');

    if (!groupHeader) return;

    const group = groupHeader.parentElement;
    const groupBody = group.querySelector('.faq-group-body');
    const icon = groupHeader.querySelector('i');

    // Toggle icon
    icon.classList.toggle('fa-plus');
    icon.classList.toggle('fa-minus');

    // Toggle visibility of body
    groupBody.classList.toggle('open');

    // Close other open FAQ bodies
    const otherGroups = faqContainer.querySelectorAll('.faq-group');

    otherGroups.forEach((otherGroup) => {
      if (otherGroup !== group) {
        const otherGroupBody = otherGroup.querySelector('.faq-group-body');
        const otherIcon = otherGroup.querySelector('.faq-group-header i');

        otherGroupBody.classList.remove('open');
        otherIcon.classList.remove('fa-minus');
        otherIcon.classList.add('fa-plus');
      }
    });
  });
});

// Mobile Menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerButton = document.querySelector('.hamburger-button');
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburgerButton.addEventListener('click', () =>
    mobileMenu.classList.toggle('active')
  );
});


noCacheURL = `${'psu_stored.csv'}?t=${Date.now()}`;
currencySymbol = "$";
document.getElementById('modularToggle').addEventListener('change', loadAndFilter);
document.getElementById('sfxToggle').addEventListener('change', loadAndFilter);
document.getElementById('atxToggle').addEventListener('change', loadAndFilter);
document.getElementById('importantToggle').addEventListener('change', loadAndFilter);
document.getElementById('whiteToggle').addEventListener('change', loadAndFilter);
document.getElementById('sortByPriceToggle').addEventListener('change', loadAndFilter);
document.getElementById('cheapestCountInput').addEventListener('change', loadAndFilter);

function loadAndFilter() {
  wantedTiers = ["D","C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
  const minWattage = parseInt(document.getElementById('minWattage').value, 10) || 0;
  const modularOnly = document.getElementById('modularToggle').checked;
  const sfxOnly = document.getElementById('sfxToggle').checked;
  const atx3 = document.getElementById('atxToggle').checked;
  const whitesOnly = document.getElementById('whiteToggle').checked;

  // if(includeD){
  //   wantedTiers = ["D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
  // }

  fetch(noCacheURL)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load CSV');
      return response.text();
    })
    .then(csvText => {
      const parsed = Papa.parse(csvText.trim(), { header: true });
      const data = parsed.data;

      // Filter by wattage and tier inclusion, also valid price
      const filtered = data.filter(row => {
        const watt = Number(row['Wattage']);
        const price = parseFloat(row['Price']);
        const tier = row['Tier'];
        const modularField = (row['modularity']).toLowerCase(); // adjust if needed
        const atxver = (row['atxver']).toLowerCase();
        const isModular = modularField.includes('full') || modularField.includes('semi'); // matches "modular" or "semi-modular"
        const isSFX = row['size'].includes('SFX');
        const isWhite = row['color'].includes('White');
        const is3 = atxver.includes('3.x');
        return (
          watt >= minWattage &&
          !isNaN(price) &&
          price > 0 &&
          wantedTiers.includes(tier) &&
          (!modularOnly || isModular) &&
          (!sfxOnly || isSFX) &&
          (!atx3 || is3) &&
          (!whitesOnly || isWhite)


        );
      });
      const sortByPrice = !document.getElementById('sortByPriceToggle').checked;

      // Find cheapest per tier
      const countInput = document.getElementById("cheapestCountInput");
      const cheapestCount = Math.max(1, parseInt(countInput?.value || "1"));

      // Group filtered rows by tier
      const groupedByTier = {};
      filtered.forEach(row => {
        const tier = row['Tier'];
        let tierClass = '';

        if (tier.startsWith('A')) tierClass = 'tier-A';
        else if (tier.startsWith('B')) tierClass = 'tier-B';
        else if (tier.startsWith('C')) tierClass = 'tier-C';
        else if (tier.startsWith('D')) tierClass = 'tier-D';

        if (tier.endsWith('+')) tierClass += 'p';
        else if (tier.endsWith('-')) tierClass += 'm';

        const tr = document.createElement('tr');
        tr.className = tierClass;

        if (!groupedByTier[tier]) {
          groupedByTier[tier] = [];
        }
        groupedByTier[tier].push(row);
      });

      // Sort each tier group by price, then take top X
      let sortedCheapest = [];
      wantedTiers.forEach(tier => {
        const group = groupedByTier[tier];
        if (group) {
          const top = group
            .sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price))
            .slice(0, cheapestCount);
          sortedCheapest = sortedCheapest.concat(top);
        }
      });

      // Optional global sort
      if (sortByPrice) {
        sortedCheapest.sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price));
      }
      if (sortByPrice) {
        // sort globally by price (ascending)
        sortedCheapest.sort((a, b) => {
          const pa = parseFloat(String(a['Price']).replace(/[^0-9.\-]/g, ''));
          const pb = parseFloat(String(b['Price']).replace(/[^0-9.\-]/g, ''));
          return pa - pb;
        });

        // helpers local to this block
        const num = (v) => {
          const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
          return Number.isFinite(n) ? n : NaN;
        };
        const tierOrder = ["D","C-","C","C+","B-","B","B+","A-","A","A+"]; // lowest -> highest
        const tierScore = (t) => {
          const i = tierOrder.indexOf((t || '').trim());
          return i === -1 ? -Infinity : i; // unknown tiers count as worst
        };

        // prune dominated items: (price >= prevPrice + 2) AND (tier lower) => exclude
        const pruned = [];
        for (const item of sortedCheapest) {
          const price = num(item['Price']);
          const tier  = (item['Tier'] || '').trim();

          if (!Number.isFinite(price)) continue;
          if (pruned.length === 0) { pruned.push(item); continue; }

          const prev = pruned[pruned.length - 1];
          const prevPrice = num(prev['Price']);
          const prevTier  = (prev['Tier'] || '').trim();

          const priceWorse = price >= prevPrice + 0;                 // "at least $2"
          const tierWorse  = tierScore(tier) < tierScore(prevTier);  // lower/worse tier

          if (priceWorse && tierWorse) continue; // dominated → drop
          pruned.push(item);
        }

        sortedCheapest = pruned;
      }


      createTableFromData(sortedCheapest);
    })
    .catch(err => {
      document.getElementById('tableContainer').textContent = 'Error loading CSV: ' + err.message;
      console.error(err);
    });
}

function createTableFromData(data) {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';
  const importantToggle = document.getElementById('importantToggle').checked;

  if (data.length === 0) {
    container.textContent = 'No PSUs match the criteria.';
    return;
  }

  const table = document.createElement('table');

  // Columns in requested order
  columns = [
    { key: 'Tier', label: 'Tier' },
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
  if(!importantToggle){
      columns = [
    { key: 'Tier', label: 'Tier' },
    { key: 'located Name', label: 'Name' },
    { key: 'Price', label: 'Price' },
    { key: 'Wattage', label: 'Wattage' },
    { key: 'Efficiency', label: '80+ Rating' },
    { key: 'modularity', label: 'Modularity' },
    { key: 'atxver', label: 'ATX ver.' },
  ];
  }

  // Header row
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Data rows
data.forEach(row => {
  const tr = document.createElement('tr');

  // Add tier class here
  let tierClass = '';
  const tier = row['Tier'];
  if (tier.startsWith('A')) tierClass = 'tier-A';
  else if (tier.startsWith('B')) tierClass = 'tier-B';
  else if (tier.startsWith('C')) tierClass = 'tier-C';
  else if (tier.startsWith('D')) tierClass = 'tier-D';

  if (tier.endsWith('+')) tierClass += 'p';
  else if (tier.endsWith('-')) tierClass += 'm';

  tr.className = tierClass;

  columns.forEach(col => {
    const td = document.createElement('td');

    if (col.key === 'Image URL' && row[col.key]) {
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
        td.classList.add('tier-cell');        // for CSS tooltip
        td.dataset.model = modelText;         // drives tooltip text
        td.setAttribute('aria-label', `Matched model: ${modelText}`);
        td.setAttribute('tabindex', '0');     // keyboard focusable
      }
      if (link) {
        const a = document.createElement('a');
        a.href = link;
        a.textContent = row[col.key];
        a.target = '_blank';
        td.appendChild(a);
      } else {
        td.textContent = row[col.key];
      }

    } else if (col.key === 'Price') {
      const price = parseFloat(row[col.key]);
      td.textContent = isNaN(price) ? '' : `${currencySymbol}${price.toFixed(2)}`;
    } else {
      td.textContent = row[col.key] || '';
    }
    if (col.key === 'Tier') {
        const modelText = (row['Matched Tier Model'] || '').toString().trim();
        if (modelText) {
          td.classList.add('tier-cell');        // for CSS tooltip
          td.dataset.model = modelText;         // drives tooltip text
          td.setAttribute('aria-label', `Matched model: ${modelText}`);
          td.setAttribute('tabindex', '0');     // keyboard focusable
        }
      }
    tr.appendChild(td);
  });

  table.appendChild(tr);
});



  container.appendChild(table);
}

window.addEventListener('DOMContentLoaded', () => {
  loadAndFilter();
});

document.getElementById('minWattage').addEventListener('input', () => {
  loadAndFilter()
});

function getSelectedOption() {
  const dropdown = document.getElementById("myDropdown");
  const selectedValue = dropdown.value;
const selectedText = dropdown.options[dropdown.selectedIndex].text;
  const match = selectedText.match(/\(([^)]+)\)/);
  currencySymbol = match ? match[1].split(' ')[0] : '$';
  if(selectedValue == "usa"){
    noCacheURL = `${'psu_stored.csv'}?t=${Date.now()}`;
  }
  else{
    noCacheURL = `${selectedValue+'.psu_stored.csv'}?t=${Date.now()}`
  }
  loadAndFilter()

}


















