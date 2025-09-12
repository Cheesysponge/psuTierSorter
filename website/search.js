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
document.getElementById('sfxToggle').addEventListener('change', loadAndFilter);
document.getElementById('importantToggle').addEventListener('change', loadAndFilter);
document.getElementById('whiteToggle').addEventListener('change', loadAndFilter);
document.getElementById('cheapestCountInput').addEventListener('change', loadAndFilter);
document.getElementById('searchBar').addEventListener('input', loadAndFilter);
document.getElementById('crap').addEventListener('input', loadAndFilter);


function loadAndFilter() {
  wantedTiers = ["N/A","F","E","D+","D","D+","C-*","C*","C+*","C-", "C", "C+","B-*","B*","B+*", "B-", "B", "B+","A-*","A*","A+*", "A-", "A", "A+"]
  const minWattage = parseInt(document.getElementById('minWattage').value, 10) || 0;
  const sfxOnly = document.getElementById('sfxToggle').checked;
  const whitesOnly = document.getElementById('whiteToggle').checked;
  const excludeCrap = document.getElementById('crap').checked;

  const searchQuery = document.getElementById('searchBar').value.trim().toLowerCase();

  if(excludeCrap){
      wantedTiers = ["C-", "C", "C+","B-", "B", "B+", "A-", "A", "A+"]

  }

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
        const modularField = (row['modularity']).toLowerCase();
        const isModular = modularField.includes('full') || modularField.includes('semi');
        const isSFX = row['size'].includes('SFX');
        const isWhite = row['color'].includes('White');

        // Search match — checks if any relevant field contains the query
        const matchesSearch =
          searchQuery === '' ||
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchQuery)
          );

        return (
          watt >= minWattage &&
          !isNaN(price) &&
          price > 0 &&
          wantedTiers.includes(tier) &&
          (!sfxOnly || isSFX) &&
          (!whitesOnly || isWhite) &&
          matchesSearch
        );
      });

      const sortByPrice = true;

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
        else if (tier=='E') tierClass = 'tier-E';
        else if (tier == 'F') tierClass = 'tier-F';


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
            sortedCheapest = sortedCheapest.concat(
            group.sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price))
            );
        }
        });

        // Optional global sort
        if (sortByPrice) {
        sortedCheapest.sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price));
        }

        // Apply global cap
        sortedCheapest = sortedCheapest.slice(0, cheapestCount);

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
  else if (tier=='E') tierClass = 'tier-E';
  else if (tier == 'F') tierClass = 'tier-F';
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