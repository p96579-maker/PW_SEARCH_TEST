(async function(){
  const byId = (id)=>document.getElementById(id);
  const $system = byId('systemSelect');
  const $category = byId('categorySelect');
  const $equipment = byId('equipmentSelect');
  const $free = byId('freeText');
  const $clear = byId('clearBtn');
  const $results = byId('results');

  let data = [];
  try {
    const res = await fetch('data.json');
    data = await res.json();
  } catch (e) {
    console.error('Failed to load data.json', e);
  }

  // Helper: unique sorted list
  const uniq = arr => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-Hant-u-co-stroke'));

  // Build dependent options
  function rebuildFilters(){
    const systems = uniq(data.map(d=>d.System));
    fillSelect($system, ["", ...systems], "全部系統");

    // If a system is already selected (back button), keep it
    changeSystem();
  }

  function fillSelect(sel, values, allLabel){
    const current = sel.value;
    sel.innerHTML = '';
    const mk = (v, label)=> {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || allLabel;
      return opt;
    };
    values.forEach(v=> sel.appendChild(mk(v, allLabel)));
    sel.value = values.includes(current) ? current : '';
  }

  function changeSystem(){
    const sys = $system.value;
    const subset = sys ? data.filter(d=>d.System===sys) : data;
    const categories = uniq(subset.map(d=>d.Category));
    fillSelect($category, ["", ...categories], "全部分類");
    $category.disabled = false;

    changeCategory();
  }

  function changeCategory(){
    const sys = $system.value;
    const cat = $category.value;
    let subset = data;
    if (sys) subset = subset.filter(d=>d.System===sys);
    if (cat) subset = subset.filter(d=>d.Category===cat);
    const equips = uniq(subset.map(d=>d.Equipment));
    fillSelect($equipment, ["", ...equips], "全部設備");
    $equipment.disabled = false;

    render();
  }

  function render(){
    const sys = $system.value;
    const cat = $category.value;
    const eqp = $equipment.value;
    const q = ($free.value||'').trim().toLowerCase();

    let subset = data.slice();
    if (sys) subset = subset.filter(d=>d.System===sys);
    if (cat) subset = subset.filter(d=>d.Category===cat);
    if (eqp) subset = subset.filter(d=>d.Equipment===eqp);
    if (q){
      subset = subset.filter(d=>{
        return ['Login ID','Password','IP','Remark','Category','Equipment','System'].some(k=>{
          const v = (d[k]||'').toString().toLowerCase();
          return v.includes(q);
        });
      });
    }

    // Hide cards that have no meaningful fields
    subset = subset.filter(d=>{
      return (d['Login ID']||d['Password']||d['IP']||d['Remark']||d['Category']||d['Equipment']);
    });

    $results.innerHTML = '';
    if (!subset.length){
      const div = document.createElement('div');
      div.className = 'no-data';
      div.textContent = '沒有結果 / No results';
      $results.appendChild(div);
      return;
    }

    subset.forEach(d=>{
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('h3');
      title.innerHTML = `
        <span class="badge">${d.System||'—'}</span>
        ${escapeHtml(d.Category||'未分類')} · ${escapeHtml(d.Equipment||'未命名')}
      `;
      card.appendChild(title);

      const kv = document.createElement('div'); kv.className='kv';
      function row(k, v){
        if (!v || !String(v).trim()) return;
        const K = document.createElement('div'); K.className='k'; K.textContent = k;
        const V = document.createElement('div'); V.className='v'; V.textContent = v;
        kv.appendChild(K); kv.appendChild(V);
      }
      row('Login ID', d['Login ID']);
      row('Password', d['Password']);
      row('IP', d['IP']);
      row('Remark', d['Remark']);
      card.appendChild(kv);

      $results.appendChild(card);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // Events
  $system.addEventListener('change', changeSystem);
  $category.addEventListener('change', changeCategory);
  $equipment.addEventListener('change', render);
  $free.addEventListener('input', render);
  $clear.addEventListener('click', ()=>{
    $system.value = '';
    $category.value = '';
    $equipment.value = '';
    $free.value = '';
    changeSystem();
  });

  rebuildFilters();
})();