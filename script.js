// ─── Cyber Audit Mini Lab · v1.1 ───────────────────────────────────────────
// Stack: HTML + CSS + JS vanilla. Sin frameworks. Sin backend.
// Autor: Matías Godoy · Legal-Tech / GRC / Ciberseguridad

let fullData = [], filteredData = [], selectedId = null;

// Mapa de impacto textual a número para cálculo de riesgo
const IMPACTO_NUM = { 'Crítico': 5, 'Alto': 4, 'Medio': 3, 'Bajo': 2, 'Mínimo': 1 };

// ─── INICIO ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data/audit_matrix.json');
    fullData = await res.json();
    fullData = fullData.map(enrichRiskData);
    filteredData = [...fullData];
    buildFilters();
    renderSummary(filteredData);
    renderTable(filteredData);
    renderCards(filteredData);
    bindFilters();
    handleResponsiveView();
    window.addEventListener('resize', handleResponsiveView);
  } catch(err) {
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:#f87171;padding:20px">Error al cargar audit_matrix.json — usá Live Server o servidor local</td></tr>';
  }
}

// ─── ENRIQUECER DATOS DE RIESGO ──────────────────────────────────────────────
function enrichRiskData(item) {
  const impNum = IMPACTO_NUM[item.impacto] || 3;
  const prob   = item.probabilidad || 3;
  const inherente = impNum * prob;
  const factorControl = item.madurez / 5;
  const residual = Math.round(inherente * (1 - factorControl * 0.6));
  return {
    ...item,
    riesgo_inherente: item.riesgo_inherente ?? inherente,
    riesgo_residual:  item.riesgo_residual  ?? residual
  };
}

// ─── CLASIFICAR NIVEL DE RIESGO ──────────────────────────────────────────────
function riesgoNivel(valor) {
  if (valor >= 18) return { label: 'Crítico', cls: 'critico' };
  if (valor >= 12) return { label: 'Alto',    cls: 'alto' };
  if (valor >= 6)  return { label: 'Medio',   cls: 'medio' };
  return               { label: 'Bajo',   cls: 'bajo' };
}

// ─── FILTROS ─────────────────────────────────────────────────────────────────
function buildFilters() {
  const dominios = [...new Set(fullData.map(d => d.dominio))];
  const sel = document.getElementById('filterDominio');
  dominios.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d; sel.appendChild(o);
  });
}

function bindFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado']
    .forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  document.getElementById('btnReset').addEventListener('click', resetFilters);
}

function applyFilters() {
  const dom    = document.getElementById('filterDominio').value;
  const pri    = document.getElementById('filterPrioridad').value;
  const imp    = document.getElementById('filterImpacto').value;
  const comp   = document.getElementById('filterCompliance').value;
  const estado = document.getElementById('filterEstado').value;
  filteredData = fullData.filter(d =>
    (!dom    || d.dominio === dom) &&
    (!pri    || d.prioridad === pri) &&
    (!imp    || d.impacto === imp) &&
    (!comp   || d.implicancia_compliance === comp) &&
    (!estado || d.estado_control === estado)
  );
  selectedId = null;
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
}

function resetFilters() {
  ['filterDominio','filterPrioridad','filterImpacto','filterCompliance','filterEstado']
    .forEach(id => document.getElementById(id).value = '');
  filteredData = [...fullData];
  selectedId = null;
  renderSummary(filteredData);
  renderTable(filteredData);
  renderCards(filteredData);
  clearDetail();
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function renderSummary(data) {
  const total    = data.length;
  const criticos = data.filter(d => d.impacto === 'Crítico').length;
  const pCritica = data.filter(d => d.prioridad === 'Crítica').length;
  const noImpl   = data.filter(d => d.estado_control === 'No implementado').length;
  const avgMad   = total ? (data.reduce((s,d) => s+d.madurez, 0) / total).toFixed(1) : '—';
  const dominios = new Set(data.map(d => d.dominio)).size;
  const madPct   = total ? (avgMad / 5 * 100).toFixed(0) : 0;

  document.getElementById('summary').innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Controles en revisión</span>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">de ${fullData.length} totales</div>
    </div>
    <div class="stat-card card-alert">
      <span class="stat-label">Impacto Crítico</span>
      <div class="stat-value">${criticos}</div>
      <div class="stat-sub">requieren atención inmediata</div>
    </div>
    <div class="stat-card card-warn">
      <span class="stat-label">Prioridad Crítica</span>
      <div class="stat-value">${pCritica}</div>
      <div class="stat-sub">sin demora aceptable</div>
    </div>
    <div class="stat-card card-danger">
      <span class="stat-label">No implementados</span>
      <div class="stat-value">${noImpl}</div>
      <div class="stat-sub">sin control activo</div>
    </div>
    <div class="stat-card">
      <span class="stat-label">Madurez promedio</span>
      <div class="stat-value">${avgMad}</div>
      <div class="stat-sub">escala 1–5 · ${dominios} dominios NIST</div>
      <div class="madurez-bar"><div class="madurez-fill" style="width:${madPct}%"></div></div>
    </div>`;

  document.getElementById('filterCount').textContent =
    data.length === fullData.length
      ? `Mostrando todos (${data.length})`
      : `${data.length} resultado${data.length!==1?'s':''} filtrado${data.length!==1?'s':''}`;
}

// ─── TABLA (DESKTOP) ─────────────────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (!data.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.id === selectedId) tr.classList.add('selected');
    const ri = riesgoNivel(item.riesgo_inherente);
    const rr = riesgoNivel(item.riesgo_residual);
    tr.innerHTML = `
      <td class="td-id">${String(item.id).padStart(2,'0')}</td>
      <td><span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span></td>
      <td class="td-riesgo">${item.riesgo}</td>
      <td><span class="badge badge-${item.impacto==='Crítico'?'critico':'alto'}">${item.impacto}</span></td>
      <td><span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span></td>
      <td><span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span></td>
      <td class="td-riesgo-num">
        <span class="riesgo-num riesgo-${ri.cls}" title="Inherente">${item.riesgo_inherente}</span>
        <span class="riesgo-arrow">→</span>
        <span class="riesgo-num riesgo-${rr.cls}" title="Residual">${item.riesgo_residual}</span>
      </td>
      <td>${renderDots(item.madurez)}</td>`;
    tr.addEventListener('click', () => {
      selectedId = item.id;
      document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      renderDetail(item);
    });
    tbody.appendChild(tr);
  });
}

// ─── CARDS (MOBILE) ──────────────────────────────────────────────────────────
function renderCards(data) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<p class="empty-state">Sin resultados para los filtros aplicados.</p>';
    return;
  }
  data.forEach(item => {
    const ri = riesgoNivel(item.riesgo_inherente);
    const rr = riesgoNivel(item.riesgo_residual);
    const card = document.createElement('div');
    card.className = 'audit-card';
    if (item.id === selectedId) card.classList.add('selected');
    card.innerHTML = `
      <div class="audit-card-header">
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="td-id">#${String(item.id).padStart(2,'0')}</span>
      </div>
      <p class="audit-card-riesgo">${item.riesgo}</p>
      <div class="audit-card-badges">
        <span class="badge badge-${item.impacto==='Crítico'?'critico':'alto'}">${item.impacto}</span>
        <span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
      </div>
      <div class="audit-card-footer">
        <span class="card-riesgo-label">
          <span class="riesgo-num riesgo-${ri.cls}">${item.riesgo_inherente}</span>
          <span class="riesgo-arrow">→</span>
          <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual}</span>
        </span>
        <button class="btn-ver-detalle">Ver detalle</button>
      </div>`;
    card.querySelector('.btn-ver-detalle').addEventListener('click', () => {
      selectedId = item.id;
      document.querySelectorAll('.audit-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      renderDetail(item);
      setTimeout(() => document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
    container.appendChild(card);
  });
}

// ─── DETALLE ─────────────────────────────────────────────────────────────────
function renderDetail(item) {
  const panel = document.getElementById('detailPanel');
  const hint  = document.getElementById('detailHint');
  const cont  = document.getElementById('detailContent');
  const ri    = riesgoNivel(item.riesgo_inherente);
  const rr    = riesgoNivel(item.riesgo_residual);

  panel.classList.add('has-content');
  hint.textContent = `Control #${String(item.id).padStart(2,'0')} · ${item.dominio}`;
  cont.className = '';

  cont.innerHTML = `<div class="detail-grid">
    <div class="detail-riesgo-header">
      <div class="detail-riesgo-title">${item.riesgo}</div>
      <div class="detail-badges">
        <span class="badge badge-${item.impacto==='Crítico'?'critico':'alto'}">${item.impacto}</span>
        <span class="badge badge-prioridad-${item.prioridad==='Crítica'?'critica':'alta'}">${item.prioridad}</span>
        <span class="badge-dominio badge-dominio-${item.dominio.toLowerCase()}">${item.dominio}</span>
        <span class="badge-estado badge-estado-${estadoClass(item.estado_control)}">${item.estado_control}</span>
      </div>
    </div>

    <div class="detail-cell detail-legal-block span-full">
      <h4>⚖ Riesgo legal / Compliance</h4>
      <p>${item.riesgo_legal ?? '—'}</p>
    </div>
    <div class="detail-cell">
      <h4>Por qué importa</h4>
      <p>${item.por_que_importa ?? '—'}</p>
    </div>
    <div class="detail-cell">
      <h4>Consecuencia potencial</h4>
      <p>${item.consecuencia_potencial ?? '—'}</p>
    </div>

    <div class="detail-cell">
      <h4>Objetivo del control</h4>
      <p>${item.objetivo_control}</p>
    </div>
    <div class="detail-cell">
      <h4>Control esperado</h4>
      <p>${item.control_esperado}</p>
    </div>

    <div class="detail-cell span-full">
      <h4>Evidencia mínima aceptable</h4>
      <div class="evidencia-split">
        <div class="evidencia-block"><span class="ev-label">Diseño del control</span><p>${item.evidencia_minima.diseno}</p></div>
        <div class="evidencia-block"><span class="ev-label">Funcionamiento del control</span><p>${item.evidencia_minima.funcionamiento}</p></div>
      </div>
    </div>

    <div class="detail-cell">
      <h4>Hallazgo potencial de auditoría</h4>
      <p>${item.hallazgo_potencial}</p>
    </div>
    <div class="detail-cell">
      <h4>Observación del auditor</h4>
      <p>${item.observacion_auditor ?? '—'}</p>
    </div>

    <div class="detail-cell">
      <h4>Plan de remediación</h4>
      <p>${item.plan_remediacion}</p>
    </div>
    <div class="detail-cell">
      <h4>Responsable · Frecuencia · Última revisión</h4>
      <p><strong>${item.responsable}</strong> · ${item.frecuencia}<br>
      <span style="color:var(--text-muted);font-size:11px">Última revisión: ${item.ultima_revision ?? '—'}</span></p>
    </div>

    <div class="detail-cell span-full">
      <h4>Scoring de riesgo · Implicancia compliance · Madurez</h4>
      <p>
        Inherente: <span class="riesgo-num riesgo-${ri.cls}">${item.riesgo_inherente} (${ri.label})</span>
        &nbsp;→&nbsp;
        Residual: <span class="riesgo-num riesgo-${rr.cls}">${item.riesgo_residual} (${rr.label})</span>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <span class="badge-compliance">${item.implicancia_compliance}</span>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Madurez: ${renderDots(item.madurez)}
      </p>
    </div>
  </div>`;

  setTimeout(() => document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}

function clearDetail() {
  const panel = document.getElementById('detailPanel');
  const hint  = document.getElementById('detailHint');
  const cont  = document.getElementById('detailContent');
  panel.classList.remove('has-content');
  hint.textContent = 'Seleccioná una fila para ver el análisis completo';
  cont.className = 'detail-empty';
  cont.innerHTML = '<div class="detail-placeholder"><span>↑</span><p>Clic en cualquier fila de la tabla</p></div>';
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function renderDots(madurez, max = 5) {
  return `<div class="madurez-dots">${
    Array.from({length: max}, (_, i) =>
      `<div class="dot ${i < madurez ? 'active' : ''}"></div>`
    ).join('')
  }</div>`;
}

function estadoClass(estado) {
  const map = {
    'No implementado': 'noimpl',
    'Parcial':         'parcial',
    'Implementado':    'impl',
    'Validado':        'validado'
  };
  return map[estado] || 'noimpl';
}

// ─── RESPONSIVE ──────────────────────────────────────────────────────────────
function handleResponsiveView() {
  const isMobile = window.innerWidth <= 768;
  const tableSection = document.getElementById('tableSection');
  const cardsSection = document.getElementById('cardsSection');
  if (tableSection) tableSection.style.display = isMobile ? 'none' : 'block';
  if (cardsSection) cardsSection.style.display = isMobile ? 'block' : 'none';
}

init();
