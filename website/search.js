// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
  const faqContainer = document.querySelector('.faq-content');
  if (!faqContainer) return;

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
  if (!hamburgerButton || !mobileMenu) return;
  hamburgerButton.addEventListener('click', () => mobileMenu.classList.toggle('active'));
});


let noCacheURL = `psu_stored.csv?t=${Date.now()}`;
let currencySymbol = "$";

window.addEventListener('DOMContentLoaded', () => {
  const bind = (id, ev, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
  };

  bind('sfxToggle', 'change', loadAndFilter);
  bind('importantToggle', 'change', loadAndFilter);
  bind('whiteToggle', 'change', loadAndFilter);
  bind('cheapestCountInput', 'change', loadAndFilter);
  bind('searchBar', 'input', loadAndFilter);
  bind('crap', 'input', loadAndFilter);
  bind('minWattage', 'input', loadAndFilter);

  // initial render (after slider is created—see section C)
  // We'll call loadAndFilter() in the slider init below.
});



const ALL_TIERS = [
  "N/A","F","E","D-","D","D+",
  "C-*","C*","C+*","C-","C","C+",
  "B-*","B*","B+*","B-","B","B+",
  "A-*","A*","A+*","A-","A","A+"
];

const normTier = t => String(t || '').trim().toUpperCase();

// Helper: apply the "exclude crap" policy to a tier list
function applyExcludeCrap(tiers) {
  // keep only clean C-/C/C+, B-/B/B+, A-/A/A+ (no * and no D/E/F/N/A)
  const allowed = new Set(["C-","C","C+","B-","B","B+","A-","A","A+"]);
  return tiers.filter(t => allowed.has(t));
}

function loadAndFilter() {
  // Read UI inputs
  const minWattage = parseInt(document.getElementById('minWattage').value, 10) || 0;
  const sfxOnly = document.getElementById('sfxToggle').checked;
  const whitesOnly = document.getElementById('whiteToggle').checked;
  const excludeCrap = document.getElementById('crap').checked;
  const searchQuery = document.getElementById('searchBar').value.trim().toLowerCase();

  // 1) Take the tier range from the dual slider (fallback: full range)
  let lowIdx = 0, highIdx = ALL_TIERS.length - 1;
if (window.tierRange && typeof window.tierRange.value === 'function') {
  const v = window.tierRange.value();
  lowIdx = Math.max(0, Math.min(v.lowIndex ?? 0, ALL_TIERS.length - 1));
  highIdx = Math.max(0, Math.min(v.highIndex ?? ALL_TIERS.length - 1, ALL_TIERS.length - 1));
  if (lowIdx > highIdx) [lowIdx, highIdx] = [highIdx, lowIdx];
}

let wantedTiers = ALL_TIERS.slice(lowIdx, highIdx + 1);
if (excludeCrap) {
  wantedTiers = applyExcludeCrap(wantedTiers);
}
wantedTiers = wantedTiers.map(normTier);

  fetch(noCacheURL)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load CSV');
      return response.text();
    })
    .then(csvText => {
      const parsed = Papa.parse(csvText.trim(), { header: true });
      const data = parsed.data;

      // Filter by wattage, range tiers, etc.
      const filtered = data.filter(row => {
        const watt = Number(row['Wattage']);
        const price = parseFloat(row['Price']);
        const tier = row['Tier'];
        const modularField = (row['modularity'] || '').toLowerCase();
        const isSFX = (row['size'] || '').includes('SFX');
        const isWhite = (row['color'] || '').includes('White');

        // text search
        const matchesSearch =
          searchQuery === '' ||
          Object.values(row).some(val => String(val).toLowerCase().includes(searchQuery));

        return (
          watt >= minWattage &&
          !isNaN(price) && price > 0 &&
          wantedTiers.includes(tier) &&
          (!sfxOnly || isSFX) &&
          (!whitesOnly || isWhite) &&
          matchesSearch
        );
      });

      // Cheapest logic (unchanged except it now only sees rows in the chosen tier range)
      const sortByPrice = true;
      const countInput = document.getElementById("cheapestCountInput");
      const cheapestCount = Math.max(1, parseInt(countInput?.value || "1"));

      const groupedByTier = {};
      filtered.forEach(row => {
        const t = row['Tier'];
        (groupedByTier[t] ||= []).push(row);
      });

      let sortedCheapest = [];
      // Keep the tier order consistent with wantedTiers (which reflects the selected range)
      wantedTiers.forEach(t => {
        const group = groupedByTier[t];
        if (group) {
          sortedCheapest = sortedCheapest.concat(
            group.sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price))
          );
        }
      });

      if (sortByPrice) {
        sortedCheapest.sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price));
      }

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
  let columns = [
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
const tier = normTier(row['Tier']);
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












const debounce = (fn, ms=100) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
const debouncedLoad = debounce(() => loadAndFilter(), 80);


window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('tier-range');
  if (!root) return;

  const range = new TierRangeSlider(root, {
    tiers: ALL_TIERS,
    initialLow: 1,    // e.g. start at "C-"
    initialHigh: 24,  // e.g. up to "B"
    onChange: () => {
      loadAndFilter(); // 🔥 rebuild the table on each slider move
    }
  });

  // expose globally so loadAndFilter can read slider values
  window.tierRange = range;

  // do the first table render
  loadAndFilter();
});













(function(){
  const tiers = ["N/A","F","E","D+","D","D+","C-*","C*","C+*","C-","C","C+","B-*","B*","B+*","B-","B","B+","A-*","A*","A+*","A-","A","A+"];

  class TierRangeSlider {
    constructor(root, opts={}) {
      this.root = root;
      this.tiers = (opts.tiers && opts.tiers.length) ? opts.tiers : tiers;
      this.onChange = typeof opts.onChange === 'function' ? opts.onChange : () => {};
      const n = this.tiers.length;
      const initLow  = Math.min(Math.max(0, opts.initialLow  ?? 0), n-1);
      const initHigh = Math.min(Math.max(0, opts.initialHigh ?? Math.max(0, n-1)), n-1);
      this.low = Math.min(initLow, initHigh);
      this.high = Math.max(initLow, initHigh);

      root.classList.add('tier-range');
      root.setAttribute('role','group');
      root.setAttribute('aria-label','Tier range slider');

      const track = document.createElement('div');
      track.className = 'tr-track';

      const fill = document.createElement('div');
      fill.className = 'tr-fill';

      const thumbL = document.createElement('button');
      thumbL.type = 'button';
      thumbL.className = 'tr-thumb';
      thumbL.setAttribute('role','slider');
      thumbL.setAttribute('aria-label','Lower tier handle');

      const thumbH = document.createElement('button');
      thumbH.type = 'button';
      thumbH.className = 'tr-thumb';
      thumbH.setAttribute('role','slider');
      thumbH.setAttribute('aria-label','Upper tier handle');

      track.appendChild(fill);
      track.appendChild(thumbL);
      track.appendChild(thumbH);

      const ticks = document.createElement('div');
      ticks.className = 'tr-ticks';
      for (let i=0;i<n;i++) {
        const t = document.createElement('div');
        t.className = 'tr-tick';
        t.style.left = this._i2pct(i) + '%';
        ticks.appendChild(t);
      }

      const label = document.createElement('div');
      label.className = 'tr-label';
      label.innerHTML = `Tiers: <span class="tr-current"></span>` + `<span class="tr-sub">(indices <span class="tr-idx"></span> of ${n})</span>`;

      root.appendChild(track);
      root.appendChild(ticks);
      root.appendChild(label);

      this.els = {
        track, fill,
        thumbL, thumbH,
        current: label.querySelector('.tr-current'),
        idxText: label.querySelector('.tr-idx')
      };

      // Accessibility bounds on each thumb
      const setAriaBounds = (thumb, now, min, max, text) => {
        thumb.setAttribute('aria-valuemin', String(min));
        thumb.setAttribute('aria-valuemax', String(max));
        thumb.setAttribute('aria-valuenow', String(now));
        thumb.setAttribute('aria-valuetext', text);
      };

      const startDrag = (thumb, e) => {
        e.preventDefault();
        this._dragging = thumb;
        thumb.classList.add('active');
        thumb.setPointerCapture?.(e.pointerId);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      };
      const onMove = (e) => {
        if (!this._dragging) return;
        this._updateFromPointer(e, this._dragging === this.els.thumbL ? 'low' : 'high');
      };
      const onUp = () => {
        if (!this._dragging) return;
        this._dragging.classList.remove('active');
        this._dragging = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        this._fire();
      };

      this.els.thumbL.addEventListener('pointerdown', (e)=>startDrag(this.els.thumbL,e));
      this.els.thumbH.addEventListener('pointerdown', (e)=>startDrag(this.els.thumbH,e));

      // Click on track moves the nearest thumb
      this.els.track.addEventListener('pointerdown', (e) => {
        const idx = this._idxFromPointer(e);
        const distL = Math.abs(idx - this.low);
        const distH = Math.abs(idx - this.high);
        if (distL < distH || (distL === distH && idx < this.low)) {
          this.setLow(idx, true);
          this._dragging = this.els.thumbL; // begin drag
        } else {
          this.setHigh(idx, true);
          this._dragging = this.els.thumbH; // begin drag
        }
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      // Keyboard support
      const handleKey = (which, e) => {
        const step = (d) => {
          if (which === 'low') this.setLow(this.low + d, true);
          else this.setHigh(this.high + d, true);
        };
        if (e.key === 'ArrowRight') { e.preventDefault(); step(+1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        else if (e.key === 'Home') { e.preventDefault(); which==='low' ? this.setLow(0, true) : this.setHigh(0, true); }
        else if (e.key === 'End') { e.preventDefault(); const last=this.tiers.length-1; which==='low' ? this.setLow(last, true) : this.setHigh(last, true); }
      };
      this.els.thumbL.addEventListener('keydown', (e)=>handleKey('low', e));
      this.els.thumbH.addEventListener('keydown', (e)=>handleKey('high', e));

      // Initial paint
      this._paint();
      // Helper to update ARIA each paint
      this._setAria = () => {
        setAriaBounds(this.els.thumbL, this.low, 0, this.high, this.tiers[this.low]);
        setAriaBounds(this.els.thumbH, this.high, this.low, this.tiers.length-1, this.tiers[this.high]);
      };
      this._setAria();
    }

    _i2pct(i) {
      const n = this.tiers.length;
      return n<=1 ? 0 : (i/(n-1))*100;
    }
    _idxFromPointer(e) {
      const rect = this.els.track.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const clamped = Math.min(1, Math.max(0, pct));
      return Math.round(clamped * (this.tiers.length - 1));
    }
    _updateFromPointer(e, which) {
      const idx = this._idxFromPointer(e);
      if (which === 'low') this.setLow(idx); else this.setHigh(idx);
      this._fireLive(); // live updates while dragging
    }

    setLow(i, fire=false) {
      const n = this.tiers.length;
      const clamped = Math.max(0, Math.min(i, this.high)); // cannot pass high
      if (clamped !== this.low) {
        this.low = clamped;
        this._paint();
        this._setAria();
        if (fire) this._fire();
      } else {
        this._paint(); // keep UI in sync
      }
    }
    setHigh(i, fire=false) {
      const n = this.tiers.length;
      const clamped = Math.min(n-1, Math.max(i, this.low)); // cannot pass low
      if (clamped !== this.high) {
        this.high = clamped;
        this._paint();
        this._setAria();
        if (fire) this._fire();
      } else {
        this._paint();
      }
    }
    setRange(low, high, fire=false) {
      const n = this.tiers.length;
      const L = Math.min(Math.max(0, low), n-1);
      const H = Math.min(Math.max(0, high), n-1);
      this.low = Math.min(L,H);
      this.high = Math.max(L,H);
      this._paint();
      this._setAria();
      if (fire) this._fire();
    }
    value() {
      return {
        lowIndex: this.low,
        highIndex: this.high,
        lowLabel: this.tiers[this.low],
        highLabel: this.tiers[this.high],
      };
    }
    _fire() {
      this.onChange(this.low, this.high, this.tiers[this.low], this.tiers[this.high]);
    }
    _paint() {
      const lp = this._i2pct(this.low);
      const hp = this._i2pct(this.high);
      this.els.thumbL.style.left = lp + '%';
      this.els.thumbH.style.left = hp + '%';
      this.els.fill.style.left = lp + '%';
      this.els.fill.style.width = (hp - lp) + '%';
      // Make the rightmost (active) thumb top-most when close/overlap
      if (hp >= lp) {
        this.els.thumbH.classList.add('active');
        this.els.thumbL.classList.remove('active');
      }
      this.els.current.textContent = `${this.tiers[this.low]} … ${this.tiers[this.high]}`;
      this.els.idxText.textContent = `${this.low+1}–${this.high+1}`;
    }
    _fireLive() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._fire();
      });
    }
  }
window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('tier-range');
  if (!root) {
    console.warn('#tier-range not found');
    loadAndFilter(); // still render table
    return;
  }

  const range = new TierRangeSlider(root, {
    tiers: ALL_TIERS,
    initialLow: 0,
    initialHigh: 24,
    onChange: () => {
      loadAndFilter(); // reload table on every drag/click
    }
  });

  window.tierRange = range;
  loadAndFilter(); // first render after slider exists
});

})();
