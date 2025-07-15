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

// function loadCSV(filename, clickedButton) {
//     // Highlight the active button
//     document.querySelectorAll('.csv-button').forEach(btn => btn.classList.remove('active'));
//     clickedButton.classList.add('active');

//     // Fetch and display CSV
//     fetch(`./${filename}`)
//         .then(response => {
//             if (!response.ok) throw new Error(`Failed to load ${filename}`);
//             return response.text();
//         })
//         .then(csvText => createTableFromCSV(csvText))
//         .catch(error => console.error('Error loading CSV:', error));
// }


//     function createTableFromCSV(csvText) {
//         const parsed = Papa.parse(csvText.trim(), { header: false });
//         const rows = parsed.data;
//         const table = document.createElement('table');

//         // Header row
//         const headerRow = document.createElement('tr');
//         rows[0].forEach(header => {
//             const th = document.createElement('th');
//             th.textContent = header;
//             headerRow.appendChild(th);
//         });
//         table.appendChild(headerRow);

//         // Data rows
//         for (let i = 1; i < rows.length; i++) {
//             const tr = document.createElement('tr');
//             rows[i].forEach((cell, index) => {
//                 const td = document.createElement('td');

//                 if (rows[0][index].trim() === 'Image') {
//                     const img = document.createElement('img');
//                     let url = cell.trim().replace(/^"|"$/g, '');  // Remove wrapping quotes if any
//                     if (url.startsWith('//')) {
//                         url = 'https:' + url;
//                     }
//                     img.src = url;
//                     img.alt = 'Product Image';
//                     td.appendChild(img);
//                 } else {
//                     td.textContent = cell.trim().replace(/^"|"$/g, '');  // remove extra quotes
//                 }


//                 tr.appendChild(td);
//             });
//             table.appendChild(tr);
//         }

//         const container = document.getElementById('tableContainer');
//         container.innerHTML = '';
//         container.appendChild(table);
//     }
// loadCSV('cheapest450.csv'); // load default on page load
// window.addEventListener('DOMContentLoaded', () => {
//     const defaultButton = document.querySelector('.csv-button');
//     if (defaultButton) {
//         loadCSV('cheapest450.csv', defaultButton);
//     }
// });


const wantedTiers = ["C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

function loadAndFilter() {
  const minWattage = parseInt(document.getElementById('minWattage').value, 10) || 0;
  
  fetch('psu_stored.csv')
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
        return watt >= minWattage && !isNaN(price) && price > 0 && wantedTiers.includes(row['Tier']);
      });

      // Find cheapest per tier
      const cheapestByTier = {};
      filtered.forEach(row => {
        const tier = row['Tier'];
        const price = parseFloat(row['Price']);
        if (!cheapestByTier[tier] || price < parseFloat(cheapestByTier[tier].Price)) {
          cheapestByTier[tier] = row;
        }
      });

      // Sort tiers in the specified order
      const sortedCheapest = wantedTiers
        .map(tier => cheapestByTier[tier])
        .filter(row => row !== undefined);

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

  if (data.length === 0) {
    container.textContent = 'No PSUs match the criteria.';
    return;
  }

  const table = document.createElement('table');

  // Columns in requested order
  const columns = [
    { key: 'Tier', label: 'Tier' },
    { key: 'Scraped Name', label: 'Name' },
    { key: 'Image URL', label: 'Image' },
    { key: 'Price', label: 'Price' },
    { key: 'Wattage', label: 'Wattage' },
    { key: 'modularity', label: 'Modularity' },
    { key: 'Matched Tier Model', label: 'Matched Tier Model' },
    { key: 'Matched Tier Model Info', label: 'Notes' }

  ];

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
  columns.forEach(col => {
    const td = document.createElement('td');

    if (col.key === 'Image URL' && row[col.key]) {
      const img = document.createElement('img');
      let url = row[col.key].trim();
      if (url.startsWith('//')) url = 'https:' + url;
      img.src = url;
      img.alt = row['Scraped Name'] || 'Image';
      td.appendChild(img);

    } else if (col.key === 'Scraped Name') {
      const link = (row['Product URL'] || '').trim();  // change 'Product URL' if needed
      if (link) {
        const a = document.createElement('a');
        a.href = link;
        a.textContent = row[col.key];
        a.target = '_blank';  // open in new tab
        td.appendChild(a);
      } else {
        td.textContent = row[col.key];
      }

    } else {
      td.textContent = row[col.key] || '';
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