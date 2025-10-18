(async function(){
  const $=s=>document.querySelector(s);
  const selSys=$("#selSystem"), selCat=$("#selCategory"), selEqp=$("#selEquipment");
  const showBtn=$("#showBtn"), results=$("#results"), count=$("#count"), meta=$("#meta");
  const loader=document.querySelector('.loader');

  // Load data
  let DATA=[];
  try{
    const r=await fetch('assets/data.json?_='+Date.now());
    DATA = await r.json();
  }catch(e){ console.error('load data failed', e); }

  // Hide loader after a short delay (visible on ctrl+F5)
  meta.textContent=(DATA?.length||0)+' rows';
  setTimeout(()=>loader.classList.add('hidden'), 300);

  const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y,'en'));
  const esc=s=>String(s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function fill(sel,vals,all){ const prev=sel.value; sel.innerHTML='';
    const mk=(v,l)=>{ const o=document.createElement('option'); o.value=v; o.textContent=v||l; return o; };
    sel.appendChild(mk('',all)); vals.forEach(v=>sel.appendChild(mk(v,all)));
    sel.value=vals.includes(prev)?prev:'';
  }

  function buildSystem(){ fill(selSys,uniq(DATA.map(d=>d.System)),'All systems'); selSys.disabled=false; changeSystem(); }
  function changeSystem(){
    const sys=selSys.value;
    const subset=sys?DATA.filter(d=>d.System===sys):DATA;
    fill(selCat,uniq(subset.map(d=>d.Category)),'All categories'); selCat.disabled=false; changeCategory();
  }
  function changeCategory(){
    const sys=selSys.value, cat=selCat.value;
    let subset=DATA.slice(); if(sys) subset=subset.filter(d=>d.System===sys); if(cat) subset=subset.filter(d=>d.Category===cat);
    fill(selEqp,uniq(subset.map(d=>d.Equipment)),'All equipment'); selEqp.disabled=false;
    showBtn.disabled=!(selSys.value||selCat.value||selEqp.value);
  }

  // ---------- Smart split helpers ----------
  const ipv4Re = /\b(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?:25[0-5]|2[0-4]\d|1?\d{1,2})){3}\b/g;

  function splitIPs(s){
    if(!s) return [];
    const ips = (s.match(ipv4Re)||[]);
    if(ips.length>1) return ips;
    const parts = String(s).split(/[,;&]+/).map(x=>x.trim()).filter(Boolean);
    const valid = parts.filter(p=>ipv4Re.test(p));
    return ips.length?ips:valid.length?valid:parts.length?parts:[s];
  }

  function splitNumbered(s){
    s = String(s||'').replace(/\r/g,'').trim();
    if(!s) return [];
    const lines=[];
    const mFirst = s.match(/\b1\)\s*/);
    if(mFirst){
      const prefix = s.slice(0, mFirst.index).trim();
      if(prefix) lines.push(prefix);
      const regex = /(\d+\))\s*([^]+?)(?=(?:\s*\d+\))|$)/g;
      let m; while((m=regex.exec(s))){ lines.push((m[1]+' '+m[2]).trim()); }
      return lines;
    }
    if(/\s{2,}/.test(s)) return s.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
    if(s.includes(' & ')) return s.split(/\s*&\s*/).map(x=>x.trim()).filter(Boolean);
    const commaParts = s.split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
    if (commaParts.length>1) return commaParts;
    return [s];
  }

  // Insert marker before any "<label>:" token. Covers things like:
  // "T1 line New NMS Server:", "SP line AS1:", "CCR SPL AS1:", "Name:", "FTP server:", etc.
  const labelRe = /(?:^|\s)((?:[A-Za-z0-9#&/]+(?:\s+[A-Za-z0-9#&/]+){0,6})\s*:)/g;
  function splitLabeled(s){
    if(!s) return [];
    s = String(s).replace(/\r/g,'').trim();
    if(!s) return [];
    let marked = s.replace(labelRe, (m, g1)=> '|' + g1);
    let parts = marked.split('|').map(x=>x.trim()).filter(Boolean);
    if(parts.length<=1){
      return splitNumbered(s);
    }
    return parts;
  }

  function splitRemark(s){
    const labeled = splitLabeled(s);
    if(labeled.length>1) return labeled;
    return splitNumbered(s);
  }

  function getFiltered(){
    const sys=selSys.value, cat=selCat.value, eqp=selEqp.value;
    let s=DATA.slice();
    if(sys) s=s.filter(d=>d.System===sys);
    if(cat) s=s.filter(d=>d.Category===cat);
    if(eqp) s=s.filter(d=>d.Equipment===eqp);
    return s.filter(d=>(d['Login ID']||d['Password']||d['IP']||d['Remark']||d['Category']||d['Equipment']));
  }

  function render(){
    const rows=getFiltered();
    results.innerHTML='';
    if(!rows.length){ results.classList.add('hidden'); count.classList.add('hidden'); return; }
    results.classList.remove('hidden'); count.classList.remove('hidden');
    count.textContent=rows.length+' result'+(rows.length>1?'s':'');
    rows.forEach(r=>{
      const card=document.createElement('div'); card.className='card';
      const title=document.createElement('div'); title.className='title';
      const pill=document.createElement('span'); pill.className='badge'; pill.textContent=r.System||'—';
      const label=document.createElement('div'); label.innerHTML=`<b>${esc(r.Category||'Uncategorized')}</b> · ${esc(r.Equipment||'Unnamed')}`;
      title.appendChild(pill); title.appendChild(label); card.appendChild(title);

      const kv=document.createElement('div'); kv.className='kvs';
      const add=(k,v,kind)=>{ v=String(v||'').trim(); if(!v||v.toLowerCase()==='nan')return;
        let parts=[v];
        if(kind==='ip') parts=splitIPs(v);
        else if(kind==='login' || kind==='password') parts=splitNumbered(v);
        else if(kind==='remark') parts=splitRemark(v);
        const K=document.createElement('div'); K.className='k'; K.textContent=k;
        const V=document.createElement('div');
        V.innerHTML=parts.map(p=>`<div class="vline">${esc(p).replace(ipv4Re, m=>'<code>'+m+'</code>')}</div>`).join('');
        kv.appendChild(K); kv.appendChild(V);
      };
      add('Login ID', r['Login ID'], 'login');
      add('Password', r['Password'], 'password');
      add('IP', r['IP'], 'ip');
      add('Remark', r['Remark'], 'remark');

      card.appendChild(kv);
      results.appendChild(card);
    });
  }

  selSys.addEventListener('change',()=>{ changeSystem(); results.classList.add('hidden'); count.classList.add('hidden'); showBtn.disabled=!(selSys.value||selCat.value||selEqp.value); });
  selCat.addEventListener('change',()=>{ changeCategory(); results.classList.add('hidden'); count.classList.add('hidden'); showBtn.disabled=!(selSys.value||selCat.value||selEqp.value); });
  selEqp.addEventListener('change',()=>{ showBtn.disabled=!(selSys.value||selCat.value||selEqp.value); });
  showBtn.addEventListener('click',render);
  document.addEventListener('click',e=>{ if(e.target && e.target.id==='clearBtn'){ selSys.value=''; changeSystem(); selCat.value=''; changeCategory(); selEqp.value=''; results.classList.add('hidden'); count.classList.add('hidden'); showBtn.disabled=true; } });

  buildSystem();
})();