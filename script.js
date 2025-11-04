//* script.js - identificação integrada (Plant.id optional) + fallback público (Wikipedia filtrado)
   Instruções:
   - Para usar Plant.id: crie uma conta e cole sua chave em API_KEY.
   - O código tenta: Plant.id (se configurado) -> heurística local -> fallback Wikipedia filtrado.
*/
const API_KEY = ""; // cole sua Plant.id key aqui se tiver
const USE_PLANT_ID = Boolean(API_KEY && API_KEY.trim().length > 0);

const PLANT_CATALOG = [
  { id: 'girassol', name: 'Girassol', life: '1 ano (cultivo anual)', water: '1x por semana', light: 'Sol pleno', tips: 'Gosta de solo fértil e sol direto.', img: 'https://images.unsplash.com/photo-1508264165352-cdcc5f5b1792?auto=format&fit=crop&w=800&q=60' },
  { id: 'suculenta', name: 'Suculenta', life: '2–3 anos ou mais', water: '1x a cada 10–14 dias', light: 'Luz indireta intensa', tips: 'Pouca água; substrato bem drenado.', img: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=60' },
  { id: 'samambaia', name: 'Samambaia', life: 'vários anos com cuidados', water: '2x por semana', light: 'Luz indireta', tips: 'Solo úmido e boa ventilação.', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca7?auto=format&fit=crop&w=800&q=60' },
  { id: 'manjericao', name: 'Manjericão', life: '6 meses (sazonal)', water: '2x por semana', light: 'Sol parcial a pleno', tips: 'Evitar encharcamento; adubar levemente.', img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=60' }
];

let registros = JSON.parse(localStorage.getItem('registros')) || [];
const plantsGrid = document.getElementById('plantsGrid');
const logDiv = document.getElementById('log');
const identifyResult = document.getElementById('identifyResult');
const chartCtx = document.getElementById('chart').getContext('2d');
let chart;

function renderCatalog() {
  plantsGrid.innerHTML = PLANT_CATALOG.map(p => `
    <div class="plant-card">
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="plant-info">
        🌿 Duração: ${p.life}<br>
        💧 Regar: ${p.water}<br>
        ☀️ Luz: ${p.light}<br>
        <small>${p.tips}</small>
      </div>
    </div>
  `).join('');
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

async function identifyWithPlantId(file) {
  try {
    const b64 = await fileToDataUrl(file);
    const body = { images: [b64], modifiers: ["crops_fast", "similar_images"], plant_language: 'pt' };
    const resp = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': API_KEY },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error('Plant.id status ' + resp.status);
    const data = await resp.json();
    if (data && data.suggestions && data.suggestions.length) {
      const s = data.suggestions[0];
      return { name: s.plant_name || s.plant_details?.common_names?.[0] || s.plant_details?.scientific_name, score: s.probability };
    }
    return null;
  } catch (err) {
    console.error('Plant.id erro', err);
    return null;
  }
}

function identifySimulated(file) {
  const name = (file.name || '').toLowerCase();
  const match = PLANT_CATALOG.find(p => name.includes(p.id) || name.includes(p.name.toLowerCase().split(' ')[0]));
  if (match) return { name: match.name, source: 'simulado', info: match };
  const words = name.replace(/[^a-z0-9áéíóúãõç\s.-]/g, ' ').split(/\s|[-_.]+/).filter(Boolean);
  for (const w of words) {
    const m = PLANT_CATALOG.find(p => p.name.toLowerCase().includes(w) || p.id.includes(w));
    if (m) return { name: m.name, source: 'simulado', info: m };
  }
  return null;
}

// 🔍 Novo fallback: busca pública filtrada (Wikipedia)
async function identificarPorFallback(nomeArquivo) {
  const query = nomeArquivo.replace(/\.[^/.]+$/, ""); // remove extensão
  const response = await fetch(`https://pt.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&namespace=0&format=json&origin=*`);
  const data = await response.json();

  const termosPermitidos = ["planta", "árvore", "flor", "folha", "vegetal", "espécie", "botânica", "fruta", "gramínea", "erva", "cacto", "suculenta", "bromélia"];

  const resultadosFiltrados = data[1].filter((titulo, index) => {
    const descricao = data[2][index].toLowerCase();
    return termosPermitidos.some(t => descricao.includes(t));
  });

  const resultadosHTML = resultadosFiltrados.length
    ? resultadosFiltrados.map(r => `<p><strong>${r}</strong></p>`).join("")
    : "<p>Nenhuma planta correspondente encontrada.</p>";

  identifyResult.innerHTML = `
    <h3>Possíveis correspondências (busca pública filtrada)</h3>
    ${resultadosHTML}
    <p style="font-size: 0.9em; color: #555;">Filtro: apenas resultados relacionados a plantas.</p>
  `;
}

async function identifyPlant(file) {
  identifyResult.innerHTML = '<p class="muted">Identificando... aguarde.</p>';

  if (USE_PLANT_ID) {
    const res = await identifyWithPlantId(file);
    if (res) {
      identifyResult.innerHTML = `<h3>${res.name}</h3><p>Confiabilidade: ${Math.round((res.score || 0) * 100)}%</p>`;
      return;
    }
  }

  const sim = identifySimulated(file);
  if (sim) {
    identifyResult.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${sim.info.img}" alt="${sim.name}" style="width:120px;height:90px;object-fit:cover;border-radius:8px">
        <div>
          <h3>${sim.name} <small style="font-weight:600;color:#666">(identificação simulada)</small></h3>
          <div class="small">🌿 Duração: ${sim.info.life}<br>💧 Regar: ${sim.info.water}<br>☀️ Luz: ${sim.info.light}</div>
          <p style="margin-top:8px">${sim.info.tips}</p>
        </div>
      </div>
    `;
    return;
  }

  const filename = (file.name || '').replace(/\.[^/.]+$/, '');
  await identificarPorFallback(filename);
}

document.getElementById('identifyBtn').addEventListener('click', async () => {
  const input = document.getElementById('photoInput');
  if (!input.files || !input.files[0]) {
    alert('Selecione uma foto');
    return;
  }
  const file = input.files[0];
  await identifyPlant(file);
});

function renderLog() {
  if (!registros.length) {
    logDiv.innerHTML = '<p class="muted">Nenhum registro ainda.</p>';
    return;
  }
  logDiv.innerHTML = registros.map((r, i) => `
    <div class="entry">
      <div><strong>${r.text}</strong><div class="small">${r.t}</div></div>
      <div><button onclick="deleteRecord(${i})">🗑</button></div>
    </div>
  `).join('');
}

window.deleteRecord = function (i) {
  if (!confirm('Apagar registro?')) return;
  registros.splice(i, 1);
  localStorage.setItem('registros', JSON.stringify(registros));
  renderLog();
  renderChart();
}

document.getElementById('addRecord').addEventListener('click', () => {
  const name = document.getElementById('plantName').value.trim();
  const action = document.getElementById('action').value;
  const time = document.getElementById('time').value;
  if (!name || !time) return alert('Preencha todos os campos');
  const emoji = action === 'rega' ? '💧' : action === 'adubo' ? '🌾' : '✂️';
  const text = `${emoji} ${action.toUpperCase()} — ${name} às ${time}`;
  registros.unshift({ text, action, t: new Date().toLocaleString() });
  localStorage.setItem('registros', JSON.stringify(registros));
  renderLog();
  renderChart();
  document.getElementById('plantName').value = '';
  document.getElementById('time').value = '';
});

function renderChart() {
  const regas = registros.filter(r => r.action === 'rega').length;
  const adubos = registros.filter(r => r.action === 'adubo').length;
  const podas = registros.filter(r => r.action === 'poda').length;
  if (chart) chart.destroy();
  chart = new Chart(chartCtx, {
    type: 'doughnut',
    data: {
      labels: ['Regas', 'Adubos', 'Podas'],
      datasets: [{ data: [regas, adubos, podas], backgroundColor: ['#43a047', '#8d6e63', '#ffb300'] }]
    },
    options: { responsive: true }
  });
}

function renderLife() {
  const lifeGrid = document.getElementById('lifeGrid');
  lifeGrid.innerHTML = PLANT_CATALOG.map(p => `
    <div class="life-card">
      <h4>${p.name}</h4>
      <div class="small">Fases típicas: Germinação → Crescimento → Floração → Maturação</div>
      <p style="margin-top:8px">Tempo médio de vida/uso: <strong>${p.life}</strong></p>
      <p class="small">Dica: marque a fase da sua planta no relatório para acompanhar o desenvolvimento.</p>
    </div>
  `).join('');
}

document.getElementById('themeToggle').addEventListener('click', () => document.body.classList.toggle('dark'));

renderCatalog();
renderLife();
renderLog();
renderChart();
