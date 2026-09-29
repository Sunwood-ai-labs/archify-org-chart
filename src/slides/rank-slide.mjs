// 16:9 slide editions of the rank-aligned grid (variant 06), in four corporate tastes.
// The slide is a fixed 1920x1080 canvas: it scales to fit the window for viewing and
// renders 1:1 at 1920x1080 for PNG export / 16:9 PDF printing.
import { esc, company } from '../variants/shared.mjs';
import { computeRanks } from '../variants/v6-rank-grid.mjs';

export const THEMES = [
  {
    id: 'a-navy',
    name: 'ネイビー・コーポレート',
    idea: 'タイトル帯・フッター・社外秘表記つきの、日本企業の標準的なスライド',
    card: 'photo',
    elbow: 8,
    vars: {
      '--bg': '#ffffff', '--ink': '#1b2433', '--ink-2': '#56627a', '--ink-3': '#8c97aa', '--line': '#dbe1ea', '--wire': '#8793a8',
      '--band': '#f4f6fa', '--card': '#ffffff', '--card-line': '#d3dae5', '--accent': '#15315b', '--head-bg': '#15315b', '--head-ink': '#ffffff',
      '--tag-bg': '#15315b', '--tag-ink': '#ffffff', '--radius': '8px',
    },
    css: `
.hd{border-bottom:3px solid var(--accent);padding:0 0 16px 34px}
.hd::before{content:"";position:absolute;left:0;top:4px;bottom:16px;width:12px;background:var(--accent)}
.colh{background:var(--head-bg);color:var(--head-ink)}
.colh .cnt{color:rgba(255,255,255,.75)}
.rlab{color:var(--accent)}
.card{border-left:6px solid var(--c)}
.ft{border-top:1px solid var(--line)}`,
  },
  {
    id: 'b-mono',
    name: 'ミニマル・モノトーン',
    idea: 'ほぼ無彩色。会社色はアバターの輪だけに抑え、どの会社テンプレートにも馴染む',
    card: 'photo',
    elbow: 0,
    vars: {
      '--bg': '#ffffff', '--ink': '#1a1a1a', '--ink-2': '#5f5f5f', '--ink-3': '#9a9a9a', '--line': '#e6e6e6', '--wire': '#b5b5b5',
      '--band': 'transparent', '--card': 'transparent', '--card-line': 'transparent', '--accent': '#1a1a1a', '--head-bg': 'transparent', '--head-ink': '#1a1a1a',
      '--tag-bg': 'transparent', '--tag-ink': '#1a1a1a', '--radius': '0px',
    },
    css: `
.hd h1{font-weight:500;letter-spacing:.02em}
.colh{border-bottom:2px solid var(--ink)!important;font-weight:500}
.cell,.rlab{border-bottom:1px solid var(--line)}
.card{padding-left:0;box-shadow:none}
.tag{box-shadow:inset 0 0 0 1px var(--ink);font-weight:500}
.pmbox{border-style:solid;border-color:var(--line)}
.wires path{stroke-width:1.2}`,
  },
  {
    id: 'c-classic',
    name: 'クラシック罫線',
    idea: '写真なし・文字主体。PowerPoint で作ったような罫線の体制図で、役員会や社外提出向け',
    card: 'text',
    elbow: 0,
    vars: {
      '--bg': '#ffffff', '--ink': '#222222', '--ink-2': '#4a4a4a', '--ink-3': '#7a7a7a', '--line': '#c9d3df', '--wire': '#333333',
      '--band': '#ffffff', '--card': '#ffffff', '--card-line': '#6f86a3', '--accent': '#1f4e79', '--head-bg': '#1f4e79', '--head-ink': '#ffffff',
      '--tag-bg': '#1f4e79', '--tag-ink': '#ffffff', '--radius': '2px',
    },
    css: `
.hd{border-bottom:2px solid var(--accent);padding-bottom:16px}
.colh{background:var(--head-bg);color:var(--head-ink);justify-content:center}
.colh .num,.colh .cnt{color:rgba(255,255,255,.8)}
.rlab{background:#eef2f7;color:var(--accent);align-items:center;text-align:center}
.cell{border-left:1px solid var(--line);border-bottom:1px solid var(--line)}
.grid{border:1px solid var(--line)}
.card{border:1.5px solid var(--card-line);border-top:7px solid var(--c)}
.wires path{stroke-width:1.6}
.pmbox{border:1.5px dashed var(--card-line)}`,
  },
  {
    id: 'd-dark',
    name: 'ダーク・キーノート',
    idea: '濃紺の背景で、大きな画面での登壇・発表でも映える',
    card: 'photo',
    elbow: 10,
    vars: {
      '--bg': '#0d1626', '--ink': '#eef2f8', '--ink-2': '#a9b4c7', '--ink-3': '#6d7a92', '--line': '#223049', '--wire': '#5d6c88',
      '--band': 'rgba(255,255,255,.025)', '--card': '#152238', '--card-line': '#27375a', '--accent': '#56c1ff', '--head-bg': 'transparent', '--head-ink': '#eef2f8',
      '--tag-bg': '#56c1ff', '--tag-ink': '#0d1626', '--radius': '12px',
    },
    css: `
.slide{background:radial-gradient(1200px 700px at 85% -10%,rgba(86,193,255,.12),transparent 60%),var(--bg)}
.hd .eyebrow{color:var(--accent)}
.colh{border-bottom:2px solid var(--accent)!important}
.card{box-shadow:0 8px 24px rgba(0,0,0,.35);border-top:4px solid var(--c)}
.pmbox{background:rgba(255,255,255,.03)}`,
  },
];

const unitLabel = (org, a) => (a.deptIndex < 0 ? (a.unit === org.pmTitle ? 'PM' : 'オーナー') : a.unit);

function card(org, theme, p, a, col) {
  const c = company(org, p);
  const other = p.assignments.find(x => x !== a);
  const note = other ? `<div class="note">兼 ${esc(unitLabel(org, other))} ${esc(other.badge)}</div>` : '';
  const attrs = `data-id="${p.id}" data-parent="${p.parent || ''}" data-col="${col}" style="--c:${c.color}"`;
  if (theme.card === 'text') {
    return `<div class="card text" ${attrs}>
      <div class="unit">${esc(unitLabel(org, a))}${a.badge ? ` ${esc(a.badge)}` : ''}</div>
      <div class="nm">${esc(p.name)}</div>
      <div class="rl">${esc(a.role)}<span class="co">（${esc(c.short)}）</span></div>${note}
    </div>`;
  }
  return `<div class="card" ${attrs}>
    <img class="av" src="${p.avatar}" alt="">
    <div class="m">
      <div class="nm">${esc(p.name)}${a.badge ? ` <span class="tag">${esc(a.badge)}</span>` : ''}</div>
      <div class="rl">${esc(a.role)}</div>
      <div class="co"><i></i>${esc(c.short)}</div>${note}
    </div>
  </div>`;
}

export function buildRankSlide(org, theme) {
  const P = org.people;
  const { RANKS, cells, usedRanks, pmCols, weights } = computeRanks(org);
  const pmFrom = Math.min(...pmCols) + 2, pmTo = Math.max(...pmCols) + 3;
  const owner = P.get(org.ownerId);
  const pmPeople = [org.pmLeadId, ...org.pmMemberIds].map(id => P.get(id));
  const pmA = p => p.assignments.find(a => a.unit === org.pmTitle);

  let rows = `<div class="corner"></div>${org.depts.map(d => `<div class="colh"><span class="num">${String(d.index + 1).padStart(2, '0')}</span>${esc(d.name)}<span class="cnt">${d.memberIds.length}名</span></div>`).join('')}`;
  let rowNo = 2;
  const tiers = [];
  RANKS.forEach((label, r) => {
    if (!usedRanks[r]) return;
    tiers.push(r === 1 ? 'minmax(0,1.25fr)' : 'minmax(0,1fr)');
    const band = rowNo % 2 ? 'odd' : 'even';
    rows += `<div class="rlab ${band}" style="grid-row:${rowNo}">${esc(label)}</div>`;
    if (r === 0) {
      rows += `<div class="cell ${band} span" style="grid-row:${rowNo};grid-column:2/-1">${card(org, theme, owner, owner.primary, 'gov')}</div>`;
    } else if (r === 1) {
      for (let c = 2; c < org.depts.length + 2; c++) {
        if (c === pmFrom) {
          rows += `<div class="cell ${band} span" style="grid-row:${rowNo};grid-column:${pmFrom}/${pmTo}"><div class="pmbox"><div class="pml">${esc(org.pmTitle)}</div><div class="pmrow">${pmPeople.map(p => card(org, theme, p, pmA(p), 'pm')).join('')}</div></div></div>`;
          c = pmTo - 1;
        } else rows += `<div class="cell ${band}" style="grid-row:${rowNo};grid-column:${c}"></div>`;
      }
    } else {
      org.depts.forEach(d => {
        rows += `<div class="cell ${band}" style="grid-row:${rowNo};grid-column:${d.index + 2}">${cells[r][d.index].map(({ p, a }) => card(org, theme, p, a, d.index)).join('')}</div>`;
      });
    }
    rowNo++;
  });
  rows += `<div class="rlab roles" style="grid-row:${rowNo}">担当業務</div>${org.depts
    .map(d => `<div class="cell roles" style="grid-row:${rowNo};grid-column:${d.index + 2}"><ul>${d.roles.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`)
    .join('')}`;

  const legend = org.companies
    .map(c => `<span class="lg" style="--c:${c.color}"><i></i>${esc(c.short)}<small>${esc(c.tag)}</small></span>`)
    .join('');
  const vars = Object.entries(theme.vars).map(([k, v]) => `${k}:${v}`).join(';');

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>体制図スライド ${esc(theme.name)}</title>
<meta name="description" content="${esc(theme.idea)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:#8a8f98;overflow:hidden;font-family:"Noto Sans JP","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:fixed;inset:0;display:grid;place-items:center}
.slide{${vars};position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;background:var(--bg);color:var(--ink);
  padding:44px 72px 26px;display:flex;flex-direction:column;overflow:hidden}
.hd{position:relative;display:flex;justify-content:space-between;align-items:flex-end;gap:40px}
.eyebrow{font-size:15px;font-weight:700;letter-spacing:.14em;color:var(--ink-3)}
.hd h1{margin:4px 0 0;font-size:40px;line-height:1.2;font-weight:700}
.hd h1 small{font-size:24px;font-weight:500;color:var(--ink-2);margin-left:14px}
.legend{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px 26px;max-width:760px;padding-bottom:6px}
.lg{display:inline-flex;align-items:center;gap:8px;font-size:17px;font-weight:700;color:var(--ink);white-space:nowrap}
.lg i{width:14px;height:14px;border-radius:50%;background:var(--c)}
.lg small{font-size:14px;font-weight:400;color:var(--ink-2)}
.body{position:relative;flex:1;min-height:0;margin-top:20px}
.grid{position:relative;display:grid;height:100%;border-radius:var(--radius)}
.wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:1}
.wires path{fill:none;stroke:var(--wire);stroke-width:2}
.corner{grid-row:1;grid-column:1}
.colh{grid-row:1;display:flex;align-items:center;gap:12px;padding:0 20px;font-size:22px;font-weight:700;border-left:1px solid var(--bg)}
.colh .num{font-size:15px;color:var(--ink-3);font-weight:700}
.colh .cnt{margin-left:auto;font-size:16px;font-weight:400;color:var(--ink-2)}
.rlab{grid-column:1;display:flex;align-items:center;padding:0 14px;font-size:17px;white-space:nowrap;font-weight:700;color:var(--ink-2)}
.cell{display:flex;gap:18px;justify-content:center;align-items:center;padding:12px 14px;min-height:0}
.odd{background:var(--band)}
.card{position:relative;z-index:2;display:flex;gap:14px;align-items:center;width:290px;background:var(--card);border:1px solid var(--card-line);border-radius:var(--radius);padding:7px 12px}
.cell.span .card{width:auto;min-width:290px}
.card .av{width:50px;height:50px;border-radius:50%;object-fit:cover;flex:none;box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--c)}
.card .m{min-width:0}
.nm{font-size:20px;font-weight:700;white-space:nowrap;line-height:1.3}
.rl{font-size:15px;color:var(--ink-2);line-height:1.35}
.co{display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--ink-2);margin-top:2px;white-space:nowrap}
.co i{width:9px;height:9px;border-radius:50%;background:var(--c)}
.tag{display:inline-block;font-size:12.5px;font-weight:700;line-height:1;padding:4px 8px;border-radius:999px;vertical-align:3px;background:var(--tag-bg);color:var(--tag-ink)}
.note{display:inline-block;margin-top:3px;font-size:12.5px;font-weight:700;background:var(--tag-bg);color:var(--tag-ink);border-radius:4px;padding:1px 7px}
.card.text{display:block;text-align:center;padding:5px 10px 7px;width:280px}
.cell.span .card.text{min-width:280px}
.card.text .unit{font-size:13.5px;font-weight:700;color:var(--accent);line-height:1.4}
.card.text .nm{font-size:22px;line-height:1.3}
.card.text .rl{font-size:14.5px;white-space:nowrap}
.card.text .co{display:inline;font-size:13.5px;margin:0}
.pmbox{position:relative;z-index:2;border:2px dashed var(--card-line);border-radius:calc(var(--radius) + 4px);padding:4px 12px 10px;background:var(--bg)}
.pml{font-size:13px;font-weight:700;color:var(--ink-3);letter-spacing:.08em;text-align:center;margin-bottom:4px}
.pmrow{display:flex;gap:14px}
.roles{background:var(--band)}
.cell.roles{display:block;padding:10px 20px}
.cell.roles ul{margin:0;padding-left:20px;font-size:14.5px;color:var(--ink-2);line-height:1.55}
.ft{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;font-size:14px;color:var(--ink-3);letter-spacing:.04em}
${theme.css}
@page{size:1920px 1080px;margin:0}
@media print{body{background:none;overflow:visible}.stage{position:static}.slide{position:relative;transform:none!important}}
</style>
</head>
<body>
<div class="stage">
<div class="slide" id="slide">
  <div class="hd">
    <div>
      <div class="eyebrow">PROJECT ORGANIZATION ・ ${esc(org.date)}</div>
      <h1>${esc(org.title)}<small>推進体制</small></h1>
    </div>
    <div class="legend">${legend}</div>
  </div>
  <div class="body">
    <div class="grid" id="grid" style="grid-template-columns:150px ${weights.map(w => `minmax(0,${w}fr)`).join(' ')};grid-template-rows:54px ${tiers.join(' ')} auto">
      <svg class="wires" id="wires" aria-hidden="true"></svg>
      ${rows}
    </div>
  </div>
  <div class="ft"><span>社外秘 / Confidential</span><span>${org.companies.length}社 ・ ${org.people.size}名 ・ ${org.depts.length}チーム</span><span>1</span></div>
</div>
</div>
<script>
(function(){
  var slide=document.getElementById('slide'), grid=document.getElementById('grid'), svg=document.getElementById('wires'), R=${theme.elbow}, scale=1;
  function fit(){scale=Math.min(innerWidth/1920,innerHeight/1080);
    slide.style.transform='translate('+((innerWidth-1920*scale)/2)+'px,'+((innerHeight-1080*scale)/2)+'px) scale('+scale+')';}
  function box(el){var g=grid.getBoundingClientRect(),r=el.getBoundingClientRect();
    return {cx:((r.left+r.right)/2-g.left)/scale,t:(r.top-g.top)/scale,b:(r.bottom-g.top)/scale};}
  function elbow(a,b){var x1=a.cx,y1=a.b,x2=b.cx,y2=b.t,m=y1+Math.min(18,(y2-y1)/2); // bus sits just under the parent
    if(Math.abs(x1-x2)<1) return 'M'+x1+','+y1+'V'+y2;
    if(!R) return 'M'+x1+','+y1+'V'+m+'H'+x2+'V'+y2;
    var s=x2>x1?1:-1; return 'M'+x1+','+y1+'V'+(m-R)+'Q'+x1+','+m+' '+(x1+s*R)+','+m+'H'+(x2-s*R)+'Q'+x2+','+m+' '+x2+','+(m+R)+'V'+y2;}
  function draw(){
    var cards=[].slice.call(grid.querySelectorAll('.card')), out=[];
    cards.forEach(function(c){
      var pid=c.dataset.parent; if(!pid) return;
      if(c.dataset.col==='pm'&&c.dataset.id!==${JSON.stringify(org.pmLeadId)}) return;
      var cands=cards.filter(function(x){return x.dataset.id===pid;});
      var par=cands.find(function(x){return x.dataset.col===c.dataset.col;})||cands.find(function(x){return x.dataset.col==='pm';})||cands[0];
      if(!par) return;
      var src=par.dataset.col==='pm'?par.closest('.pmbox'):par, dst=c.dataset.col==='pm'?c.closest('.pmbox'):c;
      out.push('<path d="'+elbow(box(src),box(dst))+'"/>');
    });
    svg.innerHTML=out.join('');
  }
  function all(){fit();draw();}
  addEventListener('resize',all); addEventListener('load',all); document.fonts&&document.fonts.ready.then(all); all();
})();
</script>
</body>
</html>
`;
}
