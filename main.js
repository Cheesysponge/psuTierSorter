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

fetch('/cheapest.csv')
        .then(response => response.text())
        .then(csvText => createTableFromCSV(csvText))
        .catch(error => console.error('Error loading CSV:', error));

    function createTableFromCSV(csvText) {
        const parsed = Papa.parse(csvText.trim(), { header: false });
        const rows = parsed.data;
        const table = document.createElement('table');

        // Header row
        const headerRow = document.createElement('tr');
        rows[0].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Data rows
        for (let i = 1; i < rows.length; i++) {
            const tr = document.createElement('tr');
            rows[i].forEach((cell, index) => {
                const td = document.createElement('td');

                if (rows[0][index].trim() === 'Image') {
                    const img = document.createElement('img');
                    let url = cell.trim().replace(/^"|"$/g, '');  // Remove wrapping quotes if any
                    if (url.startsWith('//')) {
                        url = 'https:' + url;
                    }
                    img.src = url;
                    img.alt = 'Product Image';
                    td.appendChild(img);
                } else {
                    td.textContent = cell.trim().replace(/^"|"$/g, '');  // remove extra quotes
                }


                tr.appendChild(td);
            });
            table.appendChild(tr);
        }

        const container = document.getElementById('tableContainer');
        container.innerHTML = '';
        container.appendChild(table);
    }
