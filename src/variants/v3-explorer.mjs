// Variant 3: Interactive explorer. Left-to-right reporting tree + detail panel, search, company filter.
import { esc, page, toClientJson } from './shared.mjs';

export function buildExplorer(org) {
  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Interactive Explorer · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">体制エクスプローラー</span></h1>
      <p class="sub">人物をクリックすると、指揮系統（上長〜部下）がハイライトされ、右側に詳細が表示されます</p>
    </div>
    <div class="tools"><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="controls">
    <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="名前・役割・会社・チームで検索" autocomplete="off"></label>
    <div class="filters" id="filters"></div>
  </div>
  <div class="layout">
    <div class="stage" id="stage"><div class="fit" id="fit"><div class="canvas" id="canvas"><svg id="links" aria-hidden="true"></svg></div></div></div>
    <aside class="panel" id="panel" aria-live="polite"></aside>
  </div>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.search{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line-strong);border-radius:10px;padding:0 12px;flex:0 1 340px;min-width:220px}
.search span{color:var(--ink-3);font-size:16px}
.search input{font:inherit;border:0;outline:0;background:transparent;color:var(--ink);padding:9px 0;width:100%}
.filters{display:flex;flex-wrap:wrap;gap:6px}
.fchip{font:inherit;font-size:12px;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);border-radius:999px;padding:5px 11px;cursor:pointer}
.fchip::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--c)}
.fchip[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 296px;gap:14px;align-items:start}
.stage{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);overflow:auto}
.fit{position:relative;margin:20px 16px;overflow:clip}
.canvas{position:absolute;left:0;top:0;transform-origin:0 0}
#links{position:absolute;inset:0;overflow:visible}
#links path{fill:none;stroke:var(--line-strong);stroke-width:1.5;transition:stroke .15s,opacity .15s}
#links path.on{stroke:var(--ink);stroke-width:2.2}
.node{position:absolute;display:flex;gap:10px;align-items:center;width:196px;height:64px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);
  background:var(--surface);cursor:pointer;text-align:left;font:inherit;color:inherit;transition:opacity .15s,box-shadow .15s,transform .15s}
.node::after{content:"";position:absolute;left:-1px;top:10px;bottom:10px;width:4px;border-radius:0 3px 3px 0;background:var(--c)}
.node:hover{box-shadow:var(--shadow);transform:translateY(-1px)}
.node:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.node .av{width:40px;height:40px}
.node .m{min-width:0;flex:1}
.node .nm{font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node .rl{font-size:11.5px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node .dp{font-size:10px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node .dual{font-size:9.5px;font-weight:700;background:var(--ink);color:var(--surface);border-radius:4px;padding:1px 4px;margin-left:4px;vertical-align:1px}
.dim .node{opacity:.25}
.dim .node.on{opacity:1}
.dim #links path{opacity:.35}
.dim #links path.on{opacity:1}
.node.sel{box-shadow:0 0 0 2px var(--ink);opacity:1!important}
.node.match{box-shadow:0 0 0 2px var(--c)}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:18px;position:sticky;top:16px}
.panel h2{font-size:12px;letter-spacing:.1em;color:var(--ink-3);margin:16px 0 6px;font-weight:700}
.panel h2:first-child{margin-top:0}
.phead{display:flex;gap:14px;align-items:center}
.phead .av{width:64px;height:64px}
.pn{font-size:19px;font-weight:700;line-height:1.3}
.pc{font-size:12px;color:var(--ink-2);margin-top:2px}
.asg{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.asg li{background:var(--surface-2);border-radius:8px;padding:7px 10px;font-size:12.5px}
.asg b{display:block;font-size:13px}
.plist{display:flex;flex-direction:column;gap:4px}
.plink{font:inherit;display:flex;align-items:center;gap:8px;background:none;border:0;color:var(--ink);padding:4px 6px;margin:0 -6px;border-radius:8px;cursor:pointer;text-align:left;font-size:13px}
.plink:hover{background:var(--surface-2)}
.plink .av{width:26px;height:26px;box-shadow:0 0 0 2px var(--surface),0 0 0 3px var(--c)}
.plink small{color:var(--ink-3);font-size:11px}
.roles{margin:0;padding-left:16px;font-size:12.5px;color:var(--ink-2);line-height:1.7}
.none{font-size:12.5px;color:var(--ink-3)}
.stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.stat div{background:var(--surface-2);border-radius:10px;padding:8px 10px}
.stat b{display:block;font-size:22px;line-height:1.1}
.stat span{font-size:11px;color:var(--ink-2)}
.cobar{display:flex;flex-direction:column;gap:6px}
.cobar .row{display:grid;grid-template-columns:110px 1fr 28px;gap:8px;align-items:center;font-size:12px}
.cobar .bar{height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden}
.cobar .bar i{display:block;height:100%;background:var(--c);border-radius:4px}
.cobar .row span:last-child{text-align:right;color:var(--ink-2);font-variant-numeric:tabular-nums}
.help{font-size:12px;color:var(--ink-2);line-height:1.7;margin:0;padding-left:16px}
.clear{margin-top:14px;width:100%}
@media (max-width:980px){.layout{grid-template-columns:1fr}.panel{position:static}}
`;

  const js = `
(function(){
  var D=${toClientJson(org)};
  var P=D.people, W=196, H=64, XS=222, YS=84;
  var canvas=document.getElementById('canvas'), svg=document.getElementById('links'), panel=document.getElementById('panel');
  function co(p){return D.companies.find(function(c){return c.id===p.companyId;});}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function unitName(a){return a.unit===D.pmTitle?'PM':a.deptIndex<0?'オーナー':a.unit;}

  // Tidy left-to-right layout: leaves stack, parents center on children.
  var pos={}, row=0, maxD=0;
  (function lay(id,d){var p=P[id]; maxD=Math.max(maxD,d);
    if(!p.children.length){pos[id]={d:d,y:row++};return;}
    p.children.forEach(function(k){lay(k,d+1);});
    var ys=p.children.map(function(k){return pos[k].y;});
    pos[id]={d:d,y:(Math.min.apply(0,ys)+Math.max.apply(0,ys))/2};
  })(D.ownerId,0);
  var CW=maxD*XS+W, CH=(row-1)*YS+H, fitEl=document.getElementById('fit'), stage=document.getElementById('stage');
  canvas.style.width=CW+'px'; canvas.style.height=CH+'px';
  // Scale the whole tree down to fit the stage (never below 0.62; scroll beyond that).
  function fit(){var s=Math.max(.62,Math.min(1,(stage.clientWidth-32)/CW));
    canvas.style.transform='scale('+s+')'; fitEl.style.width=(CW*s)+'px'; fitEl.style.height=(CH*s)+'px';}
  addEventListener('resize',fit); fit();

  var nodes={};
  Object.keys(pos).forEach(function(id){
    var p=P[id], c=co(p), a=p.primary, b=document.createElement('button');
    b.className='node'; b.dataset.id=id; b.style.setProperty('--c',c.color);
    b.style.left=(pos[id].d*XS)+'px'; b.style.top=(pos[id].y*YS)+'px';
    b.innerHTML='<img class="av" src="'+p.avatar+'" alt=""><span class="m"><span class="nm" style="display:block">'+esc(p.name)+(p.dual?'<span class="dual">兼務</span>':'')+'</span>'+
      '<span class="rl" style="display:block">'+esc(a.role)+'</span><span class="dp" style="display:block">'+esc(unitName(a))+(a.badge?' · '+esc(a.badge):'')+'</span></span>';
    b.addEventListener('click',function(e){e.stopPropagation();select(id);});
    canvas.appendChild(b); nodes[id]=b;
  });
  var links=[];
  Object.keys(pos).forEach(function(id){var p=P[id]; if(!p.parent||!pos[p.parent]) return;
    var a=pos[p.parent], b=pos[id], x1=a.d*XS+W, y1=a.y*YS+H/2, x2=b.d*XS, y2=b.y*YS+H/2, mx=(x1+x2)/2;
    var el=document.createElementNS('http://www.w3.org/2000/svg','path');
    el.setAttribute('d','M'+x1+','+y1+'C'+mx+','+y1+' '+mx+','+y2+' '+x2+','+y2);
    svg.appendChild(el); links.push({from:p.parent,to:id,el:el});
  });

  function ancestors(id){var out=[];var p=P[id];while(p&&p.parent){out.push(p.parent);p=P[p.parent];}return out;}
  function descendants(id){var out=[];(function w(i){P[i].children.forEach(function(k){out.push(k);w(k);});})(id);return out;}

  var selected=null, companyFilter=null;
  function apply(){
    var on=null;
    if(selected){on=new Set([selected].concat(ancestors(selected),descendants(selected)));}
    else if(companyFilter){on=new Set(Object.keys(P).filter(function(i){return P[i].companyId===companyFilter;}));}
    canvas.classList.toggle('dim',!!on);
    Object.keys(nodes).forEach(function(i){nodes[i].classList.toggle('on',!!on&&on.has(i));nodes[i].classList.toggle('sel',i===selected);});
    links.forEach(function(l){l.el.classList.toggle('on',!!selected&&on.has(l.from)&&on.has(l.to));});
    renderPanel();
  }
  function select(id){selected=(selected===id)?null:id;apply(); if(selected) nodes[selected].focus({preventScroll:true});}
  canvas.addEventListener('click',function(){if(selected){selected=null;apply();}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){selected=null;apply();}});

  function plink(id,extra){var p=P[id],c=co(p);return '<button class="plink" data-go="'+id+'" style="--c:'+c.color+'"><img class="av" src="'+p.avatar+'" alt=""><span>'+esc(p.name)+' <small>'+esc(extra||p.primary.role)+'</small></span></button>';}
  function renderPanel(){
    if(!selected){
      var total=Object.keys(P).length;
      panel.innerHTML='<h2>概要</h2><div class="stat"><div><b>'+D.companies.length+'</b><span>参画企業</span></div><div><b>'+total+'</b><span>メンバー</span></div><div><b>'+D.depts.length+'</b><span>チーム</span></div></div>'+
        '<h2>企業別の人数</h2><div class="cobar">'+D.companies.map(function(c){return '<div class="row" style="--c:'+c.color+'"><span>'+esc(c.short)+'</span><span class="bar"><i style="width:'+(c.count/total*100)+'%"></i></span><span>'+c.count+'</span></div>';}).join('')+'</div>'+
        '<h2>使い方</h2><ul class="help"><li>人物をクリック → 指揮系統をハイライト</li><li>上部のチップ → 会社で絞り込み</li><li>検索 → Enterで最初の該当者を選択</li><li>Esc → 選択解除</li></ul>';
      return;
    }
    var p=P[selected], c=co(p), boss=p.parent?P[p.parent]:null;
    var deptRoles=p.assignments.filter(function(a){return a.deptIndex>=0;}).map(function(a){var d=D.depts[a.deptIndex];
      return '<h2>'+esc(d.name)+' の担当業務</h2><ul class="roles">'+d.roles.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ul>';}).join('');
    panel.innerHTML='<div class="phead" style="--c:'+c.color+'"><img class="av" src="'+p.avatar+'" alt=""><div><div class="pn">'+esc(p.name)+'</div><div class="pc"><span class="cochip" style="--c:'+c.color+'">'+esc(c.name)+'</span><br>'+esc(c.tag)+'</div></div></div>'+
      '<h2>役割'+(p.dual?'（兼務）':'')+'</h2><ul class="asg">'+p.assignments.map(function(a){return '<li><b>'+esc(a.unit)+(a.badge?'　<span class="tag">'+esc(a.badge)+'</span>':'')+'</b>'+esc(a.role)+'</li>';}).join('')+'</ul>'+
      '<h2>レポート先</h2>'+(boss?'<div class="plist">'+plink(boss.id)+'</div>':'<div class="none">最上位（意思決定者）</div>')+
      '<h2>直属メンバー（'+p.children.length+'）</h2>'+(p.children.length?'<div class="plist">'+p.children.map(function(k){return plink(k);}).join('')+'</div>':'<div class="none">なし</div>')+
      deptRoles+'<button class="btn clear" data-clear>選択を解除</button>';
  }
  panel.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g){selected=null;select(g.dataset.go);return;}
    if(e.target.closest('[data-clear]')){selected=null;apply();}});

  // company filters
  var filters=document.getElementById('filters');
  filters.innerHTML=D.companies.map(function(c){return '<button class="fchip" aria-pressed="false" data-co="'+c.id+'" style="--c:'+c.color+'">'+esc(c.short)+' '+c.count+'</button>';}).join('');
  filters.addEventListener('click',function(e){var b=e.target.closest('[data-co]');if(!b)return;
    companyFilter=companyFilter===b.dataset.co?null:b.dataset.co; selected=null;
    filters.querySelectorAll('.fchip').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.co===companyFilter));});apply();});

  // search
  var q=document.getElementById('q');
  function hay(p){var c=co(p);return [p.name,c.short,c.name,c.tag].concat(p.assignments.map(function(a){return a.unit+' '+a.role+' '+a.badge;})).join(' ').toLowerCase();}
  function matches(){var v=q.value.trim().toLowerCase();return v?Object.keys(P).filter(function(i){return hay(P[i]).indexOf(v)>=0;}):[];}
  q.addEventListener('input',function(){var m=new Set(matches());Object.keys(nodes).forEach(function(i){nodes[i].classList.toggle('match',m.has(i));});});
  q.addEventListener('keydown',function(e){if(e.key==='Enter'){var m=matches();if(m.length){selected=null;select(m[0]);}}});

  apply();
})();`;

  return page({
    title: '体制エクスプローラー',
    description: 'クリックで指揮系統をたどれる、検索・会社フィルタ付きのインタラクティブ体制図。',
    css,
    body,
    js,
  });
}
