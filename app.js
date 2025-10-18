(async function(){
  const $=s=>document.querySelector(s);
  const selSys=$("#selSystem"), selCat=$("#selCategory"), selEqp=$("#selEquipment");
  const showBtn=$("#showBtn"), results=$("#results"), count=$("#count"), meta=$("#meta");

  let DATA=[];
  try{ const r=await fetch('assets/data.json?_='+Date.now()); DATA=await r.json(); }catch(e){ console.error(e); }
  meta.textContent=(DATA?.length||0)+' rows';

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
    // fallback: split by comma/semicolon/& and trim if they look like IPs
    const parts = String(s).split(/[,;&]+/).map(x=>x.trim()).filter(Boolean);
    const valid = parts.filter(p=>ipv4Re.test(p) && (ipv4Re.lastIndex=0)===0); // reset not reliable; re-test
    return ips.length?ips:valid.length?valid:parts.length?parts:[s];
  }

  // Split numbered items like "1) item  2) item", or double-spaced, or ampersand-separated, or newline
  function splitList(s){
    if(!s) return [];
    s = String(s).replace(/\r/g,'').trim();
    // already newline-separated
    if(s.includes('\n')) return s.split('\n').map(x=>x.trim()).filter(Boolean);
    // number-bracket pattern
    const numbered = [];
    s.replace(/(?:^|\s)(\d+\)\s*[^]+?)(?=(?:\s*\d+\)\s*)|$)/g, (m, g1)=>{ numbered.push(g1.trim()); return m; });
    if(numbered.length>1) return numbered;
    // split by two or more spaces
    if(/\s{2,}/.test(s)){ return s.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean); }
    // split by " & "
    if(s.includes(' & ')){ return s.split(/\s*&\s*/).map(x=>x.trim()).filter(Boolean); }
    // split by comma if there are multiple segments with parentheses
    const commaParts = s.split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
    if(commaParts.length>1) return commaParts;
    return [s];
  }

  // Special split for Remark / NOTE: break by label tokens with colon
  const remarkLabels = [
    'Name','Cluster Name','Management IP','Managent IP','Password',
    'FTP server','FTP client','TX','RX','T1 line AS1','SP line Record Server'
  ];
  const remarkLabelRe = new RegExp('(?:^|\\s)(' + remarkLabels.map(l=>l.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|') + ')\\s*:', 'gi');
  function splitRemark(s){
    if(!s) return [];
    s = String(s).replace(/\r/g,'').trim();
    if(!s) return [];
    // If contains our labels multiple times, insert | markers before labels and split
    let marked = s.replace(remarkLabelRe, (m)=>'|'+m.trim());
    let parts = marked.split('|').map(x=>x.trim()).filter(Boolean);
    // Also split any remaining newlines or explicit " & "
    parts = parts.map(p=>{
      if(p.includes('\n')) return p.split('\n').map(x=>x.trim()).filter(Boolean);
      if(p.includes(' & ')) return p.split(/\s*&\s*/).map(x=>x.trim()).filter(Boolean);
      return [p];
    }).flat();
    return parts;
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
        else if(kind==='login' || kind==='password') parts=splitList(v);
        else if(kind==='remark') parts=splitRemark(v);
        const K=document.createElement('div'); K.className='k'; K.textContent=k;
        const V=document.createElement('div'); V.innerHTML=parts.map(p=>esc(p)).join('<br>');
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