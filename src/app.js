'use strict';

const DATABASE_URL = 'data/connectome.json';

let nodes = [];
let edges = [];
let colors = {};
let stats = {};
let networks = [];
let levels = [];
let positions = [];
let structures = [];
let nodeMap = {};
let metadata = {};

async function loadConnectomeDatabase() {
  if (window.CONNECTOME_DATABASE) {
    return window.CONNECTOME_DATABASE;
  }

  const response = await fetch(DATABASE_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Cannot load database: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function applyConnectomeDatabase(database) {
  metadata = database.metadata || {};
  nodes = database.nodes || [];
  edges = database.edges || [];
  colors = database.colors || {};
  stats = database.stats || {};
  networks = database.filters?.networks || [];
  levels = database.filters?.levels || [];
  positions = database.filters?.positions || [];
  structures = database.filters?.structures || [];
  nodeMap = Object.fromEntries(nodes.map(n => [n.label, n]));
}

function updateStaticUi() {
  const modelName = metadata.name || 'Brain Connectome';
  document.title = `${modelName} Interactive Graph`;
  byId('modelTitle').textContent = modelName;
  byId('statRich').textContent = stats.rich_nodes ?? nodes.filter(n => n.rich).length;
  byId('statIsolated').textContent = stats.isolated_nodes ?? nodes.filter(n => !n.connected).length;
  byId('weightMin').max = Math.ceil(stats.max_weight || Math.max(...edges.map(e => e.weight || 0), 0));
}

function showStartupError(error) {
  const plot = document.getElementById('plot');
  if (plot) {
    plot.innerHTML = `<div class="startup-error"><b>Не удалось загрузить базу данных.</b><br>${error.message}</div>`;
  }
  console.error(error);
}

const edgeClasses = ['weak','medium','strong','top 10%'];
const edgeColors = {
  'weak': 'rgba(120,120,120,0.45)',
  'medium': 'rgba(70,70,70,0.70)',
  'strong': 'rgba(20,20,20,0.88)',
  'top 10%': 'rgba(0,0,0,1.0)'
};
const edgeWidths = { 'weak': 1.6, 'medium': 3, 'strong': 5.5, 'top 10%': 8.5 };

function niceName(s) { return String(s || '').replaceAll('_', ' '); }
function byId(id) { return document.getElementById(id); }
function selectedChecks(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]`)].filter(x => x.checked).map(x => x.value);
}
function makeChecks(containerId, items, useColor=false) {
  const el = byId(containerId);
  el.innerHTML = '';
  items.forEach(item => {
    const color = colors[item] || '#999999';
    const div = document.createElement('label');
    div.className = 'checkline';
    div.innerHTML = `<input type="checkbox" value="${item}" checked /> ${useColor ? `<span class="swatch" style="background:${color}"></span>` : ''} <span>${item}</span>`;
    el.appendChild(div);
  });
  el.querySelectorAll('input').forEach(inp => inp.addEventListener('change', render));
}
function makeStructureSelect() {
  const sel = byId('structureFilter');
  structures.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o); });
}
function makeEdgeClassChecks() {
  const el = byId('edgeClassChecks');
  el.innerHTML = '';
  edgeClasses.forEach(item => {
    const div = document.createElement('label');
    div.className = 'checkline';
    const checked = item === 'weak' ? '' : 'checked';
    div.innerHTML = `<input type="checkbox" value="${item}" ${checked} /> <span style="display:inline-block;width:28px;height:3px;background:${edgeColors[item]}"></span> <span>${item}</span>`;
    el.appendChild(div);
  });
  el.querySelectorAll('input').forEach(inp => inp.addEventListener('change', render));
}
function sizeForNode(n) {
  const mode = byId('sizeMode').value;
  if (mode === 'constant') return 7;
  if (mode === 'voxels') return 5 + 14 * Math.sqrt((n.voxels || 0) / Math.max(...nodes.map(x => x.voxels || 1)));
  return 5 + 18 * Math.sqrt((n.strength || 0) / Math.max(...nodes.map(x => x.strength || 1)));
}
function cubeSizeForNode(n) { return Math.max(2.3, sizeForNode(n) / 2.2); }
function nodeHover(n) {
  return `<b>${n.label}</b><br>` +
    `YEO/Buckner: ${n.yeo}<br>` +
    `Rich: ${n.rich ? 'TRUE' : 'FALSE'}<br>` +
    `РџРѕР·РёС†РёСЏ: ${n.position}<br>` +
    `РЈСЂРѕРІРµРЅСЊ: ${n.level}<br>` +
    `РЎС‚СЂСѓРєС‚СѓСЂР°: ${n.structure}<br>` +
    `NEW: (${n.x}, ${n.y}, ${n.z})<br>` +
    `MNI: (${n.xmni}, ${n.ymni}, ${n.zmni})<br>` +
    `Degree: ${n.degree}<br>` +
    `РЎРёР»Р° СЃРІСЏР·РµР№: ${Math.round(n.strength*10)/10}<br>` +
    `Voxels: ${n.voxels}`;
}
function edgeHover(e) {
  return `<b>${e.source}</b> в†” <b>${e.target}</b><br>weight: ${e.weight}<br>class: ${e.edgeClass}`;
}
function cubeTrace(n) {
  const d = cubeSizeForNode(n);
  const x0 = n.x, y0 = n.y, z0 = n.z;
  const xs = [x0-d,x0+d,x0+d,x0-d,x0-d,x0+d,x0+d,x0-d];
  const ys = [y0-d,y0-d,y0+d,y0+d,y0-d,y0-d,y0+d,y0+d];
  const zs = [z0-d,z0-d,z0-d,z0-d,z0+d,z0+d,z0+d,z0+d];
  const I = [0,0,4,4,0,0,1,1,2,2,3,3];
  const J = [1,2,6,7,4,5,5,6,6,7,7,4];
  const K = [2,3,7,5,5,1,6,2,7,3,4,0];
  return {
    type: 'mesh3d',
    x: xs, y: ys, z: zs,
    i: I, j: J, k: K,
    name: n.label,
    color: colors[n.yeo] || '#999999',
    opacity: 0.95,
    flatshading: true,
    hoverinfo: 'text',
    text: Array(8).fill(nodeHover(n)),
    showscale: false,
    showlegend: false
  };
}
function filteredNodes() {
  const q = byId('search').value.trim().toLowerCase();
  const richMode = byId('richFilter').value;
  const connectedMode = byId('connectedFilter').value;
  const selectedNetworks = selectedChecks('networkChecks');
  const selectedPositions = selectedChecks('positionChecks');
  const selectedLevels = selectedChecks('levelChecks');
  const structure = byId('structureFilter').value;
  return nodes.filter(n => {
    if (q && !(n.label.toLowerCase().includes(q) || n.structure.toLowerCase().includes(q) || n.yeo.toLowerCase().includes(q))) return false;
    if (richMode === 'rich' && !n.rich) return false;
    if (richMode === 'notRich' && n.rich) return false;
    if (connectedMode === 'connected' && !n.connected) return false;
    if (connectedMode === 'isolated' && n.connected) return false;
    if (!selectedNetworks.includes(n.yeo)) return false;
    if (!selectedPositions.includes(n.position)) return false;
    if (!selectedLevels.includes(n.level)) return false;
    if (structure !== 'all' && n.structure !== structure) return false;
    return true;
  });
}
function filteredEdges(visibleSet) {
  if (!byId('showEdges').checked) return [];
  const minWeight = Number(byId('weightMin').value || 0);
  const selectedEdgeClasses = selectedChecks('edgeClassChecks');
  return edges.filter(e => visibleSet.has(e.source) && visibleSet.has(e.target) && e.weight >= minWeight && selectedEdgeClasses.includes(e.edgeClass));
}
function makeTraces(vnodes, vedges) {
  const traces = [];

  // Edge traces by category.
  for (const cls of edgeClasses) {
    const es = vedges.filter(e => e.edgeClass === cls);
    if (!es.length) continue;
    const x=[], y=[], z=[], text=[];
    es.forEach(e => {
      const a = nodeMap[e.source], b = nodeMap[e.target];
      x.push(a.x, b.x, null); y.push(a.y, b.y, null); z.push(a.z, b.z, null);
      text.push(edgeHover(e), edgeHover(e), null);
    });
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x, y, z, text,
      hoverinfo: 'text',
      name: `${cls} edges (${es.length})`,
      line: { color: edgeColors[cls], width: edgeWidths[cls] },
      showlegend: true
    });
  }

  // Non-rich nodes by network.
  for (const net of networks) {
    const ns = vnodes.filter(n => !n.rich && n.yeo === net);
    if (!ns.length) continue;
    const labels = labelArray(ns);
    traces.push({
      type: 'scatter3d',
      mode: byId('showLabels').checked ? 'markers+text' : 'markers',
      x: ns.map(n => n.x), y: ns.map(n => n.y), z: ns.map(n => n.z),
      text: labels,
      textposition: 'top center',
      hovertext: ns.map(nodeHover),
      hoverinfo: 'text',
      name: net,
      marker: {
        size: ns.map(sizeForNode),
        color: colors[net] || '#999999',
        opacity: 0.94,
        line: { color: 'rgba(255,255,255,0.65)', width: 0.7 }
      },
      textfont: { size: 10, color: '#111827' },
      showlegend: true
    });
  }

  // Rich cubes + center markers/labels.
  const richNodes = vnodes.filter(n => n.rich);
  richNodes.forEach(n => traces.push(cubeTrace(n)));
  if (richNodes.length) {
    traces.push({
      type: 'scatter3d',
      mode: byId('showLabels').checked ? 'markers+text' : 'markers',
      x: richNodes.map(n => n.x), y: richNodes.map(n => n.y), z: richNodes.map(n => n.z),
      text: labelArray(richNodes),
      textposition: 'top center',
      hovertext: richNodes.map(nodeHover),
      hoverinfo: 'text',
      name: `Rich-club cubes (${richNodes.length})`,
      marker: {
        size: richNodes.map(n => Math.max(3, sizeForNode(n) * 0.55)),
        symbol: 'diamond',
        color: richNodes.map(n => colors[n.yeo] || '#999999'),
        opacity: 0.25,
        line: { color: '#111111', width: 2 }
      },
      textfont: { size: 11, color: '#111827' },
      showlegend: true
    });
  }
  return traces;
}
function labelArray(ns) {
  if (!byId('showLabels').checked) return ns.map(n => '');
  if (!byId('showOnlyHubs').checked) return ns.map(n => n.label);
  const threshold = [...nodes].sort((a,b)=>b.strength-a.strength)[Math.min(14,nodes.length-1)].strength;
  return ns.map(n => (n.rich || n.strength >= threshold) ? n.label : '');
}
function updateTable(vnodes) {
  const sortBy = byId('sortBy').value;
  const arr = [...vnodes].sort((a,b) => {
    if (sortBy === 'strength') return b.strength - a.strength;
    if (sortBy === 'rich') return Number(b.rich) - Number(a.rich) || a.label.localeCompare(b.label);
    return String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) || a.label.localeCompare(b.label);
  });
  const rows = arr.map(n => `<tr><td>${n.label}</td><td><span class="pill" style="background:${colors[n.yeo] || '#777'}">${n.yeo}</span></td><td>${n.rich ? '✓' : ''}</td><td>${n.position}</td><td>${n.level}</td><td>${Math.round(n.strength)}</td></tr>`).join('');
  byId('nodeList').innerHTML = `<table><thead><tr><th>Точка</th><th>Сеть</th><th>Rich</th><th>Поз.</th><th>Уровень</th><th>Сила</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function render() {
  byId('weightValue').textContent = byId('weightMin').value;
  const vnodes = filteredNodes();
  const visibleSet = new Set(vnodes.map(n => n.label));
  const vedges = filteredEdges(visibleSet);
  byId('statNodes').textContent = vnodes.length;
  byId('statEdges').textContent = vedges.length;
  updateTable(vnodes);
  const traces = makeTraces(vnodes, vedges);
  const layout = {
    title: { text: `${metadata.name || 'Brain Connectome'}: X NEW / Y NEW / Z NEW`, font: { size: 18 } },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { l: 0, r: 0, b: 0, t: 46 },
    showlegend: true,
    legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(255,255,255,0.78)', font: { size: 11 } },
    scene: {
      xaxis: { title: 'X NEW (left-right)', backgroundcolor: 'rgb(236,242,250)', gridcolor: 'white', zerolinecolor: 'white' },
      yaxis: { title: 'Y NEW (posterior-anterior)', backgroundcolor: 'rgb(236,242,250)', gridcolor: 'white', zerolinecolor: 'white' },
      zaxis: { title: 'Z NEW (inferior-superior)', backgroundcolor: 'rgb(236,242,250)', gridcolor: 'white', zerolinecolor: 'white' },
      aspectmode: 'data',
      camera: { eye: { x: 1.65, y: 1.65, z: 1.2 } }
    }
  };
  const config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d','select2d'] };
  Plotly.react('plot', traces, layout, config);
}
function downloadVisibleCsv() {
  const vnodes = filteredNodes();
  const header = ['label','x','y','z','yeo','rich','position','level','structure','degree','strength','voxels'];
  const rows = vnodes.map(n => header.map(h => JSON.stringify(n[h] ?? '')).join(','));
  const csv = header.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'visible_connectome_nodes.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function resetFilters() {
  byId('search').value = '';
  byId('richFilter').value = 'all';
  byId('connectedFilter').value = 'all';
  byId('structureFilter').value = 'all';
  byId('showEdges').checked = false;
  byId('showLabels').checked = false;
  byId('showOnlyHubs').checked = true;
  byId('sizeMode').value = 'voxels';
  byId('weightMin').value = 0;
  document.querySelectorAll('#networkChecks input,#positionChecks input,#levelChecks input').forEach(i => i.checked = true);
  document.querySelectorAll('#edgeClassChecks input').forEach(i => i.checked = i.value !== 'weak');
  render();
}
function init() {
  updateStaticUi();
  makeChecks('networkChecks', networks, true);
  makeChecks('positionChecks', positions, false);
  makeChecks('levelChecks', levels, false);
  makeStructureSelect();
  makeEdgeClassChecks();
  ['search','richFilter','connectedFilter','structureFilter','showEdges','showLabels','showOnlyHubs','sizeMode','sortBy','weightMin'].forEach(id => byId(id).addEventListener(id === 'search' ? 'input' : 'change', render));
  byId('allNetworks').addEventListener('click', () => { document.querySelectorAll('#networkChecks input').forEach(i => i.checked = true); render(); });
  byId('noNetworks').addEventListener('click', () => { document.querySelectorAll('#networkChecks input').forEach(i => i.checked = false); render(); });
  byId('reset').addEventListener('click', resetFilters);
  byId('downloadCsv').addEventListener('click', downloadVisibleCsv);
  resetFilters();
}

loadConnectomeDatabase()
  .then(database => {
    applyConnectomeDatabase(database);
    init();
  })
  .catch(showStartupError);
