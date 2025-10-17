(function(){
  const els = {
    system: document.getElementById('system'),
    category: document.getElementById('category'),
    equipment: document.getElementById('equipment'),
    grid: document.getElementById('grid'),
    count: document.getElementById('count'),
    empty: document.getElementById('empty'),
    reset: document.getElementById('reset'),
  };

  let DATA = [];
  let filters = { system: '', category: '', equipment: '' };

  function uniq(arr) { return [...new Set(arr.filter(Boolean))].sort(); }
  function opt(text, value){ const o=document.createElement('option'); o.textContent=text; o.value=value; return o; }
  function clearChildren(node){ while(node.firstChild) node.removeChild(node.firstChild); }

  function populateSystems() {
    const systems = uniq(DATA.map(x => x['System']));
    clearChildren(els.system);
    els.system.append(opt('— All Systems —',''));
    systems.forEach(s => els.system.append(opt(s, s)));
  }

  function populateCategories() {
    const subset = filters.system ? DATA.filter(x => x['System']===filters.system) : DATA;
    const categories = uniq(subset.map(x => x['Category']));
    clearChildren(els.category);
    els.category.append(opt('— All Categories —',''));
    categories.forEach(c => els.category.append(opt(c, c)));
  }

  function populateEquipment() {
    let subset = DATA;
    if (filters.system) subset = subset.filter(x => x['System']===filters.system);
    if (filters.category) subset = subset.filter(x => x['Category']===filters.category);
    const equips = uniq(subset.map(x => x['Equipment']));
    clearChildren(els.equipment);
    els.equipment.append(opt('— All Equipment —',''));
    equips.forEach(e => els.equipment.append(opt(e, e)));
  }

  function render() {
    let subset = DATA;
    if (filters.system) subset = subset.filter(x => x['System']===filters.system);
    if (filters.category) subset = subset.filter(x => x['Category']===filters.category);
    if (filters.equipment) subset = subset.filter(x => x['Equipment']===filters.equipment);

    clearChildren(els.grid);
    const n = subset.length;
    els.count.textContent = n + (n===1 ? ' result' : ' results');
    els.empty.style.display = n ? 'none' : 'block';

    subset.forEach(row => {
      const card = document.createElement('div');
      card.className = 'card';

      function rowEl(key, val) {
        const R = document.createElement('div'); R.className = 'row';
        const K = document.createElement('div'); K.className = 'key'; K.textContent = key;
        const V = document.createElement('div'); V.className = 'val'; V.textContent = val || '';
        R.append(K, V);
        return R;
      }

      card.append(rowEl('Category', row['Category'] || ''));
      card.append(rowEl('Equipment', row['Equipment'] || ''));
      if (row['Login ID']) card.append(rowEl('Login ID', row['Login ID']));
      if (row['Password']) card.append(rowEl('Password', row['Password']));
      if (row['IP']) card.append(rowEl('IP', row['IP']));
      if (row['Remark']) card.append(rowEl('Remark', row['Remark']));

      const chips = document.createElement('div'); chips.className = 'chips';
      const chipSys = document.createElement('span'); chipSys.className='chip'; chipSys.textContent = row['System'] || '—';
      chips.append(chipSys);
      card.append(chips);

      els.grid.append(card);
    });
  }

  function onChange() {
    filters.system = els.system.value;
    filters.category = els.category.value;
    filters.equipment = els.equipment.value;
    populateCategories();
    populateEquipment();
    // preserve current chosen if still present
    if (![...els.category.options].some(o => o.value===filters.category)) {
      els.category.value=''; filters.category='';
    } else {
      els.category.value=filters.category;
    }
    if (![...els.equipment.options].some(o => o.value===filters.equipment)) {
      els.equipment.value=''; filters.equipment='';
    } else {
      els.equipment.value=filters.equipment;
    }
    render();
  }

  function resetFilters(){
    filters = { system: '', category: '', equipment: '' };
    els.system.value=''; els.category.value=''; els.equipment.value='';
    populateCategories(); populateEquipment(); render();
  }

  fetch('data/data.json')
    .then(r => r.json())
    .then(d => { DATA = d; populateSystems(); populateCategories(); populateEquipment(); render(); });

  els.system.addEventListener('change', onChange);
  els.category.addEventListener('change', onChange);
  els.equipment.addEventListener('change', onChange);
  els.reset.addEventListener('click', resetFilters);
})();