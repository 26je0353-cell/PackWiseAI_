const materials = [
 {name:"LDPE Film", tag:"Flexible plastic", moisture:7, oxygen:3, light:2, cold:8, cost:9, eco:3, note:"cheap, flexible, weak O2 barrier", group:"low-cost"},
 {name:"HDPE", tag:"Rigid plastic", moisture:8, oxygen:4, light:3, cold:7, cost:8, eco:4, note:"good moisture barrier, rigid containers", group:"low-cost"},
 {name:"Polypropylene (PP)", tag:"Rigid/flexible plastic", moisture:8, oxygen:4, light:3, cold:6, cost:7, eco:4, note:"heat resistant, microwave-safe", group:"low-cost"},
 {name:"PET", tag:"Clear plastic", moisture:7, oxygen:6, light:2, cold:8, cost:6, eco:5, note:"clear, decent barrier, common for beverages", group:"low-cost"},
 {name:"EVOH Multilayer", tag:"High-barrier film", moisture:6, oxygen:10, light:4, cold:7, cost:4, eco:3, note:"excellent oxygen barrier, used with MAP", group:"high-barrier"},
 {name:"Aluminium Foil Laminate", tag:"Metallized barrier", moisture:10, oxygen:10, light:10, cold:9, cost:3, eco:2, note:"total barrier, opaque, not biodegradable", group:"high-barrier"},
 {name:"Biodegradable PLA", tag:"Compostable bioplastic", moisture:5, oxygen:3, light:2, cold:4, cost:5, eco:10, note:"compostable, moderate barrier, short shelf life", group:"eco"},
 {name:"Active Packaging (O2 scavenger)", tag:"Functional film", moisture:6, oxygen:9, light:3, cold:6, cost:3, eco:4, note:"actively removes residual oxygen", group:"high-barrier"},
 {name:"MAP (Modified Atmosphere)", tag:"Gas-flush system", moisture:7, oxygen:9, light:3, cold:8, cost:4, eco:4, note:"gas mix extends shelf life of fresh items", group:"high-barrier"},
 {name:"Coated Kraft Paper", tag:"Paper-based", moisture:4, oxygen:2, light:5, cold:3, cost:8, eco:9, note:"eco-friendly, best for dry ambient goods", group:"eco"},
 {name:"Glass Jar", tag:"Rigid, inert", moisture:10, oxygen:9, light:2, cold:6, cost:5, eco:7, note:"inert, reusable, heavy and fragile", group:"eco"},
 {name:"Vacuum Skin Pack", tag:"Tight-seal film", moisture:9, oxygen:8, light:3, cold:8, cost:5, eco:3, note:"removes air, good for meat/seafood", group:"high-barrier"},
 {name:"Retort Pouch", tag:"Sterilizable laminate", moisture:9, oxygen:8, light:8, cold:5, cost:4, eco:2, note:"withstands sterilization, ready-to-eat meals", group:"high-barrier"},
];

const categoryDefaults = {
 dairy:{coldNeed:9}, meat:{coldNeed:9}, produce:{coldNeed:6}, bakery:{coldNeed:3},
 dry:{coldNeed:2}, beverage:{coldNeed:5}, frozen:{coldNeed:10}
};

/* Theme toggle */
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
function applyTheme(t){ root.setAttribute('data-theme', t); themeBtn.textContent = t==='dark' ? '☀️' : '🌙'; localStorage.setItem('packwise-theme', t); }
applyTheme(localStorage.getItem('packwise-theme') || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
themeBtn.addEventListener('click', ()=> applyTheme(root.getAttribute('data-theme')==='dark' ? 'light' : 'dark'));

/* Mobile nav */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', ()=> navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> navLinks.classList.remove('open')));

/* Range live labels */
const shelfEl=document.getElementById('shelf'), shelfOut=document.getElementById('shelfOut');
shelfEl.oninput=()=>shelfOut.textContent=shelfEl.value+" days";
const ecoEl=document.getElementById('eco'), ecoOut=document.getElementById('ecoOut');
ecoEl.oninput=()=>{const v=+ecoEl.value; ecoOut.textContent = v<35?"Cost-first":v>65?"Sustainability-first":"Balanced";};

/* Material library render + filter chips */
function libCard(m){
  return `<div class="lib-card" data-group="${m.group}"><h4>${m.name}</h4><div class="tag" style="display:inline-block;margin-bottom:6px;">${m.tag}</div><p>${m.note}</p></div>`;
}
document.getElementById('libGrid').innerHTML = materials.map(libCard).join('');
document.querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const g = chip.dataset.filter;
    document.querySelectorAll('.lib-card').forEach(card=>{
      card.classList.toggle('hidden', g!=='all' && card.dataset.group!==g);
    });
  });
});

function bar(label,val){
  return `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" data-target="${val*10}"></div></div><span>${val}/10</span></div>`;
}

function animateCount(el, to){
  let cur = 0; const step = Math.max(1, Math.round(to/24));
  const t = setInterval(()=>{ cur += step; if(cur>=to){cur=to; clearInterval(t);} el.textContent = cur+'/100'; }, 16);
}

document.getElementById('form').addEventListener('submit', e=>{
  e.preventDefault();
  const cat = document.getElementById('category').value;
  const moisture = +document.getElementById('moisture').value;
  const oxygen = +document.getElementById('oxygen').value;
  const light = +document.getElementById('light').value;
  const temp = document.getElementById('temp').value;
  const shelf = +shelfEl.value;
  const eco = +ecoEl.value/100;

  const coldNeed = temp==='frozen'?10:temp==='chilled'?7:categoryDefaults[cat].coldNeed*0.5;
  const shelfWeight = Math.min(1, shelf/60);

  const scored = materials.map(m=>{
    let s = 0, reasons=[];
    s += moisture*m.moisture; s += oxygen*m.oxygen; s += light*m.light;
    s += (coldNeed/10)*m.cold*4;
    s += shelfWeight*((m.oxygen+m.moisture)/2)*3;
    s += eco*m.eco*5 + (1-eco)*m.cost*3;
    if(m.oxygen>=8 && oxygen>=0.6) reasons.push("strong oxygen barrier for an oxygen-sensitive item");
    if(m.moisture>=8 && moisture>=0.6) reasons.push("high moisture resistance matches the commodity's needs");
    if(m.cold>=8 && coldNeed>=7) reasons.push("performs well at the required storage temperature");
    if(m.eco>=7 && eco>=0.5) reasons.push("aligns with the stated sustainability priority");
    if(m.cost>=7 && eco<0.4) reasons.push("cost-efficient, matching the cost-first priority");
    if(shelf>=30 && (m.oxygen+m.moisture)>=16) reasons.push("barrier profile suits a longer target shelf life");
    return {m, s, reasons};
  }).sort((a,b)=>b.s-a.s);

  const max = scored[0].s;
  const top3 = scored.slice(0,3);
  const html = top3.map((r,i)=>{
    const pct = Math.round((r.s/max)*100);
    const reasonText = r.reasons.length? r.reasons.slice(0,3).join('; ')+'.' : 'Balanced fit across the stated requirements.';
    return `<div class="result-card ${i===0?'top':''}" style="animation-delay:${i*0.12}s">
      <div class="rc-head"><h3>${i+1}. ${r.m.name}</h3><span class="score data" data-score="${pct}">0/100</span></div>
      <div class="rc-tags"><span class="tag">${r.m.tag}</span>${i===0?'<span class="tag best">Best match</span>':''}</div>
      <div class="bars">
        ${bar('Moisture',r.m.moisture)}
        ${bar('Oxygen',r.m.oxygen)}
        ${bar('Light',r.m.light)}
        ${bar('Cold range',r.m.cold)}
        ${bar('Sustain.',r.m.eco)}
      </div>
      <button class="why-toggle" type="button">Why this match? ▾</button>
      <div class="why">${reasonText}</div>
    </div>`;
  }).join('');
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = html;

  // animate bars + score counters after paint
  requestAnimationFrame(()=>{
    resultsEl.querySelectorAll('.bar-fill').forEach(b=> b.style.width = b.dataset.target+'%');
    resultsEl.querySelectorAll('.score').forEach(s=> animateCount(s, +s.dataset.score));
  });
  // why toggles
  resultsEl.querySelectorAll('.why-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const why = btn.nextElementSibling;
      why.classList.toggle('open');
      btn.textContent = why.classList.contains('open') ? 'Why this match? ▴' : 'Why this match? ▾';
    });
  });
  resultsEl.scrollIntoView({behavior:'smooth', block:'nearest'});
});