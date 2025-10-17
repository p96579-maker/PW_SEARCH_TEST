(async function(){
  const $ = (s)=>document.querySelector(s);
  const selSys = $("#selSystem");
  const selCat = $("#selCategory");
  const selEqp = $("#selEquipment");
  const showBtn = $("#showBtn");
  const clearBtn = $("#clearBtn");
  const results = $("#results");
  const count = $("#count");
  const meta = $("#meta");

  let DATA = [];
  try{
    const r = await fetch('assets/data.json?_='+Date.now());
    DATA = await r.json();
  }catch(e){
    console.error('Load data.json failed', e);
  }
  meta.textContent = (DATA?.length||0) + ' rows';

  const uniq = arr => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'en'));

  function fill(sel, values, allLabel){
    const prev = sel.value;
    sel.innerHTML = '';
    const mk = (v, label)=> {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || label;
      return opt;
    };
    sel.appendChild(mk('', allLabel));
    values.forEach(v => sel.appendChild(mk(v, allLabel)));
    sel.value = values.includes(prev) ? prev : '';
  }

  function buildSystem(){
    fill(selSys, uniq(DATA.map(d=>d.System)), 'All systems');
    selSys.disabled = false;
    changeSystem();
  }
  function changeSystem(){
    const sys = selSys.value;
    const subset = sys ? DATA.filter(d=>d.System===sys) : DATA;
    fill(selCat, uniq(subset.map(d=>d.Category)), 'All categories');
    selCat.disabled = false;
    changeCategory();
  }
  function changeCategory(){
    const sys = selSys.value;
    const cat = selCat.value;
    let subset = DATA.slice();
    if (sys) subset = subset.filter(d=>d.System===sys);
    if (cat) subset = subset.filter(d=>d.Category===cat);
    fill(selEqp, uniq(subset.map(d=>d.Equipment)), 'All equipment');
    selEqp.disabled = false;
    showBtn.disabled = !(selSys.value || selCat.value || selEqp.value);
  }
  function getFiltered(){
    const sys = selSys.value;
    const cat = selCat.value;
    const eqp = selEqp.value;
    let subset = DATA.slice();
    if (sys) subset = subset.filter(d=>d.System===sys);
    if (cat) subset = subset.filter(d=>d.Category===cat);
    if (eqp) subset = subset.filter(d=>d.Equipment===eqp);
    subset = subset.filter(d => (d['Login ID']||d['Password']||d['IP']||d['Remark']||d['Category']||d['Equipment']));
    return subset;
  }
  function render(){
    const rows = getFiltered();
    results.innerHTML = '';
    if (!rows.length){
      results.classList.add('hidden');
      count.classList.add('hidden');
      return;
    }
    results.classList.remove('hidden');
    count.classList.remove('hidden');
    count.textContent = rows.length + ' result' + (rows.length>1?'s':'');
    const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    for (const r of rows){
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('div');
      title.className = 'title';
      const pill = document.createElement('span'); pill.className = 'badge'; pill.textContent = r.System || '—';
      const label = document.createElement('div'); label.innerHTML = `<b>${esc(r.Category||'Uncategorized')}</b> · ${esc(r.Equipment||'Unnamed')}`;
      title.appendChild(pill); title.appendChild(label);

      const kv = document.createElement('div'); kv.className='kvs';
      const add = (k,v)=>{ v=String(v||'').trim(); if(!v || v.toLowerCase()==='nan') return;
        const K=document.createElement('div'); K.className='k'; K.textContent=k;
        const V=document.createElement('div'); V.textContent=v;
        kv.appendChild(K); kv.appendChild(V);
      };
      add('Login ID', r['Login ID']);
      add('Password', r['Password']);
      add('IP', r['IP']);
      add('Remark', r['Remark']);

      card.appendChild(title); card.appendChild(kv);
      results.appendChild(card);
    }
  }

  selSys.addEventListener('change', ()=>{ changeSystem(); results.classList.add('hidden'); count.classList.add('hidden'); showBtn.disabled = !(selSys.value || selCat.value || selEqp.value); });
  selCat.addEventListener('change', ()=>{ changeCategory(); results.classList.add('hidden'); count.classList.add('hidden'); showBtn.disabled = !(selSys.value || selCat.value || selEqp.value); });
  selEqp.addEventListener('change', ()=>{ showBtn.disabled = !(selSys.value || selCat.value || selEqp.value); });
  showBtn.addEventListener('click', render);
  document.getElementById('clearBtn').addEventListener('click', ()=>{
    selSys.value=''; changeSystem();
    selCat.value=''; changeCategory();
    selEqp.value='';
    results.classList.add('hidden'); count.classList.add('hidden');
    showBtn.disabled = true;
  });

  buildSystem();
})();